const { DataTypes } = require('sequelize');
// const sequelize = new Sequelize(
//   process.env.POSTGRES_DATABASE, 
//   process.env.POSTGRES_USERNAME, 
//   process.env.POSGRES_PASSWORD, {
//   host : process.env.POSTGRES_HOST,
//   dialect: 'postgres',
// });

const db = require('./../config/dbPostgres');

const UserPostgres = db.define('user', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    firstname: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastname: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    passwordconfirm: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM('admin', 'user'),
      allowNull: false,
      defaultValue: 'user'
    },
  });



UserPostgres.instanceMethods = {
    async updateUserPassword(newPassword) {
        try {
        // Effectuer la mise à jour
        await this.update({
            password: newPassword,
        });

        console.log('Mot de passe mis à jour avec succès.');
        } catch (error) {
        console.error('Une erreur s\'est produite :', error.message);
        }
    },
};


module.exports = UserPostgres;