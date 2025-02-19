// models/CsrTicket.model.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CsrTicketSchema = new Schema(
  {
    ordernumber: {
      type: String,
      required: true,
      trim: true,
    },
    problem: {
      type: String,
      trim: true,
    },
    fees: {
      type: Number,
    },
    procedure: {
      type: String,
      trim: true,
    },
    condition: {
      type: String,
      trim: true,
      default: null,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed"], // Extendable for future statuses
      default: "pending",
    },
    attendedStatus: {
      type: String,
      enum: ["pending", "attended"],
      default: "pending",
    },
    attendedBy: {
      type: Schema.Types.ObjectId,
      ref: "User", // CSR Lead who attended the ticket
      default: null,
    },
    newProduct: {
      type: String,
      trim: true,
      default: null,
    },
    attemptDate: {
      type: Date,
      default: null,
    },
    qty: {
      type: Number,
      default: null,
    },
    pkgs: {
      type: Number,
      default: null,
    },
    shippingCompany: {
      type: Schema.Types.ObjectId,
      ref: "Company", // Reference to ShippingCompany entity
      default: null,
    },
    trackingNo: {
      type: String,
      trim: true,
      default: null,
    },
    driver: {
      type: Schema.Types.ObjectId,
      ref: "Driver", // Reference to Driver entity
      default: null,
    },
    date: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      trim: true,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

module.exports = mongoose.model("CsrTicket", CsrTicketSchema);
