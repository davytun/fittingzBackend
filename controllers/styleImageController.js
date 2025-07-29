const { PrismaClient } = require("@prisma/client");
const { validationResult } = require("express-validator");
const { cloudinary } = require("../config/cloudinary");

const prisma = new PrismaClient();

// Upload a style image for a client
exports.uploadStyleImage = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    if (req.files && req.files.length > 0) {
      try {
        for (const file of req.files) {
          await cloudinary.uploader.destroy(file.public_id);
        }
      } catch (cloudinaryError) {
        console.error(
          "Error deleting files from Cloudinary after validation error:",
          cloudinaryError
        );
      }
    }
    return res.status(400).json({ errors: errors.array() });
  }

  const { clientId } = req.params;
  const { category, description } = req.body;
  const adminId = req.user.id;

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: "No image files uploaded." });
  }

  try {
    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) {
      for (const file of req.files) {
        await cloudinary.uploader.destroy(file.public_id);
      }
      return res.status(404).json({ message: "Client not found" });
    }
    if (client.adminId !== adminId) {
      for (const file of req.files) {
        await cloudinary.uploader.destroy(file.public_id);
      }
      return res.status(403).json({
        message:
          "Forbidden: You do not have access to this client's style images",
      });
    }

    const styleImages = [];
    for (const file of req.files) {
      const styleImage = await prisma.styleImage.create({
        data: {
          client: {
            connect: { id: clientId },
          },
          imageUrl: file.path,
          publicId: file.filename,
          category: category || null,
          description: description || null,
          admin: {
            connect: {
              id: adminId,
            },
          },
        },
      });
      styleImages.push(styleImage);
    }

    res.status(201).json(styleImages);
  } catch (error) {
    if (req.files && req.files.length > 0) {
      try {
        for (const file of req.files) {
          await cloudinary.uploader.destroy(file.public_id);
        }
      } catch (cloudinaryError) {
        console.error(
          "Error deleting files from Cloudinary after DB error:",
          cloudinaryError
        );
      }
    }
    next(error);
  }
};

exports.uploadStyleImageForAdmin = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    if (req.files && req.files.length > 0) {
      try {
        for (const file of req.files) {
          await cloudinary.uploader.destroy(file.public_id);
        }
      } catch (cloudinaryError) {
        console.error(
          "Error deleting files from Cloudinary after validation error:",
          cloudinaryError
        );
      }
    }
    return res.status(400).json({ errors: errors.array() });
  }

  const { category, description } = req.body;
  const adminId = req.user.id;

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: "No image files uploaded." });
  }

  try {
    const styleImages = [];
    for (const file of req.files) {
      const styleImage = await prisma.styleImage.create({
        data: {
          imageUrl: file.path,
          publicId: file.filename,
          category: category || null,
          description: description || null,
          admin: {
            connect: {
              id: adminId,
            },
          },
        },
      });
      styleImages.push(styleImage);
    }

    res.status(201).json(styleImages);
  } catch (error) {
    console.error("Prisma create error in uploadStyleImageForAdmin:", error);
    if (req.files && req.files.length > 0) {
      try {
        for (const file of req.files) {
          await cloudinary.uploader.destroy(file.public_id);
        }
      } catch (cloudinaryError) {
        console.error(
          "Error deleting files from Cloudinary after DB error:",
          cloudinaryError
        );
      }
    }
    next(error);
  }
};

// Get all style images for a specific client
exports.getStyleImagesByClientId = async (req, res, next) => {
  const { clientId } = req.params;
  const adminId = req.user.id;
  const page = parseInt(req.query.page, 10) || 1;
  const pageSize = parseInt(req.query.pageSize, 10) || 10;
  const skip = (page - 1) * pageSize;

  try {
    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }
    if (client.adminId !== adminId) {
      return res.status(403).json({
        message:
          "Forbidden: You do not have access to this client's style images",
      });
    }

    const styleImages = await prisma.styleImage.findMany({
      where: {
        client: {
          id: clientId,
        },
      },
      orderBy: { createdAt: "desc" },
      skip: skip,
      take: pageSize,
    });

    const totalStyleImages = await prisma.styleImage.count({
      where: {
        client: {
          id: clientId,
        },
      },
    });

    res.status(200).json({
      data: styleImages,
      pagination: {
        page,
        pageSize,
        total: totalStyleImages,
        totalPages: Math.ceil(totalStyleImages / pageSize),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get all style images uploaded by the admin (across all their clients or admin-owned)
exports.getStyleImagesByAdmin = async (req, res, next) => {
  const adminId = req.user.id;
  const page = parseInt(req.query.page, 10) || 1;
  const pageSize = parseInt(req.query.pageSize, 10) || 10;
  const skip = (page - 1) * pageSize;

  try {
    // Fetch all client IDs owned by the admin
    const clients = await prisma.client.findMany({
      where: { adminId },
      select: { id: true },
    });

    const clientIds = clients.map((client) => client.id);

    // Build the where clause dynamically
    const whereClause = {
      OR: [
        {
          admin: {
            id: adminId,
          },
        },
        {
          client: {
            id: {
              in: clientIds,
            },
          },
        },
      ],
    };

    // Fetch style images
    const styleImages = await prisma.styleImage.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      skip: skip,
      take: pageSize,
    });

    // Count total style images for pagination
    const totalStyleImages = await prisma.styleImage.count({
      where: whereClause,
    });

    res.status(200).json({
      data: styleImages,
      pagination: {
        page,
        pageSize,
        total: totalStyleImages,
        totalPages: Math.ceil(totalStyleImages / pageSize),
      },
    });
  } catch (error) {
    console.error("Error fetching style images for admin:", error);
    next(error);
  }
};

// Delete a style image by its ID
exports.deleteStyleImage = async (req, res, next) => {
  const { imageId } = req.params;
  const adminId = req.user.id;
  console.log(
    `Attempting to delete StyleImage with ID: ${imageId}, by admin: ${adminId}`
  );

  try {
    const styleImage = await prisma.styleImage.findUnique({
      where: { id: imageId },
      include: { client: true },
    });
    console.log("StyleImage found:", styleImage ? styleImage : "Not found");

    if (!styleImage) {
      console.log(`StyleImage with ID ${imageId} not found in database`);
      return res.status(404).json({ message: "Style image not found" });
    }

    if (styleImage.client?.adminId && styleImage.client.adminId !== adminId) {
      console.log(
        `Authorization failed: styleImage.client.adminId=${styleImage.client.adminId}, req.user.id=${adminId}`
      );
      return res
        .status(403)
        .json({ message: "Forbidden: You cannot delete this style image" });
    }

    if (styleImage.publicId) {
      console.log(
        `Deleting Cloudinary image with publicId: ${styleImage.publicId}`
      );
      try {
        await cloudinary.uploader.destroy(styleImage.publicId);
        console.log(`Cloudinary image deleted: ${styleImage.publicId}`);
      } catch (cloudinaryError) {
        console.error(
          `Cloudinary deletion failed for publicId ${styleImage.publicId}:`,
          cloudinaryError
        );
      }
    }

    await prisma.styleImage.delete({
      where: { id: imageId },
    });
    console.log(`StyleImage with ID ${imageId} deleted successfully`);

    res.status(200).json({ message: "Style image deleted successfully" });
  } catch (error) {
    console.error(`Error deleting StyleImage ${imageId}:`, error);
    if (error.code === "P2025") {
      console.log(
        `Prisma P2025 error: StyleImage with ID ${imageId} not found or already deleted`
      );
      return res
        .status(404)
        .json({ message: "Style image not found or already deleted." });
    }
    next(error);
  }
};

// Get total count of style images across all clients
exports.getStyleImagesCount = async (req, res, next) => {
  try {
    const count = await prisma.styleImage.count();
    res.status(200).json({ count });
  } catch (error) {
    next(error);
  }
};

// Update a style image
exports.updateStyleImage = async (req, res, next) => {
  const { imageId } = req.params;
  const { category, description, clientId } = req.body;
  const adminId = req.user.id;
  console.log(
    `Attempting to update StyleImage with ID: ${imageId}, by admin: ${adminId}`
  );

  try {
    const styleImage = await prisma.styleImage.findUnique({
      where: { id: imageId },
      include: { client: true },
    });
    console.log("StyleImage found:", styleImage ? styleImage : "Not found");

    if (!styleImage) {
      console.log(`StyleImage with ID ${imageId} not found`);
      return res.status(404).json({ message: "Style image not found" });
    }

    const isAdminOwner = styleImage.adminId === adminId;
    const isClientOwner =
      styleImage.clientId && styleImage.client?.adminId === adminId;
    if (!isAdminOwner && !isClientOwner) {
      console.log(
        `Authorization failed: styleImage.adminId=${styleImage.adminId}, styleImage.client.adminId=${styleImage.client?.adminId}, req.user.id=${adminId}`
      );
      return res
        .status(403)
        .json({ message: "Forbidden: You cannot update this style image" });
    }

    const updatedStyleImage = await prisma.styleImage.update({
      where: { id: imageId },
      data: {
        category: category !== undefined ? category : styleImage.category,
        description:
          description !== undefined ? description : styleImage.description,
      },
    });
    console.log(`StyleImage with ID ${imageId} updated successfully`);

    res.status(200).json(updatedStyleImage);
  } catch (error) {
    console.error(`Error updating StyleImage ${imageId}:`, error);
    if (error.code === "P2025") {
      console.log(
        `Prisma P2025 error: StyleImage with ID ${imageId} not found`
      );
      return res.status(404).json({ message: "Style image not found" });
    }
    next(error);
  }
};

// Delete multiple style images by their IDs
exports.deleteMultipleStyleImages = async (req, res, next) => {
  const { imageIds } = req.body; // Expect an array of IDs
  const adminId = req.user.id;

  if (!Array.isArray(imageIds) || imageIds.length === 0) {
    return res
      .status(400)
      .json({ message: "No image IDs provided for deletion." });
  }

  let deletedCount = 0;
  let failedCount = 0;
  const failedImages = [];

  for (const imageId of imageIds) {
    try {
      const styleImage = await prisma.styleImage.findUnique({
        where: { id: imageId },
        include: { client: true },
      });

      if (!styleImage) {
        failedCount++;
        failedImages.push({ id: imageId, reason: "Not found" });
        continue;
      }

      // Authorization check (same as single delete)
      const isAdminOwner = styleImage.adminId === adminId;
      const isClientOwner =
        styleImage.clientId && styleImage.client.adminId === adminId;

      if (!isAdminOwner && !isClientOwner) {
        failedCount++;
        failedImages.push({ id: imageId, reason: "Forbidden" });
        continue;
      }

      // Delete from Cloudinary
      if (styleImage.publicId) {
        await cloudinary.uploader.destroy(styleImage.publicId);
      }

      // Delete from database
      await prisma.styleImage.delete({ where: { id: imageId } });
      deletedCount++;
    } catch (error) {
      console.error(`Error deleting image ${imageId}:`, error);
      failedCount++;
      failedImages.push({
        id: imageId,
        reason: error.message || "Unknown error",
      });
    }
  }

  if (deletedCount > 0) {
    res.status(200).json({
      message: `${deletedCount} image(s) deleted successfully.`,
      deletedCount,
      failedCount,
      failedImages,
    });
  } else if (failedCount > 0) {
    res.status(400).json({
      message: `Failed to delete ${failedCount} image(s).`,
      deletedCount,
      failedCount,
      failedImages,
    });
  } else {
    res.status(200).json({ message: "No images were processed for deletion." });
  }
};
