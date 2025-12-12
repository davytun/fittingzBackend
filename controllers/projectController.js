const { PrismaClient, ProjectStatus } = require("@prisma/client");
const { validationResult } = require("express-validator");
const { getIO } = require("../socket");
const cache = require('../utils/cache');
const { trackActivity, ActivityTypes } = require('../utils/activityTracker');
const { notifyProjectUpdate } = require('../utils/notificationHelper');

const prisma = new PrismaClient();

// Nigeria-aware date parser (GMT+1)
const parseProjectDate = (dateInput, isEndOfDay = false) => {
  if (!dateInput) return null;

  // Handle both string and Date object inputs
  let dateString;
  if (dateInput instanceof Date) {
    // Convert Date object to YYYY-MM-DD string in local time
    const year = dateInput.getFullYear();
    const month = String(dateInput.getMonth() + 1).padStart(2, "0");
    const day = String(dateInput.getDate()).padStart(2, "0");
    dateString = `${year}-${month}-${day}`;
  } else if (typeof dateInput === "string") {
    dateString = dateInput;
  } else {
    throw new Error("Invalid date input type");
  }

  // Validate format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    throw new Error(`Expected YYYY-MM-DD format but got ${dateString}`);
  }

  // Create date in Nigeria time (GMT+1) then convert to UTC
  const nigeriaOffset = 60; // minutes for GMT+1
  const date = new Date(dateString);
  date.setMinutes(date.getMinutes() + nigeriaOffset);

  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date components in ${dateString}`);
  }

  // Set time component
  if (isEndOfDay) {
    date.setUTCHours(23, 59, 59, 999);
  } else {
    date.setUTCHours(0, 0, 0, 0);
  }

  return date;
};

exports.createProjectForClient = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { clientId } = req.params;
  const { name, description, status, startDate, dueDate } = req.body;
  const adminId = req.user.id;

  console.log("Raw input:", {
    startDate,
    dueDate,
    typeStart: typeof startDate,
    typeDue: typeof dueDate,
  });

  try {
    // Client verification
    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) return res.status(404).json({ message: "Client not found" });
    if (client.adminId !== adminId)
      return res.status(403).json({ message: "Forbidden" });

    // Date parsing with Nigeria timezone awareness
    let parsedStartDate, parsedDueDate;
    try {
      parsedStartDate = startDate ? parseProjectDate(startDate) : null;
      parsedDueDate = dueDate ? parseProjectDate(dueDate, true) : null;
    } catch (dateError) {
      return res.status(400).json({
        message: "Date processing error",
        details: dateError.message,
        solution: "Please provide dates as strings in YYYY-MM-DD format",
        example: { startDate: "2025-07-10", dueDate: "2025-07-15" },
      });
    }

    // Business logic validation
    if (parsedStartDate && parsedDueDate && parsedDueDate < parsedStartDate) {
      return res.status(400).json({
        message: "Due date must be after start date",
        startDate: parsedStartDate.toISOString(),
        dueDate: parsedDueDate.toISOString(),
      });
    }

    // Create project
    const project = await prisma.project.create({
      data: {
        name,
        description,
        status: status || ProjectStatus.PENDING,
        startDate: parsedStartDate,
        dueDate: parsedDueDate,
        clientId,
        adminId,
      },
    });

    // Clear cache
    await cache.delPattern(`projects:admin:${adminId}:*`);
    await cache.delPattern(`projects:client:${clientId}:*`);

    await trackActivity(
      adminId,
      ActivityTypes.PROJECT_CREATED,
      `New project created: ${name}`,
      `Project "${name}" has been created for ${client.name}`,
      project.id,
      'Project'
    );

    res.status(201).json(project);
    getIO().emit("project_created", project);
  } catch (error) {
    console.error("Project creation error:", error);
    if (error.code === "P2003") {
      return res.status(400).json({ message: "Invalid client reference" });
    }
    next(error);
  }
};

// Get all projects for the authenticated admin
exports.getAllProjectsForAdmin = async (req, res, next) => {
  const adminId = req.user.id;
  const page = parseInt(req.query.page, 10) || 1;
  const pageSize = parseInt(req.query.pageSize, 10) || 10;
  const skip = (page - 1) * pageSize;
  const cacheKey = `projects:admin:${adminId}:${page}:${pageSize}`;

  try {
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return res.status(200).json(cachedData);
    }

    const projects = await prisma.project.findMany({
      where: { adminId },
      include: { client: { select: { name: true, id: true } } }, // Include client name and id
      orderBy: { createdAt: "desc" },
      skip: skip,
      take: pageSize,
    });

    const totalProjects = await prisma.project.count({
      where: { adminId },
    });

    const result = {
      data: projects,
      pagination: {
        page,
        pageSize,
        total: totalProjects,
        totalPages: Math.ceil(totalProjects / pageSize),
      },
    };

    await cache.set(cacheKey, result, 300);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// Get all projects for a specific client (owned by the authenticated admin)
exports.getProjectsByClientId = async (req, res, next) => {
  const { clientId } = req.params;
  const adminId = req.user.id;
  const page = parseInt(req.query.page, 10) || 1;
  const pageSize = parseInt(req.query.pageSize, 10) || 10;
  const skip = (page - 1) * pageSize;

  try {
    // Verify client exists and belongs to the admin first
    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }
    if (client.adminId !== adminId) {
      return res.status(403).json({
        message: "Forbidden: You do not have access to this client's projects",
      });
    }

    const projects = await prisma.project.findMany({
      where: {
        clientId: clientId,
        adminId: adminId, // Double check adminId, though client check should suffice
      },
      include: { client: { select: { name: true, id: true } } },
      orderBy: { createdAt: "desc" },
      skip: skip,
      take: pageSize,
    });

    const totalProjects = await prisma.project.count({
      where: {
        clientId: clientId,
        adminId: adminId,
      },
    });

    res.status(200).json({
      data: projects,
      pagination: {
        page,
        pageSize,
        total: totalProjects,
        totalPages: Math.ceil(totalProjects / pageSize),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get a single project by ID
exports.getProjectById = async (req, res, next) => {
  const { projectId } = req.params;
  const adminId = req.user.id;

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { client: { select: { name: true, id: true } } },
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    if (project.adminId !== adminId) {
      return res
        .status(403)
        .json({ message: "Forbidden: You do not have access to this project" });
    }
    res.status(200).json(project);
  } catch (error) {
    next(error);
  }
};

// Update a project by ID
exports.updateProject = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { projectId } = req.params;
  const { name, description, status, startDate, dueDate } = req.body;
  const adminId = req.user.id;

  try {
    const existingProject = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!existingProject) {
      return res.status(404).json({ message: "Project not found" });
    }
    if (existingProject.adminId !== adminId) {
      return res
        .status(403)
        .json({ message: "Forbidden: You cannot update this project" });
    }

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        name: name || undefined,
        description: description || undefined,
        status: status || undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
      },
      include: { client: { select: { name: true, id: true } } },
    });
    // Clear cache
    await cache.delPattern(`projects:admin:${adminId}:*`);
    await cache.delPattern(`projects:client:${updatedProject.clientId}:*`);
    await cache.del(`project:${projectId}`);

    if (status && status !== existingProject.status) {
      await trackActivity(
        adminId,
        ActivityTypes.PROJECT_STATUS_CHANGED,
        `Project status updated: ${updatedProject.name}`,
        `Project "${updatedProject.name}" status changed to ${status}`,
        updatedProject.id,
        'Project'
      );
      
      await notifyProjectUpdate(adminId, updatedProject.name, status, updatedProject.id);
    }

    res.status(200).json(updatedProject);
    getIO().emit("project_updated", updatedProject);
  } catch (error) {
    // Handle specific Prisma errors if needed, e.g., P2025 (Record to update not found)
    next(error);
  }
};

// Delete a project by ID
exports.deleteProject = async (req, res, next) => {
  const { projectId } = req.params;
  const adminId = req.user.id;

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    if (project.adminId !== adminId) {
      return res
        .status(403)
        .json({ message: "Forbidden: You cannot delete this project" });
    }

    await prisma.project.delete({
      where: { id: projectId },
    });

    // Clear cache
    await cache.delPattern(`projects:admin:${adminId}:*`);
    await cache.delPattern(`projects:client:${project.clientId}:*`);
    await cache.del(`project:${projectId}`);

    res.status(200).json({ message: "Project deleted successfully" });
    getIO().emit("project_deleted", { id: projectId });
  } catch (error) {
    if (error.code === "P2025") {
      // Record to delete not found
      return res
        .status(404)
        .json({ message: "Project not found or already deleted." });
    }
    next(error);
  }
};
