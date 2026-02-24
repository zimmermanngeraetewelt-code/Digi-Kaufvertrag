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

// Middleware
// Configure Helmet with a Content Security Policy that allows
// websocket / API connections specified by `CSP_CONNECT_SRC` env var.
// Fallbacks to allowing all `connect-src` if not set to avoid blocking
// remote connections after deployment (adjust `CSP_CONNECT_SRC` for stricter policy).
// Determine allowed connect-src for CSP. In production, require an explicit value
const rawCspConnect = process.env.CSP_CONNECT_SRC;
// Support comma-separated CSP connect-src entries
let cspConnectArr = ["'self'"];
if (rawCspConnect) {
    const parts = rawCspConnect.split(',').map(s => s.trim()).filter(Boolean);
    if (parts.length) cspConnectArr = cspConnectArr.concat(parts);
} else if (nodeEnv === 'production') {
    logger.warn('CSP_CONNECT_SRC is not set in production — falling back to "\'self\'". Set CSP_CONNECT_SRC to your frontend/socket origin.');
}
app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            // Allow Google Fonts stylesheet and inline styles (used by some frameworks)
            styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://fonts.gstatic.com'],
            // More specific directive for style elements (avoids relying on fallback)
            styleSrcElem: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://fonts.gstatic.com'],
            connectSrc: [...cspConnectArr, 'https://fonts.googleapis.com', 'https://fonts.gstatic.com'],
            imgSrc: ["'self'", 'data:', 'https:'],
            // Allow fonts served by Google (fonts.gstatic.com) and any https font sources
            fontSrc: ["'self'", 'https://fonts.gstatic.com', 'https://fonts.googleapis.com', 'https:', 'data:'],
            objectSrc: ["'none'"],
        }
    }
}));

// Configure CORS middleware to restrict origins in production
if (nodeEnv === 'production' && corsOrigin === '*') {
    logger.warn('CORS_ORIGIN is not set in production — allowing all origins. Set CORS_ORIGIN to your frontend origin for safety.');
}

// CORS options with credentials support
const finalCorsOptions = typeof corsOptions === 'object' && corsOptions.origin ? 
    { ...corsOptions, credentials: true, methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization'] } :
    { origin: corsOrigin, credentials: true, methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization'] };

app.use(cors(finalCorsOptions));
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
