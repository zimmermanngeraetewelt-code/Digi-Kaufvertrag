# 📄 Digital Contract Management System

> A full-stack business application for creating, signing, and managing digital sales contracts — built for a German electrical appliance retail company.

**Live Demo:** [Link to Railway deployment]  
**Demo Login:** `demo@demo.com` / `Demo@2024`

---

## 🖼️ Screenshots

> *(Add screenshots of Dashboard, Contract Form, Printed Invoice)*

---

## ✨ Features

- **Multi-step contract wizard** — step-by-step guided contract creation
- **Reverse tax calculation** — input Brutto price, auto-calculates Netto + 19% MwSt (German VAT)
- **Smart address autocomplete** — live lookup via OpenStreetMap/Nominatim API
- **Digital signatures** — canvas-based signing pad for technicians and customers
- **Remote QR signing** — customers scan a QR code on their phone to sign remotely
- **Fixed default signature** — technicians save their signature once, auto-loads on every contract
- **Real-time dashboard** — live contract updates via Socket.IO WebSockets
- **AI Business Analyst** — Claude AI integration for natural language business queries ("How much revenue this month?")
- **PDF-ready print layout** — professional invoice with letterhead, payment notes, signatures
- **Role-based access control** — Admin / Technician / Viewer roles
- **Export to Excel** — Admin-only XLSX export of all contracts
- **Bilingual payment notes** — German + English payment instructions on all invoices

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Material UI 6, Vite |
| **Backend** | Node.js, Express 5 |
| **Database** | SQLite (via Sequelize ORM) |
| **Auth** | JWT + bcrypt |
| **Real-time** | Socket.IO |
| **AI** | Anthropic Claude 3 (claude-3-haiku) |
| **Maps** | OpenStreetMap Nominatim API |
| **PDF/Print** | CSS Print Media Queries |
| **Charts/Export** | SheetJS (XLSX) |

---

## 🚀 Run Locally

```bash
# Clone the repo
git clone https://github.com/YOURNAME/digital-contract-system.git
cd digital-contract-system

# Install all dependencies
npm run install-all

# Set up environment variables
cp server/.env.example server/.env
# Edit server/.env with your values

# Seed the demo admin account
npm run seed

# Start development server
npm run dev
# Frontend: http://localhost:5174
# Backend:  http://localhost:5000
```

---

## ⚙️ Environment Variables

Create `server/.env`:
```env
PORT=5000
JWT_SECRET=your_random_secret_here
CLAUDE_API_KEY=your_anthropic_api_key   # Optional – AI features
```

---

## 🔐 Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin | demo@demo.com | Demo@2024 |
| Technician | tech@demo.com | Demo@2024 |

---

## 📁 Project Structure

```
├── client/                 # React frontend (Vite)
│   └── src/
│       ├── pages/          # Dashboard, ContractForm, ContractDetail, Login...
│       ├── components/     # Layout, reusable UI
│       └── services/       # Axios API client
├── server/                 # Node.js backend
│   ├── models/             # User, Contract (Sequelize)
│   ├── routes/             # auth, contracts, AI
│   ├── middleware/         # JWT protect, authorize
│   └── utils/              # bcrypt, JWT helpers
└── package.json            # Root orchestration scripts
```

---

## 🎨 Design Highlights

- German-language business UI (professional B2B aesthetics)
- Premium card-based dashboard with live revenue stats
- Print-optimized invoice with company letterhead integration
- Responsive layout (desktop sidebar + mobile header)

---

*Built as an internal business tool for a German Köln-based electrical appliance retailer. Replaces a fully paper-based contract and quotation workflow with a secure digital system.*
