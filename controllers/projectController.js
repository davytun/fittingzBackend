const { PrismaClient, ProjectStatus } = require("@prisma/client");
const { validationResult } = require("express-validator");

const prisma = new PrismaClient();

// Ultra-reliable date parser
const parseProjectDate = (dateString, isEndOfDay = false) => {
  if (!dateString) return null;

  // First validate the basic format (YYYY-MM-DD)
  const dateRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
  if (!dateRegex.test(dateString)) {
    throw new Error(
      `Invalid date format. Expected YYYY-MM-DD but got ${dateString}`
    );
  }

  // Extract components
  const [, year, month, day] = dateString.match(dateRegex);

  // Validate date components
  const dateObj = new Date(`${year}-${month}-${day}T00:00:00Z`);
  if (isNaN(dateObj.getTime())) {
    throw new Error(`Invalid date components in ${dateString}`);
  }

  // Create final date in UTC
  const timePart = isEndOfDay ? "T23:59:59.999Z" : "T00:00:00.000Z";
  const finalDate = new Date(`${year}-${month}-${day}${timePart}`);

  return finalDate;
};

exports.createProjectForClient = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { clientId } = req.params;
  const { name, description, status, startDate, dueDate } = req.body;
  const adminId = req.user.id;

  try {
    // Verify client exists and belongs to admin
    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) return res.status(404).json({ message: "Client not found" });
    if (client.adminId !== adminId)
      return res.status(403).json({ message: "Forbidden" });

    // Parse dates with comprehensive validation
    let parsedStartDate, parsedDueDate;
    try {
      parsedStartDate = startDate ? parseProjectDate(startDate) : null;
      parsedDueDate = dueDate ? parseProjectDate(dueDate, true) : null;
    } catch (dateError) {
      return res.status(400).json({
        message: "Invalid date input",
        details: dateError.message,
        expectedFormat: "YYYY-MM-DD",
        example: "2025-07-15",
      });
    }

    // Validate business logic
    if (parsedStartDate && parsedDueDate && parsedDueDate < parsedStartDate) {
      return res.status(400).json({
        message: "Due date cannot be before start date",
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

    res.status(201).json(project);
  } catch (error) {
    console.error("Project creation error:", error);
    if (error.code === "P2003") {
      return res
        .status(400)
        .json({ message: "Invalid client or admin reference" });
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

  try {
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
    res.status(200).json(updatedProject);
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

    res.status(200).json({ message: "Project deleted successfully" });
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
