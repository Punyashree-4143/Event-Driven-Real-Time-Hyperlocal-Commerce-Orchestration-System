🛒 Event-Driven Real-Time Hyperlocal Commerce Orchestration System

The Event-Driven Real-Time Hyperlocal Commerce Orchestration System is a full-stack hyperlocal commerce platform designed to handle real-time ordering, inventory synchronization, delivery coordination, and role-based orchestration using an event-driven architecture. The system emphasizes low latency, real-time consistency, and scalable communication between multiple stakeholders in a hyperlocal ecosystem. This project moves beyond traditional request-response e-commerce models by introducing socket-based real-time inventory updates, live order lifecycle propagation, and hyperlocal intelligence.

🌐 Live Deployment

The project has been successfully deployed and is accessible through the following links. The deployed version demonstrates real-time order flow, inventory synchronization, and role-based dashboards in a production environment.
Customer & Admin Dashboard: https://hyperlocal-grocery-platform.vercel.app/

Vendor Dashboard: https://hyperlocal-grocery-platform-8dad.vercel.app/

Delivery Dashboard: https://hyperlocal-grocery-platform-csrd.vercel.app/

Backend API: https://hyperlocal-grocery-platform.onrender.com/

📌 Project Objectives

The primary objective of this system is to orchestrate hyperlocal commerce operations in real time while maintaining strict role isolation and data consistency. It aims to provide instant order state propagation, prevent inventory conflicts, support multiple operational dashboards, and establish a foundation for hyperlocal intelligence and automation.

🧩 System Interfaces

The platform consists of three dedicated interfaces designed for different operational roles.

Customer & Admin Dashboard (Unified Interface)

This interface dynamically adapts based on the authenticated role.
Customer features include browsing hyperlocal stores and products, real-time stock visibility using sockets, cart and checkout flow, live order tracking, and instant order status updates without page refresh.
Admin features currently include approving or blocking vendor stores, approving or rejecting delivery partner registrations, and monitoring platform onboarding status. Administrative capabilities are intentionally limited at this stage and designed to expand in future iterations.

Vendor Dashboard

The Vendor Dashboard focuses on operational execution and inventory accuracy. Vendors receive live incoming order notifications, can accept and pack orders, view real-time inventory changes, and rely on automatic stock decrement when orders are placed. Inventory rollback is triggered automatically if an order is cancelled, ensuring consistency across the system. All vendor actions are propagated in real time using socket events.

Delivery Dashboard

The Delivery Dashboard acts as the execution layer for order fulfillment. Delivery partners see only the orders assigned to them and can update delivery status through Accept Delivery, Out for Delivery, and Delivered states. All delivery status changes are instantly reflected across customer, vendor, and admin views through event-driven communication. Secure authentication and role-based access control are enforced.

Event-Driven Architecture

The system follows an event-driven architecture where state changes are propagated instantly across all connected clients using WebSockets (Socket.IO). This eliminates unnecessary polling and ensures system-wide consistency.

Core Events

ORDER_PLACED,
INVENTORY_UPDATED,
ORDER_ACCEPTED,
ORDER_PACKED,
DELIVERY_ASSIGNED,
OUT_FOR_DELIVERY,
ORDER_DELIVERED,
ORDER_CANCELLED

Each event carries a structured payload and is broadcast to relevant roles only, ensuring minimal overhead and maximum relevance.

📦 Real-Time Inventory Management

Inventory management is handled in real time to prevent overselling and maintain accuracy across the platform.

Socket-based inventory synchronization
Atomic stock decrement on order placement
Automatic rollback on cancellation or failure
Live inventory updates across Customer, Vendor, and Admin dashboards
High-consistency inventory state across concurrent users

🧠 Hyperlocal Intelligence Layer

The platform includes a Hyperlocal Intelligence Layer designed to optimize commerce operations based on locality and system state.

Key capabilities include:

Nearest vendor selection
Stock-aware order routing
Intelligent delivery partner assignment
Vendor load balancing
Order prioritization based on system conditions
The current implementation is rule-based, with architecture support for future AI/ML integration.

🔐 Authentication & Authorization

JWT-based authentication
Role-based access control
Separate authorization flows for:

Customer
Admin
Vendor
Delivery Partner

Secure middleware-protected routes
Token-based socket authentication

🛠️ Technology Stack

Frontend technologies include React.js, Context API, Socket.IO Client, and custom or Tailwind-based styling. Backend technologies include Node.js, Express.js, Socket.IO, MongoDB with Mongoose, and JWT for authentication and authorization.

🧱 System Design Highlights

The system is built on an event-driven foundation with real-time state synchronization and strict role isolation. It is designed to be scalable and microservice-ready, with clean separation of concerns and fault-tolerant inventory handling. The architecture supports real-time workflows commonly found in modern hyperlocal commerce platforms.

🚀 Installation & Setup

git clone https://github.com/your-username/event-driven-hyperlocal-commerce-system.git
cd backend
npm install
npm run dev
cd frontend
npm install
npm start
Environment variables must be configured for MongoDB connection, JWT secrets, and socket configuration.
