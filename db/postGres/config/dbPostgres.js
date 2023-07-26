const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
    database : process.env.POSTGRES_DATABASE,
    username :process.env.POSTGRES_USERNAME,
    password :process.env.POSGRES_PASSWORD,
       
    host: process.env.POSTGRES_HOST,
    dialect: 'postgres',
        
    logging : (log) => {
        if (log.level === 'error') {
          console.error(log.message);
        }
    }
});

module.exports = sequelize;


// const Pool = require('pg').Pool;

// const pool = new Pool({
//     user : process.env.POSTGRES_USERNAME,
//     host : process.env.POSTGRES_HOST,
//     database : process.env.POSTGRES_DATABASE,
//     password : process.env.POSGRES_PASSWORD,
//     port : process.env.POSGRES_PORT,
// })


// module.exports = pool;