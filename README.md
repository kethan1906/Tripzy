# ✈️ Tripzy — AI-Powered Travel Companion

<div align="center">

**Plan smarter. Travel better. Explore freely.**

[![React](https://img.shields.io/badge/React-18.2-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.0-47A248?style=for-the-badge&logo=mongodb)](https://mongodb.com/)
[![Python](https://img.shields.io/badge/Python-FastAPI-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker)](https://docker.com/)

</div>

---

## 📌 Project Status

> 🚧 **This project is actively under development.** Core features are working. Some features are still being built.

---

## 🌟 Features

| Feature | Status |
|---|---|
| 🎨 Animated Landing Page with glassmorphism UI | ✅ Done |
| 🤖 AI-powered Itinerary Generator | ✅ Done |
| 🚖 Cab Booking — Uber, Ola, Rapido, Auto with deep links | ✅ Done |
| 🗺️ Live Trip Navigation with real map & GPS | ✅ Done |
| 📊 Dashboard with crowd & weather data | ✅ Done |
| 🔔 Smart Alerts (weather, itinerary, travel) | ✅ Done |
| 👥 Group Trip Management | 🚧 In Progress |
| 💰 Expense Tracker | 🚧 In Progress |
| 📱 Mobile App | 🔜 Planned |

---

## 📸 Screenshots

### 📊 Dashboard
![Dashboard](assets/screenshots/4.jpeg)

### 📋 AI Itinerary Planner
![Itinerary](assets/screenshots/3.jpeg)

### 🗺️ Live Trip Navigation
![Live Trip](assets/screenshots/2.jpeg)

### 🚖 Cab Booking — Uber, Ola, Rapido, Auto
![Cab Booking](assets/screenshots/1.jpeg)

### 🔔 Smart Alerts
![Alerts](assets/screenshots/5.jpeg)

---

## 🏗️ Architecture

![System Architecture](assets/architecture/system-architecture.png)

---

## 🛠️ Tech Stack

### Frontend
- **React 18** + Vite
- **Tailwind CSS** + Framer Motion
- **Zustand** — state management
- **React Query** — data fetching
- **Mapbox GL** — live maps
- **Recharts** — data visualization

### Backend
- **Node.js** + Express
- **MongoDB** + Mongoose
- **JWT** authentication
- **Winston** logging
- Docker ready

### ML Service
- **Python** + FastAPI
- **Scikit-learn** — crowd prediction model
- **Pandas / NumPy** — data processing

---

## 📁 Project Structure

```
tripzy/
├── frontend/               # React + Vite app
│   ├── src/
│   │   ├── pages/          # All page components
│   │   ├── components/     # Reusable UI components
│   │   ├── services/       # API calls
│   │   ├── store/          # Zustand state
│   │   ├── styles/         # Global CSS
│   │   └── utils/          # Helper functions
│   ├── public/
│   └── package.json
│
├── backend/                # Node.js + Express API
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── controllers/    # Business logic
│   │   ├── models/         # MongoDB schemas
│   │   └── utils/          # Helpers & seed data
│   └── package.json
│
├── ml-service/             # Python FastAPI — crowd prediction
│   ├── main.py
│   ├── train_model.py
│   ├── models/
│   ├── data/
│   └── requirements.txt
│
├── assets/                 # Screenshots & diagrams
│   ├── screenshots/
│   └── architecture/
│
└── docker-compose.yml
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- MongoDB (optional — app works with mock data)
- Docker (optional)

### Option 1 — Run with Docker (Easiest)

```bash
git clone https://github.com/kethan1906/tripzy.git
cd tripzy
docker-compose up
```
App opens at **http://localhost:3000**

### Option 2 — Run Manually

#### Frontend
```bash
cd frontend
npm install
cp .env.example .env
# Set VITE_API_URL=http://localhost:5000/api
npm run dev
# Runs at http://localhost:3000
```

#### Backend
```bash
cd backend
npm install
cp .env.example .env
# Set MONGODB_URI and JWT_SECRET in .env
npm run dev
# Runs at http://localhost:5000
```

#### ML Service
```bash
cd ml-service
pip install -r requirements.txt
python main.py
# Runs at http://localhost:8000
```

#### Seed Demo Data
```bash
cd backend
node src/utils/seed.js
# Login: demo@tripzy.com / demo1234
```

---

## 🔌 Works Offline Too

Tripzy works gracefully even without a backend:

- **Itineraries** — saved to localStorage
- **Crowd data** — smart time & day-based prediction
- **Weather** — mock fallback data
- **Cab options** — calculated from GPS coordinates with real deep links

---

## 🚖 Cab Deep Links

| Provider | Action |
|---|---|
| **Uber** | Opens `m.uber.com/ul/` with destination pre-filled |
| **Ola** | Opens `olacabs.com` |
| **Rapido** | Opens `rapido.bike` |
| **Auto** | Opens `olacabs.com` |

> Prices calculated as: `base_fare + (distance_km × price_per_km)` using Haversine formula

---

## 🗺️ API Endpoints

### Itinerary
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/itinerary` | Get all itineraries |
| `POST` | `/api/itinerary` | Create new itinerary |
| `DELETE` | `/api/itinerary/:id` | Delete an itinerary |

### Live Trip
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/livetrip/:id` | Get live trip |
| `GET` | `/api/livetrip/:id/transport-options` | Get cab options |

### ML Service
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/predict/crowd` | Predict crowd level for a city |

---

## 🤝 Contributing

Contributions, issues and feature requests are welcome!

1. Fork the repo
2. Create your branch: `git checkout -b feature/your-feature`
3. Commit: `git commit -m "Add your feature"`
4. Push: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 👨‍💻 Author

**Kethan** — [@kethan1906](https://github.com/kethan1906)

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
