const path = require('path');
const { Sequelize } = require('sequelize');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const dbPath = path.resolve(__dirname, 'database.sqlite');
console.log('Targeting DB:', dbPath);

const sequelize = new Sequelize({ dialect: 'sqlite', storage: dbPath, logging: false });

async function seed() {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connected.');

        const NEW_EMAIL = 'admin@geraetewelt.com';
        const NEW_PASSWORD = 'EK@2026!';
        const OLD_EMAIL = 'admin@geraetewelt.de';

        const newHash = await bcrypt.hash(NEW_PASSWORD, 12);

        // Check if the old admin exists and update it
        const [oldRows] = await sequelize.query(`SELECT id FROM Users WHERE email = ?`, { replacements: [OLD_EMAIL] });
        const [newRows] = await sequelize.query(`SELECT id FROM Users WHERE email = ?`, { replacements: [NEW_EMAIL] });

        if (newRows.length > 0) {
            // Update existing entry with new email
            await sequelize.query(
                `UPDATE Users SET passwordHash = ?, role = 'Admin', name = 'Administrator' WHERE email = ?`,
                { replacements: [newHash, NEW_EMAIL] }
            );
            console.log('✅ Existing admin@geraetewelt.com updated.');
        } else if (oldRows.length > 0) {
            // Update old email to new email
            await sequelize.query(
                `UPDATE Users SET email = ?, passwordHash = ?, role = 'Admin', name = 'Administrator', updatedAt = datetime('now') WHERE email = ?`,
                { replacements: [NEW_EMAIL, newHash, OLD_EMAIL] }
            );
            console.log('✅ Admin email migrated from @geraetewelt.de to @geraetewelt.com');
        } else {
            // Create fresh
            const id = uuidv4();
            await sequelize.query(
                `INSERT INTO Users (id, name, email, passwordHash, role, createdAt, updatedAt) VALUES (?, 'Administrator', ?, ?, 'Admin', datetime('now'), datetime('now'))`,
                { replacements: [id, NEW_EMAIL, newHash] }
            );
            console.log('✅ New admin user created.');
        }

        // Verify
        const [verify] = await sequelize.query(`SELECT email, role, passwordHash FROM Users WHERE email = ?`, { replacements: [NEW_EMAIL] });
        const match = await bcrypt.compare(NEW_PASSWORD, verify[0].passwordHash);
        console.log(`✅ Verification — email: ${verify[0].email} | role: ${verify[0].role} | password match: ${match ? 'PASSED ✓' : 'FAILED ✗'}`);

        console.log('\n=============================');
        console.log('  ADMIN LOGIN CREDENTIALS');
        console.log('=============================');
        console.log(`  Email:    ${NEW_EMAIL}`);
        console.log(`  Password: ${NEW_PASSWORD}`);
        console.log('=============================\n');

        await sequelize.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Seed failed:', error.message);
        process.exit(1);
    }
}

seed();
