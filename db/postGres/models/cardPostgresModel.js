const { DataTypes } = require('sequelize')

const db = require('./../config/dbPostgres')

const CardPostgres = db.define('card', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    color: {
        type: DataTypes.ENUM,
        values: ['red', 'blue', 'green', 'yellow'],
        allowNull: false,
    },
    value: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    type: {
        type: DataTypes.ENUM,
        values: ['number', 'skip', 'reverse', 'draw2', 'draw4', 'wild'],
        allowNull: false,
    }
})
