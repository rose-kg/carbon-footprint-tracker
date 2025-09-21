require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketio = require('socket.io');
const app = express();

console.log('MONGO_URI:', process.env.MONGO_URI);
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
		.then(() => console.log('Mongo connected'))
		.catch(err => console.error('Mongo connection error:', err));

app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/activities', require('./routes/activities'));
app.use('/api/insights', require('./routes/insights'));

const server = http.createServer(app);
const io = socketio(server, { cors: { origin: '*' } });

io.on('connection', (socket) => {
	console.log('WebSocket client connected');
	socket.on('activityLogged', async (userId) => {
		socket.emit('weeklyTip', { tip: 'Try cycling twice this week to cut 2kg CO2', category: 'transport', targetReduction: 2, total: 10 });
	});
});

server.listen(3001, () => console.log('Server running on port 3001'));
