const { User, sequelize } = require('./models');
const { comparePassword } = require('./utils/auth');

async function testCredentials() {
    try {
        await sequelize.authenticate();
        const user = await User.findOne({ where: { email: 'admin@geraetewelt.de' } });
        if (!user) {
            console.log('Error: Admin user not found in DB');
            process.exit(1);
        }

        const isMatch = await comparePassword('admin123', user.passwordHash);
        console.log(`User: ${user.email}`);
        console.log(`Password 'admin123' match: ${isMatch}`);
        console.log(`Role: ${user.role}`);

        process.exit(isMatch ? 0 : 1);
    } catch (err) {
        console.error('Test failed:', err);
        process.exit(1);
    }
}

testCredentials();
