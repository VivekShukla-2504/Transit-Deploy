const express = require("express");
const router = express.Router();

const authController = require("../controllers/auth.controller");
const auth = require("../middleware/auth");
const { authLimiter, forgotPasswordLimiter } = require("../middleware/rateLimiter");

// POST /api/auth/register (rate-limited)
router.post("/register", authLimiter, authController.register);

// POST /api/auth/login (rate-limited)
router.post("/login", authLimiter, authController.login);

// POST /api/auth/google - Google OAuth 2.0 (rate-limited)
router.post("/google", authLimiter, authController.googleAuth);

// POST /api/auth/forgot-password (strictly rate-limited)
router.post("/forgot-password", forgotPasswordLimiter, authController.forgotPassword);

// POST /api/auth/reset-password
router.post("/reset-password", authController.resetPassword);

// GET /api/auth/roles (public)
router.get("/roles", authController.getRoles);

// GET /api/auth/me (authenticated session check)
router.get("/me", auth, authController.getMe);

module.exports = router;