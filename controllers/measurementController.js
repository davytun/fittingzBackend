const { PrismaClient } = require('@prisma/client');
const { validationResult } = require('express-validator');

const prisma = new PrismaClient();

// Add or Update measurements for a specific client
// This acts as an "upsert" because of the unique constraint on clientId in the Measurement model.
exports.addOrUpdateMeasurement = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { clientId } = req.params;
    const { fields } = req.body; // Expecting fields to be a JSON object e.g., { "bust": 90, "waist": 70 }
    const adminId = req.user.id;

    try {
        // Verify client exists and belongs to the admin
        const client = await prisma.client.findUnique({ where: { id: clientId } });
        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }
        if (client.adminId !== adminId) {
            return res.status(403).json({ message: 'Forbidden: You do not have access to this client\'s measurements' });
        }

        // Upsert: update if exists, create if not
        const measurement = await prisma.measurement.upsert({
            where: { clientId: clientId }, // Unique identifier for the measurement record
            update: { fields: fields || {} },
            create: {
                clientId: clientId,
                fields: fields || {},
            },
            include: { client: { select: { name: true } } } // Optionally include client name
        });

        res.status(200).json(measurement);
    } catch (error) {
        // Handle potential errors, e.g., if `fields` is not valid JSON (though Prisma might handle this)
        if (error.code === 'P2002' && error.meta?.target?.includes('clientId')) {
            // This specific error for unique constraint violation should ideally be handled by upsert logic,
            // but good to be aware of if not using upsert or if there's a race condition.
            return res.status(409).json({ message: 'Measurement record for this client already being processed or exists.' });
        }
        next(error);
    }
};

// Get measurements for a specific client
exports.getMeasurementsByClientId = async (req, res, next) => {
    const { clientId } = req.params;
    const adminId = req.user.id;

    try {
        // Verify client exists and belongs to the admin
        const client = await prisma.client.findUnique({ where: { id: clientId } });
        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }
        if (client.adminId !== adminId) {
            return res.status(403).json({ message: 'Forbidden: You do not have access to this client\'s measurements' });
        }

        const measurement = await prisma.measurement.findUnique({
            where: { clientId: clientId },
            include: { client: { select: { name: true } } }
        });

        if (!measurement) {
            // If no measurements found, could return 404 or an empty object/default state
            return res.status(404).json({ message: 'Measurements not found for this client. Please add them first.' });
        }

        res.status(200).json(measurement);
    } catch (error) {
        next(error);
    }
};

// Delete measurements for a specific client
exports.deleteMeasurementsByClientId = async (req, res, next) => {
    const { clientId } = req.params;
    const adminId = req.user.id;

    try {
        // Verify client exists and belongs to the admin
        const client = await prisma.client.findUnique({ where: { id: clientId } });
        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }
        if (client.adminId !== adminId) {
            return res.status(403).json({ message: 'Forbidden: You cannot delete measurements for this client.' });
        }

        // Check if measurements exist before attempting to delete
        const existingMeasurement = await prisma.measurement.findUnique({
            where: { clientId: clientId },
        });

        if (!existingMeasurement) {
            return res.status(404).json({ message: 'No measurements found for this client to delete.' });
        }

        await prisma.measurement.delete({
            where: { clientId: clientId },
        });

        res.status(200).json({ message: 'Measurements deleted successfully for client.' });
    } catch (error) {
        if (error.code === 'P2025') { // Prisma error: "Record to delete not found"
            return res.status(404).json({ message: 'No measurements found for this client to delete or already deleted.' });
        }
        next(error);
    }
};
