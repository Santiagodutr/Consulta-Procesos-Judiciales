package com.judicial.processes.service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {
    
    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);
    
    @Autowired
    private JavaMailSender mailSender;
    
    @Value("${spring.mail.username}")
    private String fromEmail;
    
    @Value("${frontend.url:http://localhost:3000}")
    private String frontendUrl;
    
    /**
     * Send a generic email
     */
    public void sendEmail(String to, String subject, String htmlContent) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            
            mailSender.send(message);
            logger.info("Email sent successfully to: {}", to);
            
        } catch (Exception e) {
            logger.error("Failed to send email to: " + to, e);
            throw new RuntimeException("Failed to send email", e);
        }
    }
    
    /**
     * Send email verification email
     */
    public void sendVerificationEmail(String email, String userId) {
        String verificationUrl = frontendUrl + "/verify-email/" + userId;
        
        String htmlContent = buildEmailTemplate(
            "Welcome to Judicial Processes Consultation",
            "Verify Your Email Address",
            "Thank you for registering! Please click the button below to verify your email address:",
            "Verify Email",
            verificationUrl,
            "This link will expire in 24 hours.",
            "If you didn't create this account, please ignore this email.",
            "#007bff"
        );
        
        sendEmail(email, "Verify Your Email Address", htmlContent);
    }
    
    /**
     * Send password reset email
     */
    public void sendPasswordResetEmail(String email, String resetUrl) {
        String htmlContent = buildEmailTemplate(
            "Password Reset Request",
            "Reset Your Password",
            "We received a request to reset your password. Click the button below to create a new password:",
            "Reset Password",
            resetUrl,
            "This link will expire in 1 hour for security reasons.",
            "If you didn't request a password reset, please ignore this email.",
            "#dc3545"
        );
        
        sendEmail(email, "Reset Your Password", htmlContent);
    }
    
    /**
     * Send process update notification
     */
    public void sendProcessUpdateNotification(String email, String processNumber, String updateDetails) {
        String htmlContent = buildProcessNotificationTemplate(
            "Process Update Alert",
            "Your Process Has Been Updated",
            processNumber,
            updateDetails,
            "You received this notification because you have enabled process update alerts.",
            "#28a745"
        );
        
        sendEmail(email, "Process Update: " + processNumber, htmlContent);
    }
    
    /**
     * Send hearing reminder
     */
    public void sendHearingReminder(String email, String processNumber, LocalDateTime hearingDate, String courtName) {
        String formattedDate = hearingDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));
        
        String updateDetails = String.format(
            "<strong>Process:</strong> %s<br>" +
            "<strong>Date & Time:</strong> %s<br>" +
            "<strong>Court:</strong> %s",
            processNumber, formattedDate, courtName
        );
        
        String htmlContent = buildProcessNotificationTemplate(
            "Hearing Reminder",
            "Upcoming Hearing Alert",
            processNumber,
            updateDetails,
            "You received this reminder because you have enabled hearing alerts.",
            "#fd7e14"
        );
        
        sendEmail(email, "Hearing Reminder: " + processNumber, htmlContent);
    }
    
    /**
     * Send weekly summary
     */
    public void sendWeeklySummary(String email, WeeklySummaryData summaryData) {
        String htmlContent = buildWeeklySummaryTemplate(
            "Weekly Process Summary",
            "Your Week in Review",
            summaryData,
            "You received this summary because you have enabled weekly summary emails.",
            "#6f42c1"
        );
        
        sendEmail(email, "Weekly Process Summary", htmlContent);
    }
    
    /**
     * Build generic email template
     */
    private String buildEmailTemplate(String title, String heading, String message, 
                                    String buttonText, String buttonUrl, String note, 
                                    String footer, String color) {
        return String.format(
            "<!DOCTYPE html>" +
            "<html>" +
            "<head>" +
            "<meta charset=\"utf-8\">" +
            "<title>%s</title>" +
            "<style>" +
            ".container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }" +
            ".header { background-color: %s; color: white; padding: 20px; text-align: center; }" +
            ".content { padding: 30px; background-color: #f9f9f9; }" +
            ".button { " +
            "display: inline-block; " +
            "background-color: %s; " +
            "color: white; " +
            "padding: 12px 24px; " +
            "text-decoration: none; " +
            "border-radius: 4px; " +
            "margin: 20px 0;" +
            "}" +
            ".footer { text-align: center; color: #666; padding: 20px; }" +
            "</style>" +
            "</head>" +
            "<body>" +
            "<div class=\"container\">" +
            "<div class=\"header\">" +
            "<h1>%s</h1>" +
            "</div>" +
            "<div class=\"content\">" +
            "<h2>%s</h2>" +
            "<p>%s</p>" +
            "<a href=\"%s\" class=\"button\">%s</a>" +
            "<p>Or copy and paste this link in your browser:</p>" +
            "<p><a href=\"%s\">%s</a></p>" +
            "<p>%s</p>" +
            "</div>" +
            "<div class=\"footer\">" +
            "<p>%s</p>" +
            "</div>" +
            "</div>" +
            "</body>" +
            "</html>",
            title, color, color, title, heading, message, buttonUrl, buttonText, 
            buttonUrl, buttonUrl, note, footer
        );
    }
    
    /**
     * Build process notification template
     */
    private String buildProcessNotificationTemplate(String title, String heading, 
                                                  String processNumber, String details, 
                                                  String footer, String color) {
        return String.format(
            "<!DOCTYPE html>" +
            "<html>" +
            "<head>" +
            "<meta charset=\"utf-8\">" +
            "<title>%s</title>" +
            "<style>" +
            ".container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }" +
            ".header { background-color: %s; color: white; padding: 20px; text-align: center; }" +
            ".content { padding: 30px; background-color: #f9f9f9; }" +
            ".update-box { " +
            "background-color: #e9f7ef; " +
            "border-left: 4px solid %s; " +
            "padding: 15px; " +
            "margin: 20px 0;" +
            "}" +
            ".footer { text-align: center; color: #666; padding: 20px; }" +
            "</style>" +
            "</head>" +
            "<body>" +
            "<div class=\"container\">" +
            "<div class=\"header\">" +
            "<h1>%s</h1>" +
            "</div>" +
            "<div class=\"content\">" +
            "<h2>%s</h2>" +
            "<p>Process Number: <strong>%s</strong></p>" +
            "<div class=\"update-box\">" +
            "<h3>Details:</h3>" +
            "<p>%s</p>" +
            "</div>" +
            "<p>Please log in to your account to view the complete details.</p>" +
            "</div>" +
            "<div class=\"footer\">" +
            "<p>%s</p>" +
            "</div>" +
            "</div>" +
            "</body>" +
            "</html>",
            title, color, color, title, heading, processNumber, details, footer
        );
    }
    
    /**
     * Build weekly summary template
     */
    private String buildWeeklySummaryTemplate(String title, String heading, 
                                            WeeklySummaryData summaryData, 
                                            String footer, String color) {
        return String.format(
            "<!DOCTYPE html>" +
            "<html>" +
            "<head>" +
            "<meta charset=\"utf-8\">" +
            "<title>%s</title>" +
            "<style>" +
            ".container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }" +
            ".header { background-color: %s; color: white; padding: 20px; text-align: center; }" +
            ".content { padding: 30px; background-color: #f9f9f9; }" +
            ".stat-box { " +
            "background-color: white; " +
            "border: 1px solid #dee2e6; " +
            "padding: 15px; " +
            "margin: 10px 0; " +
            "border-radius: 4px;" +
            "}" +
            ".footer { text-align: center; color: #666; padding: 20px; }" +
            "</style>" +
            "</head>" +
            "<body>" +
            "<div class=\"container\">" +
            "<div class=\"header\">" +
            "<h1>%s</h1>" +
            "</div>" +
            "<div class=\"content\">" +
            "<h2>%s</h2>" +
            "<div class=\"stat-box\">" +
            "<h3>Process Updates</h3>" +
            "<p>%d processes were updated this week</p>" +
            "</div>" +
            "<div class=\"stat-box\">" +
            "<h3>Upcoming Hearings</h3>" +
            "<p>%d hearings scheduled for next week</p>" +
            "</div>" +
            "<div class=\"stat-box\">" +
            "<h3>New Documents</h3>" +
            "<p>%d new documents available</p>" +
            "</div>" +
            "</div>" +
            "<div class=\"footer\">" +
            "<p>%s</p>" +
            "</div>" +
            "</div>" +
            "</body>" +
            "</html>",
            title, color, title, heading, 
            summaryData.getUpdates(), summaryData.getUpcomingHearings(), 
            summaryData.getNewDocuments(), footer
        );
    }
    
    /**
     * Weekly summary data class
     */
    public static class WeeklySummaryData {
        private int updates;
        private int upcomingHearings;
        private int newDocuments;
        
        public WeeklySummaryData(int updates, int upcomingHearings, int newDocuments) {
            this.updates = updates;
            this.upcomingHearings = upcomingHearings;
            this.newDocuments = newDocuments;
        }
        
        public int getUpdates() { return updates; }
        public void setUpdates(int updates) { this.updates = updates; }
        public int getUpcomingHearings() { return upcomingHearings; }
        public void setUpcomingHearings(int upcomingHearings) { this.upcomingHearings = upcomingHearings; }
        public int getNewDocuments() { return newDocuments; }
        public void setNewDocuments(int newDocuments) { this.newDocuments = newDocuments; }
    }
}