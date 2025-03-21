import nodemailer from "nodemailer";
import dotenv from "dotenv"
dotenv.config();

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com", 
    port: 587,
    secure: false, 
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    }
  });
  

  
  const sendEmail = async (options) => {
    try {
      const mailOptions = {
        from: `Education Portal <${process.env.EMAIL_FROM}>`,
        to: options.email,
        subject: options.subject,
        html: options.html
      };
  
      const info = await transporter.sendMail(mailOptions);
      return info;
    } catch (error) {
      console.error('Email sending error:', error);
      throw new Error('Error sending email');
    }
  };
  
  
export const sendVerificationEmail = async (options) => {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px; background-color: #f9f9f9;">
        <h2 style="color: #333; text-align: center; margin-bottom: 20px;">Welcome to Education Portal!</h2>
        <p style="color: #555; font-size: 16px; line-height: 1.5;">Hello ${options.firstName},</p>
        <p style="color: #555; font-size: 16px; line-height: 1.5;">Thank you for registering on our platform. To complete your registration, please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${options.verificationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">Verify Email</a>
        </div>
        <p style="color: #555; font-size: 16px; line-height: 1.5;">Or copy and paste this link in your browser:</p>
        <p style="color: #666; font-size: 14px; word-break: break-all; background-color: #efefef; padding: 10px; border-radius: 4px;">${options.verificationUrl}</p>
        <p style="color: #555; font-size: 16px; line-height: 1.5;">If you didn't create an account, please ignore this email.</p>
        <p style="color: #555; font-size: 16px; line-height: 1.5;">Thank you,<br>The Education Portal Team</p>
      </div>
    `;
  
    return await sendEmail({
      email: options.email,
      subject: options.subject,
      html
    });
  };