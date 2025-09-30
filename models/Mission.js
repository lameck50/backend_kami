const mongoose = require('mongoose');

const missionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Le titre de la mission est requis.'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['En attente', 'En cours', 'Terminée', 'Annulée'],
    default: 'En attente'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'La mission doit être assignée à un agent.']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'La mission doit avoir un créateur.']
  }
}, {
  timestamps: true // Ajoute createdAt et updatedAt automatiquement
});

const Mission = mongoose.model('Mission', missionSchema);

module.exports = Mission;
