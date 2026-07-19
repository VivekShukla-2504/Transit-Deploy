const nodemailer = require("nodemailer");
const { Driver } = require("../models/Driver");

async function checkExpiredLicenses() {
  console.log("⏳ Starting background check for expired driver licenses...");

  try {
    const expiredDrivers = await Driver.find({
      licenseExpiryDate: { $lt: new Date() },
      email: { $ne: null },
      licenseExpiryNotificationSent: { $ne: true }
    });

    if (expiredDrivers.length === 0) {
      console.log("✅ No new expired driver licenses found.");
      return;
    }

    console.log(`⚠️ Found ${expiredDrivers.length} driver(s) with expired licenses to notify.`);

    // Configure transporter (reads SMTP from environment variables)
    let transporter;
    let fromEmail = '"TransitOps Support" <noreply@transitops.demo>';

    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT, 10) || 587,
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      if (process.env.SMTP_FROM) {
        fromEmail = process.env.SMTP_FROM;
      }
    } else {
      // Ethereal fallback for local development if no SMTP configured
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

    for (const driver of expiredDrivers) {
      console.log(`✉️ Dispatching license expiration warning to: ${driver.name} (${driver.email})...`);

      const mailOptions = {
        from: fromEmail,
        to: driver.email,
        subject: "Action Required: Driver License Expired - TransitOps",
        text: `Hello ${driver.name},\n\nOur records show that your driver license (No: ${driver.licenseNumber}) expired on ${driver.licenseExpiryDate.toDateString()}.\n\nAccording to safety regulations, you cannot be dispatched on active trips until your license information is renewed in the system.\n\nPlease contact your Fleet Manager to upload your renewed license.\n\nBest regards,\nTransitOps Operations Team\n`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #fee2e2; border-radius: 12px; background-color: #fef2f2;">
            <h2 style="color: #dc2626; margin-bottom: 20px; font-weight: 700;">License Expiration Alert</h2>
            <p style="color: #1e293b; font-size: 15px;">Hello <strong>${driver.name}</strong>,</p>
            <p style="color: #334155; font-size: 14px; line-height: 1.6;">Our operations platform indicates that your driver's license has expired:</p>
            
            <div style="background-color: #ffffff; padding: 15px; border-radius: 8px; border: 1px solid #fca5a5; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #1e293b;">
                <tr>
                  <td style="padding: 4px 0; font-weight: 600; width: 120px;">License No:</td>
                  <td style="padding: 4px 0;">${driver.licenseNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-weight: 600;">Category:</td>
                  <td style="padding: 4px 0;">${driver.licenseCategory}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-weight: 600;">Expiry Date:</td>
                  <td style="padding: 4px 0; color: #dc2626; font-weight: 700;">${driver.licenseExpiryDate.toDateString()}</td>
                </tr>
              </table>
            </div>

            <p style="color: #ef4444; font-size: 14px; font-weight: 600; line-height: 1.6;">CRITICAL: You are currently blocked from active fleet dispatch until a renewed license is registered.</p>
            <p style="color: #334155; font-size: 14px; line-height: 1.6;">Please contact your regional Fleet Manager immediately to submit your renewed documents.</p>
            <hr style="border: 0; border-top: 1px solid #fee2e2; margin: 20px 0;" />
            <p style="color: #94a3b8; font-size: 11px;">This is an automated safety operations message. If you believe this is in error, please consult management.</p>
          </div>
        `,
      };

      const info = await transporter.sendMail(mailOptions);
      
      if (!process.env.SMTP_HOST) {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        console.log(`[Dev Ethereal] Expiration mail sent! View: ${previewUrl}`);
      } else {
        console.log(`✅ Expiration mail successfully sent to ${driver.email}`);
      }

      // Mark notification as sent so we don't duplicate
      driver.licenseExpiryNotificationSent = true;
      await driver.save();
    }
  } catch (error) {
    console.error("❌ Error in background license expiry check:", error);
  }
}

function startLicenseExpiryChecks() {
  // Execute once immediately on startup
  checkExpiredLicenses();

  // Run every 24 hours
  setInterval(checkExpiredLicenses, 24 * 60 * 60 * 1000);
}

module.exports = { startLicenseExpiryChecks, checkExpiredLicenses };
