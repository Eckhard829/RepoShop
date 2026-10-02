const { db } = require('../config/db');

const userById = (id) => db('userById', [id]);
const userByEmail = (email) => db('userByEmail', [email]);
const createUser = (email, password_hash) => db('createUser', [email, password_hash]);
const allClients = () => db('allClients');

module.exports = { userById, userByEmail, createUser, allClients };