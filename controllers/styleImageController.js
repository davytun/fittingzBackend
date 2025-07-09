const { PrismaClient } = require('@prisma/client');
const { validationResult } = require('express-validator');
const { cloudinary } = require('../config/cloudinary'); // Import Cloudinary configuration

const prisma = new PrismaClient();

// Upload a style image for a client
exports.uploadStyleImage = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // If validation errors occur (e.g., missing category), delete uploaded file from Cloudinary if it exists
        if (req.file && req.file.public_id) {
            try {
                await cloudinary.uploader.destroy(req.file.public_id);
            } catch (cloudinaryError) {
                console.error("Error deleting file from Cloudinary after validation error:", cloudinaryError);
            }
        }
        return res.status(400).json({ errors: errors.array() });
    }

    const { clientId } = req.params;
    const { category, description } = req.body;
    const adminId = req.user.id;

    if (!req.file) {
        return res.status(400).json({ message: 'No image file uploaded.' });
    }

    try {
        // Verify client exists and belongs to the admin
        const client = await prisma.client.findUnique({ where: { id: clientId } });
        if (!client) {
            // Delete uploaded file from Cloudinary as client is not valid
            await cloudinary.uploader.destroy(req.file.public_id);
            return res.status(404).json({ message: 'Client not found' });
        }
        if (client.adminId !== adminId) {
            // Delete uploaded file from Cloudinary as admin is not authorized
            await cloudinary.uploader.destroy(req.file.public_id);
            return res.status(403).json({ message: 'Forbidden: You do not have access to this client\'s style images' });
        }

        const styleImage = await prisma.styleImage.create({
            data: {
                clientId,
                imageUrl: req.file.path, // URL from Cloudinary (provided by multer-storage-cloudinary)
                publicId: req.file.filename, // public_id from Cloudinary (filename from multer-storage-cloudinary)
                category: category || null, // Store as null if not provided
                description: description || null, // Store as null if not provided
            },
        });

        res.status(201).json(styleImage);
    } catch (error) {
        // If there's an error saving to DB, try to delete the uploaded file from Cloudinary
        if (req.file && req.file.public_id) {
            try {
                await cloudinary.uploader.destroy(req.file.public_id);
            } catch (cloudinaryError) {
                console.error("Error deleting file from Cloudinary after DB error:", cloudinaryError);
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
            return res.status(404).json({ message: 'Client not found' });
        }
        if (client.adminId !== adminId) {
            return res.status(403).json({ message: 'Forbidden: You do not have access to this client\'s style images' });
        }

        const styleImages = await prisma.styleImage.findMany({
            where: { clientId },
            orderBy: { createdAt: 'desc' },
            skip: skip,
            take: pageSize,
        });

        const totalStyleImages = await prisma.styleImage.count({
            where: { clientId },
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

// Delete a style image by its ID
exports.deleteStyleImage = async (req, res, next) => {
    const { imageId } = req.params; // Assuming route will be /api/styles/image/:imageId
    const adminId = req.user.id;

    try {
        const styleImage = await prisma.styleImage.findUnique({
            where: { id: imageId },
            include: { client: true }, // Include client to check adminId
        });

        if (!styleImage) {
            return res.status(404).json({ message: 'Style image not found' });
        }

        // Check if the authenticated admin owns the client associated with the image
        if (styleImage.client.adminId !== adminId) {
            return res.status(403).json({ message: 'Forbidden: You cannot delete this style image' });
        }

        // Delete image from Cloudinary
        if (styleImage.publicId) {
            await cloudinary.uploader.destroy(styleImage.publicId);
        }

        // Delete image record from database
        await prisma.styleImage.delete({
            where: { id: imageId },
        });

        res.status(200).json({ message: 'Style image deleted successfully' });
    } catch (error) {
         if (error.code === 'P2025') { // Prisma error: "Record to delete not found"
            return res.status(404).json({ message: 'Style image not found or already deleted.' });
        }
        console.error("Error deleting style image:", error);
        next(error);
    }
};
