// models/CsrTicket.model.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CsrTicketSchema = new Schema({
  ordernumber: {
    type: String,
    required: true,
    trim: true
  },
  problem: {
    type: String,
    
    trim: true
  },
  fees: {
    type: Number,
  
  },
  procedure: {
    type: String,
    
    trim: true
  },
  condition: {
    type: String,
    trim: true,
    default: null
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed'], // Extend this array as needed
    default: 'pending'
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

module.exports = mongoose.model('CsrTicket', CsrTicketSchema);
