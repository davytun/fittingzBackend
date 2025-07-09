const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
    console.log('Start seeding ...');

    const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'password123';
    const adminBusinessName = process.env.SEED_ADMIN_BUSINESS_NAME || 'Default Fashion House';
    const adminContactPhone = process.env.SEED_ADMIN_CONTACT_PHONE || null; // Optional
    const adminBusinessAddress = process.env.SEED_ADMIN_BUSINESS_ADDRESS || null; // Optional

    if (adminPassword.length < 6) {
        console.error('Seed admin password must be at least 6 characters long. Seeding aborted.');
        return;
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Check if admin already exists
    const existingAdmin = await prisma.admin.findUnique({
        where: { email: adminEmail },
    });

    if (existingAdmin) {
        console.log(`Admin with email ${adminEmail} already exists. No new admin created.`);
    } else {
        const admin = await prisma.admin.create({
            data: {
                email: adminEmail,
                password: hashedPassword,
                businessName: adminBusinessName,
                contactPhone: adminContactPhone,
                businessAddress: adminBusinessAddress,
            },
        });
        console.log(`Created admin user: ${admin.email} for business: ${admin.businessName}`);
        console.log(`IMPORTANT: The password for this admin is '${adminPassword}'. Please change it in a production environment or use environment variables for seeding.`);
    }

    // Add other seed data here if needed, e.g., initial categories, sample clients etc.
    // For example, creating a sample client for the new admin:
    // if (!existingAdmin) { // only create if the admin was newly created
    //    const newAdmin = await prisma.admin.findUnique({ where: { email: adminEmail } });
    //    if (newAdmin) {
    //        const sampleClient = await prisma.client.create({
    //            data: {
    //                name: "Sample Client",
    //                email: "sample@client.com",
    //                adminId: newAdmin.id,
    //            }
    //        });
    //        console.log(`Created sample client: ${sampleClient.name} for admin ${newAdmin.email}`);
    //    }
    // }

    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error('Error during seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
