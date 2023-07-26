const { DataTypes } = require('sequelize');
const db = require('./../config/dbPostgres');

const GamePostgres = db.define('game', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    players: {
        type: DataTypes.ARRAY(DataTypes.INTEGER),
        allowNull: false,
    },
    owner: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    turn: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    direction: {
        type: DataTypes.ENUM,
        values: ['clockwise', 'counterclockwise'],
        allowNull: false,
    },
    deck: {
        type: DataTypes.ARRAY(DataTypes.INTEGER),
        allowNull: false,
    },
    discard: {
        type: DataTypes.ARRAY(DataTypes.INTEGER),
        allowNull: false,
    },
    currentCard: {
        type: DataTypes.JSONB,
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM,
        values: ['waiting', 'started', 'ended'],
        allowNull: false,
    },
    winner: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
});

module.exports = GamePostgres;
