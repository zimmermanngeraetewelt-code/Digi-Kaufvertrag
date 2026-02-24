const { User, sequelize } = require('./models');
const { hashPassword } = require('./utils/auth');

async function forceAdmin() {
    try {
        await sequelize.authenticate();
        console.log('DB Connected');

        // Don't sync, just try to update or create
        const passwordHash = await hashPassword('admin123');
        const [user, created] = await User.findOrCreate({
            where: { email: 'admin@geraetewelt.de' },
            defaults: {
                name: 'Admin Gerätewelt',
                passwordHash,
                role: 'Admin'
            }
        });

        if (!created) {
            user.passwordHash = passwordHash;
            user.role = 'Admin';
            await user.save();
            console.log('Updated existing admin password to admin123');
        } else {
            console.log('Created new admin user');
        }

        process.exit(0);
    } catch (err) {
        console.error('Failed:', err);
        process.exit(1);
    }
}

forceAdmin();
