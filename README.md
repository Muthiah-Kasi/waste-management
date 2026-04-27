# 🚀 Smart Waste Management System (IoT + Optimization)

A full-stack smart waste management solution that simulates IoT-enabled bins, analyzes waste generation patterns, and optimizes garbage collection routes for efficient city management.

---

## 📌 Overview

This project addresses inefficient waste collection by introducing:

* Real-time bin monitoring
* Intelligent route optimization
* Data-driven insights (EDA)

It simulates a smart city waste system where bins dynamically update their fill levels and trigger optimized collection.

---

## ⚙️ Tech Stack

### 🔹 Backend

* Node.js
* Express.js
* PostgreSQL

### 🔹 Frontend

* React (Vite)
* Axios

### 🔹 Concepts Used

* IoT Simulation (virtual sensors)
* EDA (Exploratory Data Analysis)
* Route Optimization Logic
* REST APIs

---

## 🧠 Features

### 🟢 Smart Bin Simulation

* Bins automatically update fill levels over time
* Realistic progressive waste accumulation

### 🔴 Waste Collection Lifecycle

* Bins move from:

  * Normal → Warning → Critical
* Critical bins can be collected
* After collection → bin resets to empty

### 🧭 Route Optimization

* Filters bins with fill > 70%
* Assigns priority:

  * High (>85%)
  * Medium (70–85%)
* Generates optimized routes for trucks

### 📊 EDA (Exploratory Data Analysis)

* Tracks historical bin data
* Provides insights:

  * Most active bin
  * Average fill level
  * Critical event count

### 📈 Dashboard UI

* Live bin status display
* Color-coded indicators
* Real-time updates
* Collection trigger button

---

## 🏗️ Project Structure

```
waste_management/
│
├── backend/
│   ├── routes/
│   ├── db.js
│   ├── server.js
│   └── .env
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── vite.config.js
```

---

## 🗄️ Database Schema

### bins

* id
* location
* fill_level
* last_updated

### trucks

* id
* name
* capacity

### collection_tasks

* id
* truck_id
* bin_id
* status
* scheduled_time

### bin_history (for EDA)

* id
* bin_id
* fill_level
* timestamp

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone <your-repo-link>
cd waste_management
```

---

### 2. Backend Setup

```bash
cd backend
npm install
```

Create `.env`:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/waste_management
PORT=5000
```

Run server:

```bash
node server.js
```

---

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## 🔌 API Endpoints

### Bins

* `GET /bins` → Get all bins
* `POST /bins/update` → Simulate fill update

### Optimization

* `GET /optimize` → Generate collection routes

### Collection

* `POST /collect` → Collect waste & reset bins

### Analysis (EDA)

* `GET /analysis` → Get insights

---

## 📊 System Flow

```
Simulation → Database → Analysis → Optimization → Dashboard
```

---

## 💡 Key Highlights

* Fully functional end-to-end system
* Real-time updates and lifecycle simulation
* Data-driven decision making using EDA
* Clean and modular architecture

---

## 🚧 Challenges & Solutions

| Challenge           | Solution                     |
| ------------------- | ---------------------------- |
| Continuous overflow | Added collection reset logic |
| Real-time updates   | Auto-refresh + simulation    |
| Data analysis       | Introduced bin_history + EDA |

---

## 📌 Future Improvements

* Real IoT device integration
* Map-based visualization
* Machine learning for prediction
* Multi-city scalability

---

## 🎯 Conclusion

This project demonstrates how IoT simulation, data analysis, and optimization can transform traditional waste management into an intelligent, scalable system suitable for smart cities.

---

## 👨‍💻 Author

Muthiah Kasi
(Computer Science Student)
