const { User, sequelize } = require('./models');

async function checkUsers() {
    try {
        await sequelize.authenticate();
        const users = await User.findAll();
        console.log('Users found:', users.map(u => ({ email: u.email, role: u.role, name: u.name })));
        process.exit(0);
    } catch (err) {
        console.error('Check failed:', err);
        process.exit(1);
    }
}

checkUsers();
