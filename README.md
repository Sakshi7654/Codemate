# CodeMate 

> A scalable, real-time collaborative code editor with state synchronization, role-based access control, and low-latency WebSocket communication.

CodeMate is engineered to facilitate synchronous remote pair-programming, technical interviews, and mentor-guided doubt-clearing sessions. It decouples ephemeral real-time operational events from durable storage persistence to avoid database write exhaustion.

---

## 📌 Architecture Highlights (v1.0.0)

* **Ephemeral vs. Durable State Separation:** Real-time character keystrokes and broadcast states are handled in-memory via WebSocket rooms; durable room snapshots are persisted to MongoDB using a server-side 3-second debouncing pipeline.
* **Handshake Authentication:** JWT verification is performed once during the initial HTTP Upgrade / WebSocket handshake rather than validating tokens on every incoming keystroke packet.
* **Role-Based Access Control (RBAC):** Built-in permission modeling (`mentor` vs. `student`) baked into token claims and socket instances (`socket.data.user`).

---

## 🛠️ Tech Stack

* **Runtime:** Node.js (ES Modules)
* **Framework:** Express.js
* **Real-Time Communication:** Socket.IO
* **Database & ODM:** MongoDB Atlas, Mongoose
* **Authentication:** JSON Web Tokens (JWT), bcryptjs
* **Validation & Security:** Cross-Origin Resource Sharing (CORS), environment isolation

---

## 📂 Project Structure

```text
codemate/
├── server/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js              # Resilient MongoDB connection logic
│   │   ├── controllers/
│   │   │   └── authController.js  # Registration and authentication handlers
│   │   ├── middleware/
│   │   │   └── socketAuth.js      # WebSocket handshake JWT interceptor
│   │   ├── models/
│   │   │   ├── Room.js            # Room document schema & references
│   │   │   └── User.js            # User model with async bcrypt pre-save hook
│   │   ├── routes/
│   │   │   └── authRoutes.js      # Express REST routes for authentication
│   │   ├── sockets/
│   │   │   └── editorSocket.js    # Real-time event handlers & room logic
│   │   └── server.js              # HTTP/WebSocket server orchestration
│   ├── .env.example
│   └── package.json
└── README.md
