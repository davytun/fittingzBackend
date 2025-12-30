const { PrismaClient } = require("@prisma/client");
const { cloudinary } = require("../config/cloudinary");
const cache = require("../utils/cache");

const prisma = new PrismaClient();

class StyleImageService {
  // Upload style images for a client
  static async uploadStyleImageForClient({ clientId, adminId, files, category, description }) {
    if (!files || files.length === 0) {
      throw new Error("No image files uploaded.");
    }

    // Verify client
    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) {
      for (const file of files) {
        await cloudinary.uploader.destroy(file.public_id);
      }
      throw new Error("Client not found");
    }
    if (client.adminId !== adminId) {
      for (const file of files) {
        await cloudinary.uploader.destroy(file.public_id);
      }
      throw new Error("Forbidden: You do not have access to this client's style images");
    }

    // Create style images
    const styleImages = [];
    for (const file of files) {
      const styleImage = await prisma.styleImage.create({
        data: {
          client: { connect: { id: clientId } },
          imageUrl: file.path,
          publicId: file.filename,
          category: category || null,
          description: description || null,
          admin: { connect: { id: adminId } },
        },
      });
      styleImages.push(styleImage);
    }

    // Clear cache
    await cache.delPattern(`style_images:client:${clientId}:*`);
    await cache.delPattern(`style_images:admin:${adminId}:*`);

    return styleImages;
  }

  // Upload style images for an admin (not tied to a client)
  static async uploadStyleImageForAdmin({ adminId, files, category, description }) {
    if (!files || files.length === 0) {
      throw new Error("No image files uploaded.");
    }

    const styleImages = [];
    for (const file of files) {
      const styleImage = await prisma.styleImage.create({
        data: {
          imageUrl: file.path,
          publicId: file.filename,
          category: category || null,
          description: description || null,
          admin: { connect: { id: adminId } },
        },
      });
      styleImages.push(styleImage);
    }

    // Clear cache
    await cache.delPattern(`style_images:admin:${adminId}:*`);

    return styleImages;
  }

  // Get a single style image by ID for a client
  static async getStyleImageById({ clientId, imageId, adminId }) {
    // Verify client belongs to admin
    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) {
      throw new Error("Client not found");
    }
    if (client.adminId !== adminId) {
      throw new Error("Forbidden: You do not have access to this client's style images");
    }

    // Fetch style image with client info
    const styleImage = await prisma.styleImage.findFirst({
      where: { 
        id: imageId,
        OR: [
          { clientId: clientId },
          { adminId: adminId, clientId: clientId },
        ],
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!styleImage) {
      throw new Error("Style image not found");
    }

    return styleImage;
  }

  // Get style images for a specific client
  static async getStyleImagesByClientId({ clientId, adminId, page = 1, pageSize = 10 }) {
    const skip = (page - 1) * pageSize;
    const cacheKey = `styleImages:client:${clientId}:${page}:${pageSize}`;

    // Check cache
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    // Verify client
    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) {
      throw new Error("Client not found");
    }
    if (client.adminId !== adminId) {
      throw new Error("Forbidden: You do not have access to this client's style images");
    }

    // Fetch style images with client info
    const styleImages = await prisma.styleImage.findMany({
      where: { clientId: clientId },
      include: {
        client: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    });

    const totalStyleImages = await prisma.styleImage.count({
      where: { clientId: clientId },
    });

    const result = {
      data: styleImages,
      pagination: {
        page,
        pageSize,
        total: totalStyleImages,
        totalPages: Math.ceil(totalStyleImages / pageSize),
      },
    };

    // Cache the result
    await cache.set(cacheKey, result, 300);

    return result;
  }

  // Get all style images for an admin
  static async getStyleImagesByAdmin({ adminId, page = 1, pageSize = 10 }) {
    const skip = (page - 1) * pageSize;

    // Fetch style images with client information
    const styleImages = await prisma.styleImage.findMany({
      where: {
        OR: [
          { adminId: adminId },
          { client: { adminId: adminId } },
        ],
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    });

    const totalStyleImages = await prisma.styleImage.count({
      where: {
        OR: [
          { adminId: adminId },
          { client: { adminId: adminId } },
        ],
      },
    });

    return {
      data: styleImages,
      pagination: {
        page,
        pageSize,
        total: totalStyleImages,
        totalPages: Math.ceil(totalStyleImages / pageSize),
      },
    };
  }

  // Delete a style image by ID
  static async deleteStyleImage({ imageId, adminId }) {
    const styleImage = await prisma.styleImage.findUnique({
      where: { id: imageId },
      include: { client: true },
    });

    if (!styleImage) {
      throw new Error("Style image not found");
    }

    const isAdminOwner = styleImage.adminId === adminId;
    const isClientOwner = styleImage.client?.adminId === adminId;
    if (!isAdminOwner && !isClientOwner) {
      throw new Error("Forbidden: You cannot delete this style image");
    }

    // Delete from Cloudinary
    if (styleImage.publicId) {
      try {
        await cloudinary.uploader.destroy(styleImage.publicId);
      } catch (cloudinaryError) {
        console.error(`Cloudinary deletion failed for publicId ${styleImage.publicId}:`, cloudinaryError);
      }
    }

    // Delete from database
    await prisma.styleImage.delete({ where: { id: imageId } });

    // Clear cache
    if (styleImage.clientId) {
      await cache.delPattern(`style_images:client:${styleImage.clientId}:*`);
    }
    await cache.delPattern(`style_images:admin:${adminId}:*`);

    return { message: "Style image deleted successfully" };
  }

  static async getStyleImagesCount({ adminId }) {
    const count = await prisma.styleImage.count({
      where: {
        OR: [
          { adminId: adminId },
          { client: { adminId: adminId } },
        ],
      },
    });
    return { count };
  }

  // Update a style image
  static async updateStyleImage({ imageId, adminId, category, description }) {
    const styleImage = await prisma.styleImage.findUnique({
      where: { id: imageId },
      include: { client: true },
    });

    if (!styleImage) {
      throw new Error("Style image not found");
    }

    const isAdminOwner = styleImage.adminId === adminId;
    const isClientOwner = styleImage.client?.adminId === adminId;
    if (!isAdminOwner && !isClientOwner) {
      throw new Error("Forbidden: You cannot update this style image");
    }

    const updatedStyleImage = await prisma.styleImage.update({
      where: { id: imageId },
      data: {
        category: category !== undefined ? category : styleImage.category,
        description: description !== undefined ? description : styleImage.description,
      },
    });

    // Clear cache
    if (styleImage.clientId) {
      await cache.delPattern(`style_images:client:${styleImage.clientId}:*`);
    }
    await cache.delPattern(`style_images:admin:${adminId}:*`);

    return updatedStyleImage;
  }

  // Delete multiple style images
  static async deleteMultipleStyleImages({ imageIds, adminId }) {
    if (!Array.isArray(imageIds) || imageIds.length === 0) {
      throw new Error("No image IDs provided for deletion.");
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

        const isAdminOwner = styleImage.adminId === adminId;
        const isClientOwner = styleImage.client?.adminId === adminId;
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
        failedCount++;
        failedImages.push({ id: imageId, reason: error.message || "Unknown error" });
      }
    }

    // Clear cache for admin
    await cache.delPattern(`styleImages:admin:${adminId}:*`);
    // Clear cache for affected clients
    const clientIds = new Set();
    for (const imageId of imageIds) {
      const styleImage = await prisma.styleImage.findUnique({
        where: { id: imageId },
        select: { clientId: true },
      });
      if (styleImage?.clientId) {
        clientIds.add(styleImage.clientId);
      }
    }
    for (const clientId of clientIds) {
      await cache.delPattern(`style_images:client:${clientId}:*`);
    }

    return { deletedCount, failedCount, failedImages };
  }
}

module.exports = StyleImageService;