KamiGeoloc backend (minimal)
Requirements:
- Node.js 18+ recommended
- MongoDB (local or Atlas)

Quick start:
1) cd backend
2) npm install
3) export MONGO_URI="your mongo connection string"
   export JWT_SECRET="a_secret_key"
4) npm start

Endpoints:
- POST /api/auth/register { email, password, fullName }
- POST /api/auth/login { email, password }
- POST /api/positions (Auth Bearer) { lat, lon, accuracy }

Socket.IO: server emits 'agent:position' events
