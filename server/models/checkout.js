const { db } = require('../config/db');

const newCheckout = (id, userId) => db('newCheckout', [id, userId]);
const userByCheckout = async (id) => (await db('userByCheckout', [id])).rows[0];

module.exports = { newCheckout, userByCheckout };