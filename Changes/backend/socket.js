module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log(`🟢 Client connected: ${socket.id}`);

        socket.on('joinHospital', (hospitalId) => {
            if (!hospitalId) return;
            socket.join(`hospital_${hospitalId}`);
            console.log(`🏥 Socket ${socket.id} joined room hospital_${hospitalId}`);
        });

        socket.on('disconnect', () => {
            console.log(`🔴 Client disconnected: ${socket.id}`);
        });
    });
};
