const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const db = require('./db');
const socketHandler = require('./socket');


const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.use(cors());
app.get('/api/notify-change', (req, res) => {
    const { module, operation, data } = req.query;

    if (!module || !operation) {
        return res.status(400).json({ error: 'Missing required params: module or operation' });
    }

    let parsedData = {};
    try {
        parsedData = data ? JSON.parse(data) : {};
    } catch (err) {
        return res.status(400).json({ error: 'Invalid JSON in "data" parameter' });
    }

    const { hospitalId } = parsedData;

    if (!hospitalId) {
        return res.status(400).json({ error: 'Missing hospitalId in data' });
    }
    io.to(`hospital_${hospitalId}`).emit('dbChange', { module, operation, data: parsedData });

    console.log(
        `📢 ${operation.toUpperCase()} detected in ${module} for Hospital ${hospitalId}:`,
        parsedData
    );

    return res.status(200).json({
        success: true,
        message: `Change broadcasted to hospital ${hospitalId}`,
        sent: { module, operation, data: parsedData },
    });
});

app.use(express.json());

app.post('/api/user/exists', async (req, res) => {
    const { email } = req.body;
    const user = await db('users').where({ email }).first();
    if (!user) return res.json({ exists: false });
    res.json({ exists: true, user });
});

app.get('/api/patients', async (req, res) => {
    const { hospitalId } = req.query; // Get hospitalId from query param

    if (!hospitalId) {
        return res.status(400).json({ error: 'hospitalId is required' });
    }

    try {
        const patients = await db('patients')
            .select('id', 'name', 'status', 'hospitalId')
            .where({ hospitalId }) // filter by hospitalId
            .orderBy('id', 'desc');

        res.json(patients);
    } catch (error) {
        console.error('Error fetching patients:', error);
        res.status(500).json({ error: error.message });
    }
});



// sockets
socketHandler(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
