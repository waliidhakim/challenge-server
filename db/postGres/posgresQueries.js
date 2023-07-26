const getUsers = "SELECT * FROM \"users\"";

const addUser = `INSERT INTO users (firstName,lastName,email,password,role) VALUES($1,$2,$3,$4,$5)`;

const checkEmailExists = "SELECT s FROM students s WHERE s.email = $1"

const findUser = "SELECT s FROM students s WHERE s.email = $1";

const updatePassword  = `UPDATE users
                         SET password = $1
                         WHERE email = $2;`


module.exports = {
    getUsers,
    addUser,
    checkEmailExists,
    findUser,
    updatePassword
}