const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

const dbPath = path.resolve(__dirname, '../../database.sqlite');

const sequelize = process.env.DATABASE_URL
    ? new Sequelize(process.env.DATABASE_URL, { logging: false })
    : new Sequelize({
        dialect: 'sqlite',
        storage: dbPath,
        logging: false,
    });

const User = require('./User')(sequelize);
const Contract = require('./Contract')(sequelize);

// Associations
User.hasMany(Contract, { foreignKey: 'technicianId' });
Contract.belongsTo(User, { as: 'technician', foreignKey: 'technicianId' });

module.exports = {
    sequelize,
    User,
    Contract,
};
