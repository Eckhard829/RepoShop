const { db } = require('../config/db');

const audit = (adminId, targetId, action) => db('audit', [adminId, targetId, action]);

module.exports = { audit };