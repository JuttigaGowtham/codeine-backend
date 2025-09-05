

const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  rollNo: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  passwordHash: { type: String, required: true },
  solvedProblems: { type: [String], default: [] }, // store problem IDs
  problemsSolved: { type: Number, default: 0 },
  streak: { type: Number, default: 0 },
  lastSolvedDate: { type: Date, default: null },  // used for tie-breaking
  solvedHistory: [
    {
      problemId: String,
      date: Date
    }
  ]
});

module.exports = mongoose.model("User", UserSchema);

