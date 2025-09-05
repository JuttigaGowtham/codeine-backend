const mongoose = require("mongoose");

const contestSchema = mongoose.Schema({
  name: String,
  type: { type: String, enum: ["weekly", "monthly", "custom"] },
  problems: [{ type: mongoose.Schema.Types.ObjectId, ref: "Problem" }],
  startDate: Date,
  endDate: Date
});

module.exports = mongoose.model("Contest", contestSchema);
