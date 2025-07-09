const { PrismaClient } = require('@prisma/client');
const { validationResult } = require('express-validator');

const prisma = new PrismaClient();

// Create a new client for the authenticated admin
exports.createClient = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, phone, email, eventType } = req.body;
    const adminId = req.user.id; // Authenticated admin's ID from authenticateJwt middleware

    try {
        if (!adminId) {
             return res.status(401).json({ message: 'Unauthorized. Admin ID not found.' });
        }

        const client = await prisma.client.create({
            data: {
                name,
                phone,
                email,
                eventType,
                admin: {
                    connect: { id: adminId }
                }
            },
        });
        res.status(201).json(client);
    } catch (error) {
        if (error.code === 'P2025') { // Prisma error code for record to connect not found
            return res.status(400).json({ message: "Admin user not found for creating client."})
        }
        next(error);
    }
};

// Get all clients for the authenticated admin
exports.getAllClients = async (req, res, next) => {
    const adminId = req.user.id;
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = parseInt(req.query.pageSize, 10) || 10;
    const skip = (page - 1) * pageSize;

     if (!adminId) {
        return res.status(401).json({ message: 'Unauthorized. Admin ID not found.' });
    }

    try {
        const clients = await prisma.client.findMany({
            where: { adminId },
            orderBy: { createdAt: 'desc' },
            include: { // Optionally include related data
                _count: {
                    select: { measurements: true, styleImages: true }
                }
            },
            skip: skip,
            take: pageSize,
        });

        const totalClients = await prisma.client.count({
            where: { adminId },
        });

        res.status(200).json({
            data: clients,
            pagination: {
                page,
                pageSize,
                total: totalClients,
                totalPages: Math.ceil(totalClients / pageSize),
            },
        });
    } catch (error) {
        next(error);
    }
};

// Get a single client by ID, ensuring it belongs to the authenticated admin
exports.getClientById = async (req, res, next) => {
    const { id } = req.params;
    const adminId = req.user.id;

    if (!adminId) {
        return res.status(401).json({ message: 'Unauthorized. Admin ID not found.' });
    }

    try {
        const client = await prisma.client.findUnique({
            where: { id },
            include: { // Optionally include related data
                measurements: true,
                styleImages: true
            }
        });

        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }

        if (client.adminId !== adminId) {
            // Forbidden to access client of another admin
            return res.status(403).json({ message: 'Forbidden: You do not have access to this client' });
        }

        res.status(200).json(client);
    } catch (error) {
        next(error);
    }
};

// Update a client by ID, ensuring it belongs to the authenticated admin
exports.updateClient = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, phone, email, eventType } = req.body;
    const adminId = req.user.id;

    if (!adminId) {
        return res.status(401).json({ message: 'Unauthorized. Admin ID not found.' });
    }

    try {
        const existingClient = await prisma.client.findUnique({ where: { id } });

        if (!existingClient) {
            return res.status(404).json({ message: 'Client not found' });
        }

        if (existingClient.adminId !== adminId) {
            return res.status(403).json({ message: 'Forbidden: You cannot update this client' });
        }

        const updatedClient = await prisma.client.update({
            where: { id },
            data: {
                name: name || undefined, // Only update fields that are provided
                phone: phone || undefined,
                email: email || undefined,
                eventType: eventType || undefined,
            },
        });
        res.status(200).json(updatedClient);
    } catch (error) {
        next(error);
    }
};

// Delete a client by ID, ensuring it belongs to the authenticated admin
exports.deleteClient = async (req, res, next) => {
    const { id } = req.params;
    const adminId = req.user.id;

    if (!adminId) {
        return res.status(401).json({ message: 'Unauthorized. Admin ID not found.' });
    }

    try {
        const client = await prisma.client.findUnique({ where: { id } });

        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }

        if (client.adminId !== adminId) {
            return res.status(403).json({ message: 'Forbidden: You cannot delete this client' });
        }

        // Prisma schema has `onDelete: Cascade` for Measurements and StyleImages related to Client,
        // so they will be deleted automatically by the database.
        await prisma.client.delete({
            where: { id },
        });

        res.status(200).json({ message: 'Client deleted successfully' });
    } catch (error) {
        if (error.code === 'P2025') { // Prisma error for record to delete not found
             return res.status(404).json({ message: 'Client not found or already deleted.' });
        }
        next(error);
    }
};
