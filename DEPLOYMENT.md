# Gerätewelt Kaufvertrag System — Deployment Guide

## 🔐 Admin Credentials
- **Email:** admin@geraetewelt.com
- **Password:** EK@2026!
- To reset: `npm run seed`

---

## 🖥️ Local Development
```bash
npm run dev
# Frontend: http://localhost:5174
# Backend API: http://localhost:5000
```

---

## 🚀 Deploy to Railway.app (Recommended for Internet)

1. **Prepare GitHub repo:**
   ```bash
   git init
   git add .
   git commit -m "initial deploy"
   # Push to a PRIVATE GitHub repo
   ```

2. **On railway.app:**
   - New Project → Deploy from GitHub
   - Build Command: `npm run build`
   - Start Command: `npm start`

3. **Environment Variables (set in Railway dashboard):**
   ```
   JWT_SECRET=<generate a long random string>
   CLAUDE_API_KEY=<your Claude API key>
   NODE_ENV=production
   PORT=5000
   # Set the frontend origin so CORS and CSP allow browser connections
   CORS_ORIGIN=https://your-frontend-domain.com
   CSP_CONNECT_SRC=https://your-frontend-domain.com
   ```

4. **After deploy, seed the admin:**
   - Use Railway's "Run Command" feature: `npm run seed`

---

## 🏠 Secure Internal (LAN) Deployment

Best for shop/office use only — most secure, no internet exposure.

1. Designate a PC as server (always-on)
2. Run: `npm run dev`
3. Find local IP: `ipconfig` → look for IPv4
4. All devices (tablets, laptops) access via: `http://192.168.X.X:5174`

### Make it start automatically (Windows):
```bash
# Install PM2 globally
npm install -g pm2

# Start server with PM2
pm2 start server/index.js --name "kaufvertrag"

# Auto-start on Windows boot
pm2 save
pm2 startup
```

---

## 🔒 Security Notes
- Change `JWT_SECRET` to a long random string in `.env` for production
- Keep `.env` file PRIVATE — never commit to GitHub
- The SQLite database file (`server/database.sqlite`) contains all contract data — back it up regularly
- For internet deployment: Railway/Render automatically provide HTTPS

### CORS & CSP
- **CORS_ORIGIN**: Set this to your frontend origin (e.g. `https://app.example.com`) so the backend only accepts browser requests from that origin.
- **CSP_CONNECT_SRC**: Set this to the frontend/socket origin (include `wss://` for websockets if needed) so the browser permits XHR/WebSocket connections. In production, leaving these unset will cause warnings; do not leave `CSP_CONNECT_SRC` as `*` in production.

---

## 📁 Project Structure
```
digi_rechnung/
├── client/          # React + Vite frontend
├── server/          # Node.js + Express backend
│   ├── models/      # Sequelize DB models
│   ├── routes/      # API routes
│   ├── middleware/  # Auth middleware
│   ├── utils/       # JWT + bcrypt helpers
│   ├── index.js     # Server entry point
│   ├── seed.js      # Admin account setup
│   └── database.sqlite  # SQLite database
├── package.json     # Root scripts
└── DEPLOYMENT.md    # This file
```
