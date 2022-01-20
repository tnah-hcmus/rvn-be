const nodemailer = require("nodemailer");
const config = require("../config/email.config");
module.exports = sendEmail;

async function sendEmail({ to, subject, html, from = config.emailFrom }) {
  try {
    // const transporter = nodemailer.createTransport(config.smtpOptions);
    const transporter = nodemailer.createTransport(config.smtpOptions2);
    await transporter.sendMail({ from, to, subject, html});
  } catch (err) {
    throw err;
  }
}
