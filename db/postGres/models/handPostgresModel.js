const { DataTypes } = require('sequelize');
const db = require('./../config/dbPostgres');

const CardPostgres = db.define('card', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    card: {
        type: DataTypes.JSONB,
        allowNull: false,
    },
    game: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    player: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
}
)

module.exports = CardPostgres;