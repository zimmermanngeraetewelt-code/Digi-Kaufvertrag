require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

// Logger setup
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' }),
    ],
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple(),
    }));
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});

// Pass IO to routes
app.set('io', io);

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200
});
app.use('/api/', limiter);

const { sequelize } = require('./models');

// Database connection & Sync
async function initDb() {
    try {
        await sequelize.authenticate();
        logger.info('Database connection established successfully.');
        await sequelize.sync({ alter: true });
        logger.info('Database synced successfully.');
    } catch (error) {
        logger.error('Unable to connect to the database:', error);
    }
}
initDb();

app.use('/api/ai', require('./routes/ai'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/contracts', require('./routes/contracts'));

// Serve static assets (only if dist folder exists)
const buildPath = path.join(__dirname, '../client/dist');
const fs = require('fs');
if (fs.existsSync(buildPath)) {
    app.use(express.static(buildPath));
    // Catch-all for React Router — compatible with Express 5 / path-to-regexp v8
    app.get(/^(?!\/api).*$/, (req, res) => {
        res.sendFile(path.resolve(buildPath, 'index.html'));
    });
}

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

app.get('/api/config', (req, res) => {
    const os = require('os');
    const interfaces = os.networkInterfaces();
    let localIp = 'localhost';

    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                localIp = iface.address;
                break;
            }
        }
        if (localIp !== 'localhost') break;
    }

    res.json({ localIp });
});

// Socket.io connection
io.on('connection', (socket) => {
    logger.info('New client connected');
    socket.on('disconnect', () => {
        logger.info('Client disconnected');
    });
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
    logger.info(`Server running on port ${PORT}`);
});

module.exports = { app, sequelize, logger, io };
