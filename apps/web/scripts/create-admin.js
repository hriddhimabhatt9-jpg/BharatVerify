const admin = require('firebase-admin');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function createAdminUser() {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (!serviceAccountKey) {
        console.error('Error: FIREBASE_SERVICE_ACCOUNT_KEY is missing in .env.local');
        process.exit(1);
    }

    try {
        const serviceAccount = JSON.parse(serviceAccountKey);

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });

        const db = admin.firestore();

        // Configuration - Change these values
        const email = 'admin@bharatverify.io';
        const password = 'Admin123!';
        const organizationName = 'BharatVerify Admin';

        console.log(`Creating admin user: ${email}...`);

        // Check if admin already exists
        const existingUsers = await db.collection('users')
            .where('email', '==', email)
            .limit(1)
            .get();

        if (!existingUsers.empty) {
            console.log('Admin user already exists. Updating password...');
            const userId = existingUsers.docs[0].id;
            const passwordHash = await bcrypt.hash(password, 10);
            await db.collection('users').doc(userId).update({
                passwordHash,
                role: 'admin',
                updatedAt: new Date().toISOString(),
            });
            console.log('Admin password updated.');
            console.log(`\nLogin with:\n  Email: ${email}\n  Password: ${password}`);
            process.exit(0);
        }

        // Create organization first
        const orgId = uuidv4();
        const now = new Date().toISOString();

        await db.collection('organizations').doc(orgId).set({
            id: orgId,
            name: organizationName,
            type: 'government',
            registrationNumber: 'GOV-ADMIN-001',
            email: email,
            role: 'admin',
            status: 'approved',
            isAuthorizedOnChain: true,
            createdAt: now,
            updatedAt: now,
        });
        console.log('Organization created.');

        // Create user with password hash
        const userId = uuidv4();
        const passwordHash = await bcrypt.hash(password, 10);

        await db.collection('users').doc(userId).set({
            id: userId,
            email: email,
            passwordHash: passwordHash,
            role: 'admin',
            organizationId: orgId,
            isActive: true,
            createdAt: now,
            updatedAt: now,
        });
        console.log('User created.');

        console.log('\n========================================');
        console.log('SUCCESS: Admin account created!');
        console.log('========================================');
        console.log(`Email:    ${email}`);
        console.log(`Password: ${password}`);
        console.log('========================================');

    } catch (error) {
        console.error('Error creating admin account:', error);
        process.exit(1);
    }

    process.exit(0);
}

createAdminUser();
