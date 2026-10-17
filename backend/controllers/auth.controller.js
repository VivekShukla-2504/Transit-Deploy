const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { OAuth2Client } = require("google-auth-library");
const { User, ROLES } = require("../models/User");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function signToken(user) {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      name: user.name,
      email: user.email,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "8h",
    }
  );
}

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        message: "Name, email, password, and role are all required.",
      });
    }

    if (!ROLES.includes(role)) {
      return res.status(400).json({
        message: `Role must be one of: ${ROLES.join(", ")}`,
      });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&#).",
      });
    }

    const existing = await User.findOne({
      email: email.toLowerCase(),
    });

    if (existing) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
    });

    const token = signToken(user);

    return res.status(201).json({
      token,
      user: user.toSafeObject(),
    });
  } catch (err) {
    return res.status(500).json({
      message: "Could not create account.",
      error: err.message,
    });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({
        message: "Email, password, and role are required.",
      });
    }

    if (!ROLES.includes(role)) {
      return res.status(400).json({
        message: `Role must be one of: ${ROLES.join(", ")}`,
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const match = await user.comparePassword(password);

    if (!match) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    if (user.role !== role) {
      return res.status(401).json({
        message: "The selected role does not match this account's role.",
      });
    }

    const token = signToken(user);

    return res.json({
      token,
      user: user.toSafeObject(),
    });
  } catch (err) {
    return res.status(500).json({
      message: "Login failed.",
      error: err.message,
    });
  }
};

// GET /api/auth/roles
exports.getRoles = (req, res) => {
  return res.json({
    roles: ROLES,
  });
};

// POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  try {
    const { email, role } = req.body;

    if (!email || !role) {
      return res.status(400).json({
        message: "Email and role are required.",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
      role,
    });

    if (!user) {
      return res.status(404).json({
        message: "No account found with the specified email and role.",
      });
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetOtp = otp;
    user.resetOtpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes valid
    user.resetOtpAttempts = 0;
    await user.save();

    // Configure SMTP transport or fallback to Ethereal
    let transporter;
    let previewUrl = null;
    let fromEmail = '"TransitOps Support" <noreply@transitops.demo>';

    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT, 10) || 587,
        secure: process.env.SMTP_SECURE === "true", // true for port 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      if (process.env.SMTP_FROM) {
        fromEmail = process.env.SMTP_FROM;
      }
    } else {
      // Fallback to ethereal.email for test mode
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    }

    // Send email with defined transport object containing the OTP
    const mailOptions = {
      from: fromEmail,
      to: user.email,
      subject: "Password Reset OTP - TransitOps",
      text: `Hello ${user.name},\n\nYour OTP for password reset is: ${otp}.\n\nIt is valid for 10 minutes. If you did not request this, please ignore this email.\n`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #4f46e5; margin-bottom: 20px; font-weight: 700;">TransitOps Fleet Control</h2>
          <p style="color: #1e293b; font-size: 15px;">Hello <strong>${user.name}</strong>,</p>
          <p style="color: #334155; font-size: 14px; line-height: 1.6;">You requested a password reset for your TransitOps account under the role of <strong>${user.role}</strong>.</p>
          <p style="color: #334155; font-size: 14px; line-height: 1.6;">Use the following One-Time Password (OTP) to complete your password reset:</p>
          <div style="margin: 25px 0; text-align: center;">
            <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #4f46e5; background-color: #f1f5f9; padding: 12px 30px; border-radius: 8px; display: inline-block;">${otp}</span>
          </div>
          <p style="color: #dc2626; font-size: 13px; font-weight: 600;">This OTP code is valid for 10 minutes only.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="color: #94a3b8; font-size: 11px;">If you did not make this request, you can safely ignore this email.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);

    if (!process.env.SMTP_HOST) {
      previewUrl = nodemailer.getTestMessageUrl(info);
      console.log("-----------------------------------------");
      console.log("📧 Ethereal Email Sent!");
      console.log(`Preview URL: ${previewUrl}`);
      console.log("-----------------------------------------");
    } else {
      console.log("-----------------------------------------");
      console.log(`📧 Real SMTP Email Sent to ${user.email}!`);
      console.log("-----------------------------------------");
    }

    return res.json({
      message: `A 6-digit OTP code has been sent to ${email}.`,
      previewUrl,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Could not process forgot password request.",
      error: err.message,
    });
  }
};

// POST /api/auth/reset-password
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, password } = req.body;

    if (!email || !otp || !password) {
      return res.status(400).json({
        message: "Email, OTP, and new password are required.",
      });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message: "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&#).",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    // Verify OTP exists and has not expired
    if (!user.resetOtp || !user.resetOtpExpires || user.resetOtpExpires < Date.now()) {
      return res.status(400).json({
        message: "Invalid or expired OTP code. Please request a new one.",
      });
    }

    // Check maximum failed attempts to prevent brute force
    if (user.resetOtpAttempts >= 5) {
      user.resetOtp = undefined;
      user.resetOtpExpires = undefined;
      user.resetOtpAttempts = 0;
      await user.save();
      return res.status(429).json({
        message: "Too many failed OTP attempts. For security, your OTP has been invalidated. Please request a new one.",
      });
    }

    // Verify OTP match
    if (user.resetOtp !== otp) {
      user.resetOtpAttempts = (user.resetOtpAttempts || 0) + 1;
      await user.save();
      const remaining = 5 - user.resetOtpAttempts;
      return res.status(400).json({
        message: remaining > 0
          ? `Invalid OTP code. ${remaining} attempt(s) remaining.`
          : "Invalid OTP code. Maximum attempts exceeded. Please request a new OTP.",
      });
    }

    // Update password and clear OTP fields
    user.password = password;
    user.resetOtp = undefined;
    user.resetOtpExpires = undefined;
    user.resetOtpAttempts = 0;
    await user.save();

    return res.json({
      message: "Password has been successfully reset. You can now login with your new password.",
    });
  } catch (err) {
    return res.status(500).json({
      message: "Could not reset password.",
      error: err.message,
    });
  }
};

// POST /api/auth/google - Authenticate using Google OAuth ID token
exports.googleAuth = async (req, res) => {
  try {
    const { credential, role } = req.body;

    if (!credential) {
      return res.status(400).json({
        message: "Google credential token is required.",
      });
    }

    let payload;
    const clientId = process.env.GOOGLE_CLIENT_ID;

    if (clientId) {
      // Verify token cryptographically against Google's public certificates
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: clientId,
      });
      payload = ticket.getPayload();
    } else {
      // Fallback decode if GOOGLE_CLIENT_ID not yet specified in .env during dev
      const decoded = jwt.decode(credential);
      if (!decoded || !decoded.email) {
        return res.status(400).json({
          message: "Invalid Google credential token.",
        });
      }
      payload = decoded;
    }

    const { email, name, picture, sub: googleId } = payload;
    if (!email) {
      return res.status(400).json({
        message: "Google account does not provide an email address.",
      });
    }

    let user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      // User exists: link Google ID and avatar if needed
      if (!user.googleId) user.googleId = googleId;
      if (picture && !user.avatar) user.avatar = picture;
      await user.save();
    } else {
      // New User: create account via Google
      const assignedRole = role && ROLES.includes(role) ? role : "Driver";
      user = await User.create({
        name: name || email.split("@")[0],
        email: email.toLowerCase(),
        role: assignedRole,
        googleId,
        avatar: picture,
        authProvider: "google",
      });
    }

    const token = signToken(user);

    return res.json({
      token,
      user: user.toSafeObject(),
    });
  } catch (err) {
    console.error("Google Auth error:", err);
    return res.status(401).json({
      message: "Google authentication failed. Please try again or use email login.",
      error: err.message,
    });
  }
};

// GET /api/auth/me - Validate current session token and fetch profile
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User account not found." });
    }
    return res.json({ user: user.toSafeObject() });
  } catch (err) {
    return res.status(500).json({
      message: "Could not fetch user profile.",
      error: err.message,
    });
  }
};