const nodemailer = require("nodemailer");

const createTransporter = () => {
  if (
    !process.env.EMAIL_USER ||
    !process.env.EMAIL_APP_PASSWORD
  ) {
    throw new Error(
      "EMAIL_USER or EMAIL_APP_PASSWORD is missing"
    );
  }

  return nodemailer.createTransport({
    service: "gmail",

    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });
};

const sendOtpEmail = async (email, otp) => {
  const transporter = createTransporter();

  await transporter.sendMail({
    from: `"AgroConnect 360" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your AgroConnect 360 verification code",

    text: `Your AgroConnect 360 verification code is ${otp}. It expires in 5 minutes.`,

    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto;">
        
        <h2 style="color: #15803d;">
          AgroConnect 360
        </h2>

        <p>
          Use the following verification code to continue:
        </p>

        <div style="
          font-size: 32px;
          font-weight: bold;
          letter-spacing: 8px;
          margin: 24px 0;
        ">
          ${otp}
        </div>

        <p>
          This code expires in <strong>5 minutes</strong>.
        </p>

        <p style="color: #666; font-size: 13px;">
          If you did not request this code, you can safely ignore this email.
        </p>

      </div>
    `,
  });
};

module.exports = {
  sendOtpEmail,
};