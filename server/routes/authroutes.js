const express = require("express");
const router = express.Router();

const {
    registerUser,
    loginUser,
    getProfile
} = require("../controllers/authController");

const authMiddleware = require("../middleware/authMiddleware");

// ===============================
// PUBLIC ROUTES
// ===============================

// Register a new user
router.post("/register", registerUser);

// Login existing user
router.post("/login", loginUser);

// ===============================
// PROTECTED ROUTES
// ===============================

// Get logged-in user's profile
router.get("/profile", authMiddleware, getProfile);

module.exports = router;