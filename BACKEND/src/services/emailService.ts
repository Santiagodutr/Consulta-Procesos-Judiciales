import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Verify connection configuration
    this.transporter.verify((error) => {
      if (error) {
        logger.error('Email configuration error:', error);
      } else {
        logger.info('Email server is ready to send messages');
      }
    });
  }

  async sendEmail(to: string, subject: string, html: string, text?: string) {
    try {
      const mailOptions = {
        from: process.env.SMTP_USER,
        to,
        subject,
        html,
        text: text || this.stripHtml(html),
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent successfully to ${to}`);
      return result;
    } catch (error) {
      logger.error(`Failed to send email to ${to}:`, error);
      throw error;
    }
  }

  async sendVerificationEmail(email: string, userId: string) {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${userId}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Verify Your Email</title>
          <style>
            .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header { background-color: #007bff; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background-color: #f9f9f9; }
            .button { 
              display: inline-block; 
              background-color: #007bff; 
              color: white; 
              padding: 12px 24px; 
              text-decoration: none; 
              border-radius: 4px; 
              margin: 20px 0;
            }
            .footer { text-align: center; color: #666; padding: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Judicial Processes Consultation</h1>
            </div>
            <div class="content">
              <h2>Verify Your Email Address</h2>
              <p>Thank you for registering! Please click the button below to verify your email address:</p>
              <a href="${verificationUrl}" class="button">Verify Email</a>
              <p>Or copy and paste this link in your browser:</p>
              <p><a href="${verificationUrl}">${verificationUrl}</a></p>
              <p>This link will expire in 24 hours.</p>
            </div>
            <div class="footer">
              <p>If you didn't create this account, please ignore this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail(email, 'Verify Your Email Address', html);
  }

  async sendPasswordResetEmail(email: string, resetUrl: string) {
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Reset Your Password</title>
          <style>
            .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header { background-color: #dc3545; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background-color: #f9f9f9; }
            .button { 
              display: inline-block; 
              background-color: #dc3545; 
              color: white; 
              padding: 12px 24px; 
              text-decoration: none; 
              border-radius: 4px; 
              margin: 20px 0;
            }
            .footer { text-align: center; color: #666; padding: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <h2>Reset Your Password</h2>
              <p>We received a request to reset your password. Click the button below to create a new password:</p>
              <a href="${resetUrl}" class="button">Reset Password</a>
              <p>Or copy and paste this link in your browser:</p>
              <p><a href="${resetUrl}">${resetUrl}</a></p>
              <p>This link will expire in 1 hour for security reasons.</p>
            </div>
            <div class="footer">
              <p>If you didn't request a password reset, please ignore this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail(email, 'Reset Your Password', html);
  }

  async sendProcessUpdateNotification(email: string, processNumber: string, updateDetails: string) {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Process Update Notification</title>
          <style>
            .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header { background-color: #28a745; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background-color: #f9f9f9; }
            .update-box { 
              background-color: #e9f7ef; 
              border-left: 4px solid #28a745; 
              padding: 15px; 
              margin: 20px 0;
            }
            .footer { text-align: center; color: #666; padding: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Process Update Alert</h1>
            </div>
            <div class="content">
              <h2>Your Process Has Been Updated</h2>
              <p>Process Number: <strong>${processNumber}</strong></p>
              <div class="update-box">
                <h3>Update Details:</h3>
                <p>${updateDetails}</p>
              </div>
              <p>Please log in to your account to view the complete details.</p>
            </div>
            <div class="footer">
              <p>You received this notification because you have enabled process update alerts.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail(email, `Process Update: ${processNumber}`, html);
  }

  async sendHearingReminder(email: string, processNumber: string, hearingDate: Date, courtName: string) {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Hearing Reminder</title>
          <style>
            .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header { background-color: #fd7e14; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background-color: #f9f9f9; }
            .reminder-box { 
              background-color: #fff3cd; 
              border-left: 4px solid #fd7e14; 
              padding: 15px; 
              margin: 20px 0;
            }
            .footer { text-align: center; color: #666; padding: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Hearing Reminder</h1>
            </div>
            <div class="content">
              <h2>Upcoming Hearing Alert</h2>
              <div class="reminder-box">
                <h3>Hearing Details:</h3>
                <p><strong>Process:</strong> ${processNumber}</p>
                <p><strong>Date & Time:</strong> ${hearingDate.toLocaleString()}</p>
                <p><strong>Court:</strong> ${courtName}</p>
              </div>
              <p>Please make sure to attend or have legal representation present.</p>
            </div>
            <div class="footer">
              <p>You received this reminder because you have enabled hearing alerts.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail(email, `Hearing Reminder: ${processNumber}`, html);
  }

  async sendWeeklySummary(email: string, summaryData: any) {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Weekly Process Summary</title>
          <style>
            .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header { background-color: #6f42c1; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background-color: #f9f9f9; }
            .stat-box { 
              background-color: white; 
              border: 1px solid #dee2e6; 
              padding: 15px; 
              margin: 10px 0; 
              border-radius: 4px;
            }
            .footer { text-align: center; color: #666; padding: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Weekly Process Summary</h1>
            </div>
            <div class="content">
              <h2>Your Week in Review</h2>
              <div class="stat-box">
                <h3>Process Updates</h3>
                <p>${summaryData.updates || 0} processes were updated this week</p>
              </div>
              <div class="stat-box">
                <h3>Upcoming Hearings</h3>
                <p>${summaryData.upcomingHearings || 0} hearings scheduled for next week</p>
              </div>
              <div class="stat-box">
                <h3>New Documents</h3>
                <p>${summaryData.newDocuments || 0} new documents available</p>
              </div>
            </div>
            <div class="footer">
              <p>You received this summary because you have enabled weekly summary emails.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail(email, 'Weekly Process Summary', html);
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>?/gm, '');
  }
}

export const emailService = new EmailService();
export default emailService;