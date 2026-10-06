const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const app = express();
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

// ---------- Models ----------
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Name is required"], trim: true },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },
  },
  { timestamps: true }
);
const User = mongoose.model("User", userSchema);

const jobSchema = new mongoose.Schema(
  {
    company: { type: String, required: [true, "Company is required"], trim: true },
    role: { type: String, required: [true, "Role is required"], trim: true },
    status: {
      type: String,
      enum: ["Applied", "Interview", "Offer", "Rejected"],
      default: "Applied",
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);
const Job = mongoose.model("Job", jobSchema);

// ---------- Auth helpers ----------
const makeToken = (user) =>
  jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

// Middleware: runs before protected routes and checks the token
function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Please log in" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.id;
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}

// ---------- Public routes ----------
app.get("/", (req, res) => {
  res.send("Hello, my server is running!");
});

app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ message: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed });

    res.status(201).json({
      token: makeToken(user),
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: (email || "").toLowerCase() });
    const ok = user && (await bcrypt.compare(password || "", user.password));
    if (!ok) return res.status(401).json({ message: "Wrong email or password" });

    res.json({
      token: makeToken(user),
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ---------- Protected job routes (login required) ----------
app.use("/api/jobs", requireAuth);

// Get MY jobs
app.get("/api/jobs", async (req, res) => {
  const jobs = await Job.find({ user: req.userId }).sort({ createdAt: -1 });
  res.json(jobs);
});

// Create a job for me
app.post("/api/jobs", async (req, res) => {
  try {
    const { company, role, status } = req.body;
    const job = await Job.create({ company, role, status, user: req.userId });
    res.status(201).json(job);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update MY job
app.put("/api/jobs/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid id" });
  }
  try {
    const updates = {};
    for (const field of ["company", "role", "status"]) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    const job = await Job.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      updates,
      { new: true, runValidators: true }
    );
    if (!job) return res.status(404).json({ message: "Job not found" });
    res.json(job);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete MY job
app.delete("/api/jobs/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid id" });
  }
  const job = await Job.findOneAndDelete({ _id: req.params.id, user: req.userId });
  if (!job) return res.status(404).json({ message: "Job not found" });
  res.status(204).end();
});

// ---------- Start ----------
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(5000, () => console.log("Server running on http://localhost:5000"));
  })
  .catch((err) => console.error("MongoDB connection failed:", err.message));