const { PrismaClient } = require("@prisma/client");
const cache = require("../utils/cache");
const { getIO } = require("../socket");
const { cloudinary } = require("../config/cloudinary");

const prisma = new PrismaClient();

class ProfileService {
  async getProfile({ adminId }) {
    if (!adminId) {
      throw new Error("Unauthorized. Admin ID not found.");
    }

    const cacheKey = `profile:${adminId}`;
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
      select: {
        id: true,
        email: true,
        businessName: true,
        contactPhone: true,
        businessAddress: true,
        profileImageUrl: true,
        isEmailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!admin) {
      throw new Error("Admin not found");
    }

    // Cache for 10 minutes
    await cache.set(cacheKey, admin, 600);

    return admin;
  }

  async updateProfile({ adminId, businessName, contactPhone, businessAddress, profileImage }) {
    if (!adminId) {
      throw new Error("Unauthorized. Admin ID not found.");
    }

    let updateData = {
      businessName: businessName !== undefined ? businessName : undefined,
      contactPhone: contactPhone !== undefined ? contactPhone : undefined,
      businessAddress: businessAddress !== undefined ? businessAddress : undefined,
    };

    // Handle profile image upload
    if (profileImage) {
      // Get current admin to delete old image if exists
      const currentAdmin = await prisma.admin.findUnique({
        where: { id: adminId },
        select: { profileImagePublicId: true },
      });

      // Delete old image from Cloudinary if exists
      if (currentAdmin?.profileImagePublicId) {
        try {
          await cloudinary.uploader.destroy(currentAdmin.profileImagePublicId);
        } catch (error) {
          console.error("Error deleting old profile image:", error);
        }
      }

      updateData.profileImageUrl = profileImage.path;
      updateData.profileImagePublicId = profileImage.filename;
    }

    const admin = await prisma.admin.update({
      where: { id: adminId },
      data: updateData,
      select: {
        id: true,
        email: true,
        businessName: true,
        contactPhone: true,
        businessAddress: true,
        profileImageUrl: true,
        isEmailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Clear cache
    await cache.del(`profile:${adminId}`);

    // Emit Socket.IO event
    getIO().emit("profile_updated", admin);

    return admin;
  }
}

module.exports = new ProfileService();