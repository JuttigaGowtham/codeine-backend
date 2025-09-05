const express = require("express");
const User = require("../models/User");
const router = express.Router();

// --- Snapchat-like streak calculation using solve history ---
function calculateStreakFromHistory(user) {
  if (!user.solvedHistory || user.solvedHistory.length === 0) return 0;

  // Extract unique solve days
  const uniqueDates = [...new Set(
    user.solvedHistory.map(h => new Date(h.date).toDateString())
  )].map(d => new Date(d));

  uniqueDates.sort((a, b) => b - a); // sort descending

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < uniqueDates.length; i++) {
    const date = new Date(uniqueDates[i]);
    date.setHours(0, 0, 0, 0);

    if (i === 0) {
      // Check if user solved today or yesterday
      if (date.getTime() === today.getTime()) {
        streak++;
      } else if (date.getTime() === today.getTime() - 86400000) {
        streak++;
      } else {
        break;
      }
    } else {
      const prev = new Date(uniqueDates[i - 1]);
      prev.setHours(0, 0, 0, 0);
      if (prev.getTime() - date.getTime() === 86400000) {
        streak++;
      } else {
        break;
      }
    }
  }
  return streak;
}

// Update user progress
router.post("/updateProgress", async (req, res) => {
  const { rollNo, problemId } = req.body;
  try {
    const user = await User.findOne({ rollNo });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Add to solved problems (no duplicates)
    if (!user.solvedProblems.includes(problemId)) {
      user.solvedProblems.push(problemId.toString());
      user.problemsSolved = user.solvedProblems.length;
    }

    // Add solve history entry
    user.solvedHistory.push({ problemId, date: new Date() });

    // Recalculate streak
    user.streak = calculateStreakFromHistory(user);
    user.lastSolvedDate = new Date();

    await user.save();

    res.json({
      message: "Progress updated",
      solvedProblems: user.solvedProblems,
      streak: user.streak
    });
  } catch (err) {
    res.status(500).json({ message: "Error updating progress", error: err.message });
  }
});

// Get user's solved problems
router.get("/user/:rollNo", async (req, res) => {
  try {
    const user = await User.findOne({ rollNo: req.params.rollNo });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ solvedProblems: user.solvedProblems });
  } catch (err) {
    res.status(500).json({ message: "Error fetching user", error: err.message });
  }
});

module.exports = router;
