const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['lost', 'found'],   // Only these two values allowed
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['Electronics', 'Stationery', 'Clothing', 'ID/Cards', 'Keys', 'Bag', 'Other'],
    default: 'Other'
  },
  location: {
    type: String,          // e.g., "Library", "Canteen", "Block B"
    required: true
  },
  imageUrl: {
    type: String,          // Cloudinary image URL
    default: ''
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',           // Links to the User who posted it
    required: true
  },
  contactEmail: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'resolved'],
    default: 'active'
  }
}, { timestamps: true });

module.exports = mongoose.model('Item', itemSchema);