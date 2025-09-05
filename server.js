const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { exec } = require("child_process");
const fs = require("fs").promises;
const path = require("path");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const leaderboardRoutes = require("./routes/leaderboard");
const progressRoutes = require("./routes/progress");

const app = express();
app.use(express.json());

// List of allowed frontend URLs
const allowedOrigins = [
  "http://localhost:3000",
  "https://codeine-9nep.vercel.app",
  "https://codeine-9nep-git-main-saikumars-projects-4be89848.vercel.app",
  "https://codeine-9nep-fvcxkre1q-saikumars-projects-4be89848.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Routes
app.use("/auth", authRoutes);
app.use("/leaderboard", leaderboardRoutes);
app.use("/", progressRoutes);

// Code execution endpoint
app.post("/run", async (req, res) => {
  const { language, code, input } = req.body;

  if (!language || !code || input === undefined) {
    return res.status(400).json({ error: "Missing language, code, or input" });
  }

  if (!["c", "cpp", "java", "python"].includes(language)) {
    return res.status(400).json({ error: "Unsupported language" });
  }

  const dir = path.join(__dirname, "temp");
  await fs.mkdir(dir, { recursive: true });

  // Ensure consistent unique ID
  const uniqueId = Date.now();
  let fileName, execFile, command;

  const inputFile = path.join(dir, `input-${uniqueId}.txt`);
  await fs.writeFile(inputFile, input);

  try {
    if (language === "c") {
      fileName = path.join(dir, `main-${uniqueId}.c`);
      execFile = path.join(dir, `main-${uniqueId}`);
      await fs.writeFile(fileName, code);
      command = `gcc ${fileName} -o ${execFile} && ${execFile} < ${inputFile}`;
    } else if (language === "cpp") {
      fileName = path.join(dir, `main-${uniqueId}.cpp`);
      execFile = path.join(dir, `main-${uniqueId}`);
      await fs.writeFile(fileName, code);
      command = `g++ ${fileName} -o ${execFile} && ${execFile} < ${inputFile}`;
    } else if (language === "java") {
      fileName = path.join(dir, `Solution${uniqueId}.java`);
      await fs.writeFile(fileName, code);
      command = `javac ${fileName} && java -cp ${dir} Solution${uniqueId} < ${inputFile}`;
    } else if (language === "python") {
      fileName = path.join(dir, `main-${uniqueId}.py`);
      await fs.writeFile(fileName, code);
      command = `python3 ${fileName} < ${inputFile}`;
    }

    exec(
      command,
      { timeout: 5000, maxBuffer: 1024 * 1024 },
      (error, stdout, stderr) => {
        if (error) {
          return res.status(500).json({ error: stderr || error.message });
        }
        res.json({ output: stdout || stderr });
      }
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    // Cleanup
    setTimeout(async () => {
      try {
        if (fileName) await fs.unlink(fileName).catch(() => {});
        await fs.unlink(inputFile).catch(() => {});
        if (language === "c" || language === "cpp") {
          await fs.unlink(execFile).catch(() => {});
        }
        if (language === "java") {
          await fs.unlink(path.join(dir, `Solution${uniqueId}.class`)).catch(() => {});
        }
      } catch (e) {
        console.error("Cleanup error:", e);
      }
    }, 2000);
  }
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
