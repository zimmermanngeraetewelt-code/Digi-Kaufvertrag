const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Contract = sequelize.define('Contract', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        invoiceNr: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false,
        },
        technicianName: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        date: {
            type: DataTypes.DATEONLY,
            defaultValue: DataTypes.NOW,
        },
        appointmentDate: {
            type: DataTypes.DATEONLY,
        },
        appointmentTime: {
            type: DataTypes.STRING,
        },
        deviceType: {
            type: DataTypes.STRING,
        },
        items: {
            type: DataTypes.JSON, // Stores: { pos, qty, description, price, availability }
            defaultValue: [],
        },
        sum: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0.00,
        },
        paymentMethod: {
            type: DataTypes.ENUM('Bar', 'Überweisung', 'Kartenzahlung'),
            defaultValue: 'Bar',
        },
        vatAmount: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0.00,
        },
        totalAmount: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0.00,
        },
        technicianSignature: {
            type: DataTypes.TEXT, // Base64 signature
        },
        customerSignature: {
            type: DataTypes.TEXT, // Base64 signature
        },
        signatureReceived: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        status: {
            type: DataTypes.ENUM('Draft', 'Pending', 'Signed', 'Archived'),
            defaultValue: 'Draft',
        },
        customerName: {
            type: DataTypes.STRING,
        },
        customerAddress: {
            type: DataTypes.TEXT,
        },
        isPhoneOrder: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        signatureMethod: {
            type: DataTypes.ENUM('Digital', 'Paper'),
            defaultValue: 'Digital',
        }
    });

    return Contract;
};
