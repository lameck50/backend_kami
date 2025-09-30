const mongoose = require('mongoose');

const geofenceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  center: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  radius: {
    type: Number,
    required: true, // in meters
  },
  alertOnEnter: {
    type: Boolean,
    default: true,
  },
  alertOnExit: {
    type: Boolean,
    default: false,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

const Geofence = mongoose.model('Geofence', geofenceSchema);

module.exports = Geofence;
