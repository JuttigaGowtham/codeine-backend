const mongoose = require("mongoose");

const problemSchema = mongoose.Schema({
  title: String,
  description: String,
  testCases: [{ input: String, output: String }],
  starterCode: String,
  order: Number, // used to lock sequence
});

module.exports = mongoose.model("Problem", problemSchema);
