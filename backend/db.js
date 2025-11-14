const knex = require('knex');

const db = knex({
  client: 'mysql2',
  connection: {
    host: 'localhost',
    user: 'root',
    password: 'Prabhuev@123',
    database: 'webzongji'
  },
  pool: { min: 2, max: 10 }
});

module.exports = db;
