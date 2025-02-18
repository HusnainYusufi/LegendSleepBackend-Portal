// models/UserTicket.model.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserTicketSchema = new Schema({
  email: {
    type: String,
    
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address.']
  },
  phoneNumber: {
    type: String,
    required : true,
    trim: true
  },
  ordernumber: {
    type: String,
    required: true,
    trim: true
  },
  problem: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('UserTicket', UserTicketSchema);
