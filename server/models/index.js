const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

const dbPath = path.resolve(__dirname, '../../database.sqlite');

let sequelize;
if (process.env.DATABASE_URL) {
    // When using a managed Postgres (e.g., Railway), ensure SSL is accepted.
    const sequelizeOptions = { logging: false };
    if (process.env.NODE_ENV === 'production') {
        sequelizeOptions.dialectOptions = {
            ssl: { rejectUnauthorized: false }
        };
    }
    sequelize = new Sequelize(process.env.DATABASE_URL, sequelizeOptions);
} else {
    sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: dbPath,
        logging: false,
    });
}

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
