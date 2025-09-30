const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const http = require('http'); // Import http module
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = process.env.SERVICE_ACCOUNT_KEY_JSON
  ? JSON.parse(process.env.SERVICE_ACCOUNT_KEY_JSON)
  : require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const app = express();
const server = http.createServer(app); // Create HTTP server from Express app
const io = require('socket.io')(server, {
  cors: {
    origin: "*", // Allow all origins for development
    methods: ["GET", "POST"]
  }
});

const PORT = 3000;

const JWT_SECRET = process.env.JWT_SECRET || 'votre_super_secret_jwt';

// MongoDB Connection
const DB_URI = 'mongodb://localhost:27017/kami_geoloc'; // Default URI

mongoose.connect(DB_URI)
  .then(() => console.log('Connecté à MongoDB'))
  .catch(err => console.error('Erreur de connexion à MongoDB:', err));

// Import Models
const User = require('./models/User');
const Position = require('./models/Position');
const Mission = require('./models/Mission');
const Geofence = require('./models/Geofence');
const Message = require('./models/Message');

const userSockets = new Map(); // [userId, socketId]

io.on('connection', (socket) => {
  console.log('Un utilisateur s\'est connecté:', socket.id);

  socket.on('register', (userId) => {
    console.log(`Socket ${socket.id} enregistré pour l\'utilisateur ${userId}`);
    userSockets.set(userId, socket.id);
  });

  socket.on('sendMessage', async (data) => {
    const { senderId, receiverId, content } = data;
    try {
      const message = new Message({ senderId, receiverId, content });
      await message.save();

      const receiverSocketId = userSockets.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('receiveMessage', message);
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('Un utilisateur s\'est déconnecté:', socket.id);
    for (let [userId, socketId] of userSockets.entries()) {
      if (socketId === socket.id) {
        userSockets.delete(userId);
        break;
      }
    }
  });
});


// --- Seed Database Function ---
async function seedDatabase() {
  try {
    await User.deleteMany({});
    console.log('Anciens utilisateurs supprimés.');

    const usersToSeed = [
      {
        name: 'Admin Kami', email: 'admin@kami.com', password: 'admin123', role: 'admin'
      },
      {
        name: 'Serge Ponthien', email: 'superviseur@kami.com', password: 'password123', role: 'superviseur',
      },
      {
        name: 'Tresor Mputu', email: 'agent1@kami.com', password: 'password456', role: 'agent', status: 'En poste',
        position: { lat: 0.4950, lng: 29.4780 }, postName: 'Kilokwa'
      },
      {
        name: 'Dieumerci Mbokani', email: 'agent2@kami.com', password: 'password456', role: 'agent', status: 'En poste',
        position: { lat: 0.49113, lng: 29.47306 }, postName: 'Rond-point Nyamwisi'
      },
      {
        name: 'Yannick Bolasie', email: 'agent3@kami.com', password: 'password456', role: 'agent', status: 'En poste',
        position: { lat: 0.48683, lng: 29.45861 }, postName: 'Hôpital Général'
      },
      {
        name: 'Chancel Mbemba', email: 'agent4@kami.com', password: 'password456', role: 'agent', status: 'En poste',
        position: { lat: 0.48561, lng: 29.46092 }, postName: 'Mairie de Beni'
      },
      {
        name: 'Cedrick Bakambu', email: 'agent5@kami.com', password: 'password456', role: 'agent', status: 'En poste',
        position: { lat: 0.4880, lng: 29.4690 }, postName: 'Marché Matonge'
      },
      {
        name: 'Gael Kakuta', email: 'agent6@kami.com', password: 'password456', role: 'agent', status: 'En poste',
        position: { lat: 0.4995, lng: 29.4855 }, postName: 'Quartier Paida'
      },
      {
        name: 'Benik Afobe', email: 'agent7@kami.com', password: 'password456', role: 'agent', status: 'En poste',
        position: { lat: 0.4791, lng: 29.4552 }, postName: 'Aéroport de Beni'
      },
      {
        name: 'Neeksens Kebano', email: 'agent8@kami.com', password: 'password456', role: 'agent', status: 'Hors zone',
        position: { lat: 0.3512, lng: 29.3451 }, postName: 'Hors zone (Sud)'
      },
      {
        name: 'Paul-Jose Mpoku', email: 'agent9@kami.com', password: 'password456', role: 'agent', status: 'Hors zone',
        position: { lat: 0.7583, lng: 29.6123 }, postName: 'Hors zone (Nord)'
      },
      {
        name: 'Jordan Botaka', email: 'agent10@kami.com', password: 'password456', role: 'agent', status: 'Hors zone',
        position: { lat: 0.5147, lng: 29.2439 }, postName: 'Hors zone (Ouest)'
      }
    ];

    for (const userData of usersToSeed) {
      const user = new User(userData);
      await user.save();
    }
    console.log('Base de données amorcée avec succès.');

  } catch (error) {
    console.error('Erreur lors de l\'amorçage de la base de données:', error);
  }
}

// Appeler la fonction d\'amorçage une fois la connexion Mongoose établie
mongoose.connection.once('open', () => {
  seedDatabase();
});


app.use(cors());
app.use(express.json());



// Middleware pour protéger les routes
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401); // Pas de token

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403); // Token invalide
    req.user = user;
    next();
  });
};

app.get('/', (req, res) => {
  res.send('Serveur KAMI-HSS en cours d execution');
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email et mot de passe requis' });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Identifiants invalides' });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Identifiants invalides' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log('--- TOKEN DE CONNEXION ---', token); // Ligne ajoutée pour le débogage

    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur lors de la connexion.' });
  }
});

app.get('/api/agents', authenticateToken, async (req, res) => {
  if (req.user.role !== 'superviseur') {
    return res.status(403).json({ message: 'Accès refusé. Seuls les superviseurs peuvent voir la liste des agents.' });
  }

  try {
    const agents = await User.find({ role: 'agent' });
    const agentList = agents.map(u => ({
      id: u._id,
      name: u.name,
      status: u.status,
      position: u.position,
      postName: u.postName
    }));
    res.status(200).json(agentList);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur lors de la récupération des agents.' });
  }
});

app.post('/api/agent/alert', authenticateToken, async (req, res) => {
  if (req.user.role !== 'agent') {
    return res.status(403).json({ message: 'Accès refusé. Seuls les agents peuvent envoyer des alertes.' });
  }

  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ message: 'Le message d\'alerte est requis.' });
  }

  const alertData = {
    agentName: req.user.name,
    message: message,
    timestamp: new Date()
  };

  // Diffuser l\'alerte en temps réel à tous les clients connectés
  io.emit('newAlert', alertData);

  console.log(`Alerte reçue de ${req.user.name}: ${message}`);

  // Envoyer une notification push aux superviseurs
  try {
    const supervisors = await User.find({ role: 'superviseur' });
    const tokens = supervisors.flatMap(s => s.fcmTokens);

    if (tokens.length > 0) {
      const payload = {
        notification: {
          title: `Alerte de ${req.user.name}`,
          body: message,
        },
        data: {
          type: 'alert',
          agentName: req.user.name,
        }
      };
      await admin.messaging().sendToDevice(tokens, payload);
      console.log('Notification push envoyée aux superviseurs.');
    }
  } catch (error) {
    console.error('Erreur lors de l\'envoi de la notification push:', error);
  }

  res.status(200).json({ message: 'Alerte envoyée avec succès.' });
});

// --- CRUD Routes for User Management (Admin Only) ---

const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Accès refusé. Cette action requiert les droits d\'administrateur.' });
  }
  next();
};

// Get all users
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    const { role } = req.query;
    const filter = role ? { role } : {};
    const users = await User.find(filter).select('-password'); // Exclure le mot de passe
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// Create a new user
app.post('/api/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { name, email, password, role, status, position, postName } = req.body;
    const newUser = new User({ name, email, password, role, status, position, postName });
    await newUser.save();
    res.status(201).json(newUser);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé.' });
    }
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// Get a single user by ID
app.get('/api/users/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// Update a user
app.put('/api/users/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { name, email, role, status, position, postName } = req.body;
    // Ne pas inclure le mot de passe dans la mise à jour directe
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, role, status, position, postName },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// Delete a user
app.delete('/api/users/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    res.json({ message: 'Utilisateur supprimé avec succès.' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// --- CRUD Routes for Geofences (Supervisor/Admin) ---

// Create a new geofence
app.post('/api/geofences', authenticateToken, isSupervisorOrAdmin, async (req, res) => {
  try {
    const { name, center, radius, alertOnEnter, alertOnExit } = req.body;
    const newGeofence = new Geofence({ 
      name, 
      center, 
      radius, 
      alertOnEnter, 
      alertOnExit, 
      createdBy: req.user.id 
    });
    await newGeofence.save();
    res.status(201).json(newGeofence);
  } catch (error) {
    res.status(400).json({ message: 'Erreur lors de la création de la zone de geofencing.', error: error.message });
  }
});

// Get all geofences
app.get('/api/geofences', authenticateToken, isSupervisorOrAdmin, async (req, res) => {
  try {
    const geofences = await Geofence.find({ createdBy: req.user.id });
    res.json(geofences);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur lors de la récupération des zones de geofencing.' });
  }
});

// Delete a geofence
app.delete('/api/geofences/:id', authenticateToken, isSupervisorOrAdmin, async (req, res) => {
  try {
    const deletedGeofence = await Geofence.findByIdAndDelete(req.params.id);
    if (!deletedGeofence) return res.status(404).json({ message: 'Zone de geofencing non trouvée.' });
    res.json({ message: 'Zone de geofencing supprimée avec succès.' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// --- Chat Routes ---
app.get('/api/messages/:userId', authenticateToken, async (req, res) => {
  try {
    const otherUserId = req.params.userId;
    const myId = req.user.id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: myId },
      ],
    }).sort({ timestamp: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur lors de la récupération des messages.' });
  }
});

// Get position history for a specific agent on a specific date
app.get('/api/agents/:id/history', authenticateToken, async (req, res) => {
  // Seul un superviseur peut voir l'historique
  if (req.user.role !== 'superviseur') {
    return res.status(403).json({ message: 'Accès refusé.' });
  }

  const { date } = req.query;
  // Valider le format de la date
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ message: 'Veuillez fournir une date au format YYYY-MM-DD.' });
  }

  try {
    const startDate = new Date(date);
    startDate.setUTCHours(0, 0, 0, 0);

    const endDate = new Date(date);
    endDate.setUTCHours(23, 59, 59, 999);

    const history = await Position.find({
      agentId: req.params.id,
      timestamp: { $gte: startDate, $lte: endDate }
    }).sort({ timestamp: 'asc' });

    res.json(history);

  } catch (error) {
    console.error("Erreur lors de la récupération de l'historique:", error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération de l\'historique.' });
  }
});


// Nouvel endpoint pour enregistrer les positions
app.post('/api/positions', authenticateToken, async (req, res) => {
  if (req.user.role !== 'agent') {
    return res.status(403).json({ message: 'Accès refusé. Seuls les agents peuvent envoyer des positions.' });
  }

  const { latitude, longitude } = req.body;
  if (latitude == null || longitude == null) {
    return res.status(400).json({ message: 'Latitude et longitude sont requises.' });
  }

  try {
    const newPosition = new Position({
      agentId: req.user.id,
      latitude,
      longitude,
      timestamp: new Date()
    });
    await newPosition.save();

    // Si l'agent était en 'Signal Perdu', on le remet 'En poste'
    const agent = await User.findById(req.user.id);
    if (agent && agent.status !== 'En poste') {
      agent.status = 'En poste';
      await agent.save();
      console.log(`Agent ${agent.name} est de retour. Statut mis à jour: En poste.`);
    }

    // Emit real-time update via Socket.IO
    io.emit('positionUpdate', {
      agentId: req.user.id,
      name: req.user.name, // Assuming name is in req.user from JWT
      latitude,
      longitude,
      timestamp: newPosition.timestamp
    });

    // Geofencing Logic
    (async () => {
      try {
        const geofences = await Geofence.find({});
        const lastTwoPositions = await Position.find({ agentId: req.user.id }).sort({ timestamp: -1 }).limit(2);

        if (lastTwoPositions.length < 2) return; // Not enough data to determine entry/exit

        const currentPos = { lat: lastTwoPositions[0].latitude, lon: lastTwoPositions[0].longitude };
        const previousPos = { lat: lastTwoPositions[1].latitude, lon: lastTwoPositions[1].longitude };

        for (const fence of geofences) {
          const distanceCurrent = haversine(currentPos, { lat: fence.center.lat, lon: fence.center.lng });
          const distancePrevious = haversine(previousPos, { lat: fence.center.lat, lon: fence.center.lng });

          const isInsideCurrent = distanceCurrent <= fence.radius;
          const isInsidePrevious = distancePrevious <= fence.radius;

          let eventType = null;
          if (!isInsidePrevious && isInsideCurrent && fence.alertOnEnter) {
            eventType = 'entrée';
          } else if (isInsidePrevious && !isInsideCurrent && fence.alertOnExit) {
            eventType = 'sortie';
          }

          if (eventType) {
            const supervisors = await User.find({ role: 'superviseur' });
            const tokens = supervisors.flatMap(s => s.fcmTokens);
            const alertMessage = `L\'agent ${agent.name} est ${eventType === 'entrée' ? 'entré dans' : 'sorti de'} la zone "${fence.name}".`;
            
            io.emit('geofenceAlert', { agentName: agent.name, fenceName: fence.name, eventType });

            if (tokens.length > 0) {
              const payload = {
                notification: {
                  title: 'Alerte Geofence',
                  body: alertMessage,
                },
                data: { type: 'geofence_alert' }
              };
              await admin.messaging().sendToDevice(tokens, payload);
            }
          }
        }
      } catch (e) {
        console.error('Erreur de Geofencing:', e);
      }
    })();

    res.status(201).json({ message: 'Position enregistrée avec succès.', position: newPosition });
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement de la position:', error);
    res.status(500).json({ message: 'Erreur serveur lors de l\'enregistrement de la position.' });
  }
});

app.post('/api/fcm/register', authenticateToken, async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ message: 'Token FCM manquant.' });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }

    // Ajouter le token s'il n'est pas déjà présent
    if (!user.fcmTokens.includes(token)) {
      user.fcmTokens.push(token);
      await user.save();
    }

    res.status(200).json({ message: 'Token FCM enregistré avec succès.' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur lors de l\'enregistrement du token FCM.' });
  }
});

// --- Middleware for role checks ---
const isSupervisorOrAdmin = (req, res, next) => {
  if (req.user.role !== 'superviseur' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Accès refusé. Seuls les superviseurs ou admins peuvent effectuer cette action.' });
  }
  next();
};

// --- CRUD Routes for Missions ---

// Create a new mission
app.post('/api/missions', authenticateToken, isSupervisorOrAdmin, async (req, res) => {
  try {
    const { title, description, assignedTo } = req.body;
    if (!title || !assignedTo) {
      return res.status(400).json({ message: 'Le titre et l\'agent assigné sont requis.' });
    }
    const newMission = new Mission({
      title,
      description,
      assignedTo,
      createdBy: req.user.id,
    });
    await newMission.save();
    const populatedMission = await Mission.findById(newMission._id).populate('assignedTo', 'name').populate('createdBy', 'name');

    // Send push notification to the assigned agent
    try {
      const agent = await User.findById(assignedTo);
      if (agent && agent.fcmTokens.length > 0) {
        const payload = {
          notification: {
            title: 'Nouvelle mission assignée',
            body: title,
          },
          data: {
            type: 'new_mission',
            missionId: newMission._id.toString(),
          }
        };
        await admin.messaging().sendToDevice(agent.fcmTokens, payload);
        console.log(`Notification de nouvelle mission envoyée à ${agent.name}`);
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification de mission:', error);
    }

    res.status(201).json(populatedMission);
  } catch (error) {
    res.status(400).json({ message: 'Erreur lors de la création de la mission.', error: error.message });
  }
});

// Get all missions
app.get('/api/missions', authenticateToken, isSupervisorOrAdmin, async (req, res) => {
  try {
    const missions = await Mission.find().populate('assignedTo', 'name').populate('createdBy', 'name').sort({ createdAt: -1 });
    res.json(missions);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur lors de la récupération des missions.' });
  }
});

// Get missions for the currently logged-in agent
app.get('/api/missions/my-missions', authenticateToken, async (req, res) => {
  if (req.user.role !== 'agent') {
    return res.status(403).json({ message: 'Cette route est réservée aux agents.' });
  }
  try {
    const missions = await Mission.find({ assignedTo: req.user.id }).sort({ createdAt: -1 });
    res.json(missions);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur lors de la récupération des missions.' });
  }
});

// Update a mission (e.g., status change)
app.put('/api/missions/:id', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ message: 'Le statut est requis pour la mise à jour.' });
    }

    const mission = await Mission.findById(req.params.id);
    if (!mission) {
      return res.status(404).json({ message: 'Mission non trouvée.' });
    }

    if (req.user.role === 'agent' && mission.assignedTo.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Accès refusé. Vous ne pouvez pas modifier cette mission.' });
    }

    mission.status = status;
    await mission.save();

    if (status === 'Terminée') {
      await User.findByIdAndUpdate(mission.assignedTo, { $inc: { points: 10 } });
    }

    const populatedMission = await Mission.findById(mission._id).populate('assignedTo', 'name').populate('createdBy', 'name');
    res.json(populatedMission);
  } catch (error) {
    res.status(400).json({ message: 'Erreur lors de la mise à jour de la mission.', error: error.message });
  }
});

app.get('/api/leaderboard', authenticateToken, isSupervisorOrAdmin, async (req, res) => {
  try {
    const leaderboard = await User.find({ role: 'agent' }).sort({ points: -1 }).select('name points');
    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur lors de la récupération du classement.' });
  }
});

// --- Report Generation --- 

// Generate a daily activity report
app.get('/api/reports/daily', authenticateToken, isAdmin, async (req, res) => {
  const { date } = req.query;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ message: 'Veuillez fournir une date au format YYYY-MM-DD.' });
  }

  try {
    const startDate = new Date(date);
    startDate.setUTCHours(0, 0, 0, 0);

    const endDate = new Date(date);
    endDate.setUTCHours(23, 59, 59, 999);

    const agents = await User.find({ role: 'agent' });

    const reportData = await Promise.all(
      agents.map(async (agent) => {
        const positionsCount = await Position.countDocuments({
          agentId: agent._id,
          timestamp: { $gte: startDate, $lte: endDate },
        });

        const completedMissionsCount = await Mission.countDocuments({
          assignedTo: agent._id,
          status: 'Terminée',
          updatedAt: { $gte: startDate, $lte: endDate },
        });

        const firstActivity = await Position.findOne({
          agentId: agent._id,
          timestamp: { $gte: startDate, $lte: endDate },
        }).sort({ timestamp: 1 });

        const lastActivity = await Position.findOne({
          agentId: agent._id,
          timestamp: { $gte: startDate, $lte: endDate },
        }).sort({ timestamp: -1 });

        return {
          agentId: agent._id,
          agentName: agent.name,
          positionsCount,
          completedMissionsCount,
          firstActivity: firstActivity ? firstActivity.timestamp : null,
          lastActivity: lastActivity ? lastActivity.timestamp : null,
        };
      })
    );

    res.json(reportData);
  } catch (error) {
    console.error("Erreur lors de la génération du rapport:", error);
    res.status(500).json({ message: 'Erreur serveur lors de la génération du rapport.' });
  }
});

// Generate a monthly activity report
app.get('/api/reports/monthly', authenticateToken, isAdmin, async (req, res) => {
  const { year, month } = req.query;
  if (!year || !month || isNaN(parseInt(year)) || isNaN(parseInt(month))) {
    return res.status(400).json({ message: 'Veuillez fournir une année et un mois valides.' });
  }

  try {
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    const agents = await User.find({ role: 'agent' });

    const reportData = await Promise.all(
      agents.map(async (agent) => {
        const positionsCount = await Position.countDocuments({
          agentId: agent._id,
          timestamp: { $gte: startDate, $lte: endDate },
        });

        const completedMissionsCount = await Mission.countDocuments({
          assignedTo: agent._id,
          status: 'Terminée',
          updatedAt: { $gte: startDate, $lte: endDate },
        });

        const firstActivity = await Position.findOne({
          agentId: agent._id,
          timestamp: { $gte: startDate, $lte: endDate },
        }).sort({ timestamp: 1 });

        const lastActivity = await Position.findOne({
          agentId: agent._id,
          timestamp: { $gte: startDate, $lte: endDate },
        }).sort({ timestamp: -1 });

        return {
          agentId: agent._id,
          agentName: agent.name,
          positionsCount,
          completedMissionsCount,
          firstActivity: firstActivity ? firstActivity.timestamp : null,
          lastActivity: lastActivity ? lastActivity.timestamp : null,
        };
      })
    );

    res.json(reportData);
  } catch (error) {
    console.error("Erreur lors de la génération du rapport mensuel:", error);
    res.status(500).json({ message: 'Erreur serveur lors de la génération du rapport mensuel.' });
  }
});

// --- Tâche de fond pour la détection d'anomalies ---
const CHECK_INTERVAL_MS = 2 * 60 * 1000; // Toutes les 2 minutes
const INACTIVITY_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes d\'inactivité

setInterval(async () => {
  console.log('Vérification des statuts d\'activité des agents...');
  try {
    const agents = await User.find({ role: 'agent' });
    const now = new Date();

    for (const agent of agents) {
      const lastPosition = await Position.findOne({ agentId: agent._id }).sort({ timestamp: -1 });

      if (lastPosition) {
        const timeDiff = now - lastPosition.timestamp;
        if (timeDiff > INACTIVITY_THRESHOLD_MS && agent.status === 'En poste') {
          console.log(`Agent ${agent.name} inactif. Passage au statut 'Signal Perdu'.`);
          agent.status = 'Signal Perdu';
          await agent.save();
        }
      } else {
        // Si un agent n'a jamais envoyé de position et est "En poste", on le passe en "Signal Perdu"
        if (agent.status === 'En poste') {
          console.log(`Agent ${agent.name} n\'a jamais envoyé de position. Passage au statut 'Signal Perdu'.`);
          agent.status = 'Signal Perdu';
          await agent.save();
        }
      }
    }
  } catch (error) {
    console.error('Erreur lors de la vérification des anomalies:', error);
  }
}, CHECK_INTERVAL_MS);


server.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});

function haversine(coords1, coords2) {
  const toRad = (x) => x * Math.PI / 180;
  const R = 6371e3; // a en mètres

  const dLat = toRad(coords2.lat - coords1.lat);
  const dLon = toRad(coords2.lon - coords1.lon);
  const lat1 = toRad(coords1.lat);
  const lat2 = toRad(coords2.lat);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
