# 🚛 TransitOps — Smart Transport Operations Platform

TransitOps is a modern **Fleet & Transport Operations Management System** built to digitize the complete transport lifecycle for logistics organizations. It replaces spreadsheets and manual processes with a centralized platform for managing vehicles, drivers, trips, maintenance, fuel consumption, operational expenses, and business analytics.

Built as a full-stack web application using **React, Node.js, Express, and MongoDB**, TransitOps enforces real-world business rules while providing operational insights through interactive dashboards and reports.

---

# ✨ Features

## Authentication & Security

* JWT Authentication
* Role-Based Access Control (RBAC)
* Secure Password Hashing (bcrypt)
* Protected API Routes

---

## Dashboard

* Active Vehicles
* Available Vehicles
* Vehicles in Maintenance
* Active Trips
* Pending Trips
* Drivers On Duty
* Fleet Utilization
* Quick Statistics Cards
* Charts & Analytics

---

## Vehicle Management

* Vehicle Registration
* Unique Registration Number Validation
* Vehicle Types
* Maximum Load Capacity
* Acquisition Cost
* Odometer Tracking
* Region Management
* Vehicle Status Management

Supported Statuses

* Available
* On Trip
* In Shop
* Retired

---

## Driver Management

* Driver Profiles
* License Validation
* License Expiry Tracking
* Safety Score
* Driver Availability
* Contact Information

Supported Statuses

* Available
* On Trip
* Off Duty
* Suspended

---

## Trip Management

* Create Trips
* Draft Workflow
* Dispatch Trips
* Complete Trips
* Cancel Trips
* Automatic Status Updates
* Cargo Validation
* Distance Tracking
* Revenue Tracking

Trip Lifecycle

Draft

↓

Dispatched

↓

Completed / Cancelled

---

## Maintenance Module

* Maintenance Records
* Vehicle Service History
* Automatic Vehicle Lock
* Vehicle Retirement
* Maintenance Cost Tracking

---

## Fuel Management

* Fuel Logs
* Fuel Consumption
* Fuel Cost
* Fuel History
* Automatic Fuel Entry after Trip Completion

---

## Expense Management

* Toll Expenses
* Maintenance Expenses
* Miscellaneous Expenses
* Vehicle-wise Cost Tracking

---

## Reports & Analytics

* Fleet Utilization
* Fuel Efficiency
* Operational Cost
* Vehicle ROI
* CSV Export
* Interactive Charts

---

# 🛠 Tech Stack

## Frontend

* React 19
* Vite
* Tailwind CSS v4
* React Router DOM
* Axios
* Recharts
* Lucide React

## Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT
* bcrypt

---

# 👥 User Roles

| Role              | Responsibilities                               |
| ----------------- | ---------------------------------------------- |
| Fleet Manager     | Fleet Operations, Vehicles, Trips, Maintenance |
| Driver            | Trip Execution, Fuel Logging                   |
| Safety Officer    | Driver Compliance & Safety                     |
| Financial Analyst | Expenses, Reports & ROI                        |

---

# 📁 Project Structure

```text
transitops/
│
├── backend/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── server.js
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── hooks/
│   │   └── utils/
│   └── package.json
│
└── README.md
```

---

# ⚙ Installation

## Backend

```bash
cd backend

npm install

cp .env.example .env

npm run seed

npm run dev
```

Server

```
http://localhost:5000
```

---

## Frontend

```bash
cd frontend

npm install

cp .env.example .env

npm run dev
```

Frontend

```
http://localhost:5173
```

---

# 👤 Demo Accounts

Password for all demo users

```
password123
```

| Role              | Email                                                                   |
| ----------------- | ----------------------------------------------------------------------- |
| Fleet Manager     | [fleet.manager@transitops.demo](mailto:fleet.manager@transitops.demo)   |
| Driver            | [driver@transitops.demo](mailto:driver@transitops.demo)                 |
| Safety Officer    | [safety.officer@transitops.demo](mailto:safety.officer@transitops.demo) |
| Financial Analyst | [analyst@transitops.demo](mailto:analyst@transitops.demo)               |

---

# 🔒 Business Rules

* Vehicle registration numbers are unique.
* Driver license numbers are unique.
* Retired vehicles cannot be dispatched.
* Vehicles under maintenance cannot be dispatched.
* Drivers with expired licenses cannot be assigned.
* Suspended drivers cannot be assigned.
* Vehicles already on a trip cannot be assigned again.
* Drivers already on a trip cannot be assigned again.
* Cargo weight cannot exceed vehicle capacity.
* Dispatch automatically changes Vehicle & Driver status to **On Trip**.
* Completing a trip restores Vehicle & Driver to **Available**.
* Cancelling a dispatched trip restores resources automatically.
* Creating maintenance moves vehicle to **In Shop**.
* Closing maintenance restores **Available** unless retired.

---

# 📊 KPIs

* Fleet Utilization
* Fuel Efficiency
* Operational Cost
* Vehicle ROI
* Active Trips
* Pending Trips
* Maintenance Status
* Driver Availability

---

# 🔐 RBAC Permissions

| Module      | Fleet Manager | Driver | Safety Officer | Financial Analyst |
| ----------- | ------------- | ------ | -------------- | ----------------- |
| Dashboard   | ✅             | ✅      | ✅              | ✅                 |
| Vehicles    | ✅             | 👁     | 👁             | 👁                |
| Drivers     | ✅             | 👁     | ✅              | 👁                |
| Trips       | ✅             | ✅      | 👁             | 👁                |
| Maintenance | ✅             | ❌      | ❌              | ❌                 |
| Fuel Logs   | ✅             | ✅      | ❌              | ❌                 |
| Expenses    | ✅             | ✅      | ❌              | ✅                 |
| Reports     | ✅             | ✅      | ✅              | ✅                 |

---

# 🚀 Future Enhancements

* PDF Reports
* Email Notifications
* Vehicle Document Management
* Dark Mode
* GPS Tracking
* Live Vehicle Location
* Driver Performance Analytics
* Predictive Maintenance
* Mobile Application

---

# 📜 License

This project was developed for educational and hackathon purposes.

