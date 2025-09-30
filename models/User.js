const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const positionSchema = new mongoose.Schema({
  lat: { type: Number, required: true },
  lng: { type: Number, required: true }
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['agent', 'superviseur', 'admin'],
    required: true
  },
  status: {
    type: String,
    default: 'Inactif'
  },
  position: {
    type: positionSchema
  },
  postName: {
    type: String
  },
  fcmTokens: {
    type: [String],
    default: []
  },
  points: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Hachage du mot de passe avant de sauvegarder
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Méthode pour comparer les mots de passe
userSchema.methods.comparePassword = function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
