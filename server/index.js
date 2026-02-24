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

// Force build invalidation - v1.0.5
logger.info('Server starting with updated CSP configuration');

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple(),
    }));
}

const app = express();
const server = http.createServer(app);
// Configure CORS and Socket origins from environment for production safety
const nodeEnv = process.env.NODE_ENV || 'development';
const corsOrigin = process.env.CORS_ORIGIN || '*';
// Support comma-separated origins for CORS
let corsOptions;
if (corsOrigin === '*') {
    corsOptions = { origin: '*' };
} else if (corsOrigin.includes(',')) {
    const allowed = corsOrigin.split(',').map(s => s.trim());
    corsOptions = {
        origin: function (origin, callback) {
            if (!origin) return callback(null, true);
            if (allowed.indexOf(origin) !== -1) {
                return callback(null, true);
            } else {
                return callback(new Error('CORS origin denied'), false);
            }
        }
    };
} else {
    corsOptions = { origin: corsOrigin };
}

const io = new Server(server, {
    cors: {
        origin: corsOrigin,
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});

// Pass IO to routes
app.set('io', io);

// Middleware - Security Headers (without CSP for now to avoid conflicts)
app.use((req, res, next) => {
    // Set all security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');
    
    // PERMISSIVE CSP - Allow everything needed
    const cspHeader = 
        "default-src *; " +
        "script-src * 'unsafe-inline' 'unsafe-eval'; " +
        "style-src * 'unsafe-inline'; " +
        "font-src * data:; " +
        "connect-src * wss: ws:; " +
        "img-src * data: blob:; " +
        "media-src *; " +
        "object-src 'none'";
    
    res.setHeader('Content-Security-Policy', cspHeader);
    logger.info(`CSP Header Set: ${cspHeader.substring(0, 100)}...`);
    next();
});

// CORS middleware options with credentials support
const finalCorsOptions = typeof corsOptions === 'object' && corsOptions.origin ? 
    { ...corsOptions, credentials: true, methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization'] } :
    { origin: corsOrigin, credentials: true, methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization'] };

app.use(cors(finalCorsOptions));

if (nodeEnv === 'production' && corsOrigin === '*') {
    logger.warn('CORS_ORIGIN is not set in production — allowing all origins. Set CORS_ORIGIN to your frontend origin for safety.');
}
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
