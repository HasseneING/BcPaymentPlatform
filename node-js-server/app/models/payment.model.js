const mongoose = require("mongoose");
const Payment = mongoose.model(
  "Payment",
  new mongoose.Schema({
    username: String,
    senderAddr: String,
    forwarderAddr:String,
    ethValue: String,
  })
);

module.exports = Payment;
