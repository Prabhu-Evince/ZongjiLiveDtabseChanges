const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();

app.use(cors({ origin: 'http://localhost:5173', methods: ['GET', 'POST', 'PUT', 'DELETE'] }));
app.use(express.json());

app.get('/api/users', async (req, res) => {
  try {
    const users = await db('users')
      .select('id', 'name', 'email', 'status')
      .orderBy('id', 'desc');
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = app;
