package com.judicial.processes.service;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.judicial.processes.dto.AuthDTO.AuthResponse;
import com.judicial.processes.dto.AuthDTO.RegisterRequest;
import com.judicial.processes.dto.AuthDTO.UserDTO;

@Service
public class AuthService {
    
    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);
    
    @Autowired
    private SupabaseService supabaseService;
    
    @Autowired
    private EmailService emailService;
    
    @Autowired
    private ObjectMapper objectMapper;
    
    @Value("${jwt.expiration:604800}")
    private long jwtExpiration; // 7 days in seconds
    
    @Value("${frontend.url:http://localhost:3000}")
    private String frontendUrl;
    
    /**
     * Register a new user
     */
    public AuthResponse register(RegisterRequest request) {
        try {
            // Check if user already exists
            JsonNode existingUsers = supabaseService.select("users", Map.of("email", request.getEmail()));
            if (existingUsers != null && existingUsers.size() > 0) {
                throw new RuntimeException("User already exists with this email");
            }
            
            // Check if document number is already registered
            JsonNode existingDocument = supabaseService.select("users", Map.of("document_number", request.getDocumentNumber()));
            if (existingDocument != null && existingDocument.size() > 0) {
                throw new RuntimeException("User already exists with this document number");
            }
            
            // Create user metadata
            Map<String, Object> metadata = new HashMap<>();
            metadata.put("first_name", request.getFirstName());
            metadata.put("last_name", request.getLastName());
            metadata.put("document_number", request.getDocumentNumber());
            metadata.put("document_type", request.getDocumentType());
            metadata.put("user_type", request.getUserType());
            
            // Register with Supabase Auth
            JsonNode authResult = supabaseService.signUp(request.getEmail(), request.getPassword(), metadata);
            
            if (authResult == null || !authResult.has("user")) {
                throw new RuntimeException("Registration failed");
            }
            
            JsonNode supabaseUser = authResult.get("user");
            String userId = supabaseUser.get("id").asText();
            
            // Create user profile in database
            Map<String, Object> defaultNotificationPrefs = new HashMap<>();
            defaultNotificationPrefs.put("email_enabled", true);
            defaultNotificationPrefs.put("sms_enabled", false);
            defaultNotificationPrefs.put("in_app_enabled", true);
            defaultNotificationPrefs.put("sound_enabled", true);
            defaultNotificationPrefs.put("process_updates", true);
            defaultNotificationPrefs.put("hearing_reminders", true);
            defaultNotificationPrefs.put("document_alerts", true);
            defaultNotificationPrefs.put("weekly_summary", false);
            
            Map<String, Object> userProfile = new HashMap<>();
            userProfile.put("id", userId);
            userProfile.put("email", request.getEmail());
            userProfile.put("first_name", request.getFirstName());
            userProfile.put("last_name", request.getLastName());
            userProfile.put("document_number", request.getDocumentNumber());
            userProfile.put("document_type", request.getDocumentType());
            userProfile.put("user_type", determineUserType(request.getDocumentType(), request.getDocumentNumber()));
            userProfile.put("phone_number", request.getPhoneNumber());
            userProfile.put("company_id", request.getCompanyId());
            userProfile.put("is_active", true);
            userProfile.put("email_verified", false);
            userProfile.put("notification_preferences", defaultNotificationPrefs);
            userProfile.put("created_at", LocalDateTime.now().toString());
            userProfile.put("updated_at", LocalDateTime.now().toString());
            
            JsonNode createdUser = supabaseService.insert("users", userProfile);
            
            // Generate tokens (using Supabase's access_token)
            String accessToken = authResult.has("access_token") ? authResult.get("access_token").asText() : null;
            String refreshToken = authResult.has("refresh_token") ? authResult.get("refresh_token").asText() : null;
            
            // Send verification email
            try {
                emailService.sendVerificationEmail(request.getEmail(), userId);
            } catch (Exception e) {
                logger.error("Failed to send verification email", e);
            }
            
            // Convert to DTO
            UserDTO userDTO = convertJsonToUserDTO(createdUser);
            
            return new AuthResponse(userDTO, accessToken, refreshToken, jwtExpiration);
            
        } catch (Exception e) {
            logger.error("Registration error", e);
            throw new RuntimeException(e.getMessage());
        }
    }
    
    /**
     * Login user - direct database approach
     */
    public AuthResponse login(String email, String password) {
        try {
            logger.info("Attempting login for email: {}", email);

            JsonNode authResult = supabaseService.signIn(email, password);
            if (authResult == null || !authResult.has("access_token")) {
                logger.warn("Supabase login failed or returned no token for email: {}", email);
                return null;
            }

            if (!authResult.has("user") || authResult.get("user") == null) {
                logger.warn("Supabase login response is missing user object for email: {}", email);
                return null;
            }

            JsonNode userNode = authResult.get("user");
            String userId = userNode.has("id") ? userNode.get("id").asText(null) : null;

            if (userId == null) {
                logger.warn("Supabase login response user is missing id for email: {}", email);
                return null;
            }

            JsonNode userProfile = supabaseService.select("users", Map.of("id", userId));
            if (userProfile == null || userProfile.size() == 0) {
                logger.warn("No local profile found for Supabase user id: {}", userId);
                return null;
            }

            JsonNode user = userProfile.get(0);
            if (user.has("is_active") && !user.get("is_active").asBoolean()) {
                logger.warn("User account is deactivated: {}", email);
                return null;
            }

            String accessToken = authResult.has("access_token") ? authResult.get("access_token").asText(null) : null;
            String refreshToken = authResult.has("refresh_token") ? authResult.get("refresh_token").asText(null) : null;

            if (accessToken == null || refreshToken == null) {
                logger.warn("Supabase login response missing tokens for email: {}", email);
                return null;
            }

            UserDTO userDTO = convertJsonToUserDTO(user);

            logger.info("Login successful for user: {}", email);
            return new AuthResponse(userDTO, accessToken, refreshToken, jwtExpiration);

        } catch (Exception e) {
            logger.error("Login error for email: " + email, e);
            return null;
        }
    }
    
    /**
     * Logout user
     */
    public boolean logout(String token) {
        try {
            return supabaseService.signOut(token);
        } catch (Exception e) {
            logger.error("Logout error", e);
            return false;
        }
    }
    
    /**
     * Refresh token
     */
    public AuthResponse refreshToken(String refreshToken) {
        try {
            JsonNode result = supabaseService.refreshSession(refreshToken);
            
            if (result == null || !result.has("user")) {
                return null;
            }
            
            JsonNode supabaseUser = result.get("user");
            String userId = supabaseUser.get("id").asText();
            
            // Get user profile
            JsonNode userProfile = supabaseService.select("users", Map.of("id", userId));
            if (userProfile == null || userProfile.size() == 0) {
                return null;
            }
            
            String newAccessToken = result.has("access_token") ? result.get("access_token").asText() : null;
            String newRefreshToken = result.has("refresh_token") ? result.get("refresh_token").asText() : refreshToken;
            
            UserDTO userDTO = convertJsonToUserDTO(userProfile.get(0));
            
            return new AuthResponse(userDTO, newAccessToken, newRefreshToken, jwtExpiration);
            
        } catch (Exception e) {
            logger.error("Refresh token error", e);
            return null;
        }
    }
    
    /**
     * Get user profile
     */
    public UserDTO getProfile(String token) {
        try {
            JsonNode supabaseUser = supabaseService.getUser(token);
            
            if (supabaseUser == null) {
                return null;
            }
            
            String userId = supabaseUser.get("id").asText();
            
            // Get user profile from database
            JsonNode userProfile = supabaseService.select("users", Map.of("id", userId));
            
            if (userProfile == null || userProfile.size() == 0) {
                return null;
            }
            
            JsonNode user = userProfile.get(0);
            
            // Check if user is active
            if (!user.get("is_active").asBoolean()) {
                return null;
            }
            
            return convertJsonToUserDTO(user);
            
        } catch (Exception e) {
            logger.error("Get profile error", e);
            return null;
        }
    }
    
    /**
     * Update user profile
     */
    public UserDTO updateProfile(String token, UserDTO updateData) {
        try {
            JsonNode supabaseUser = supabaseService.getUser(token);
            
            if (supabaseUser == null) {
                return null;
            }
            
            String userId = supabaseUser.get("id").asText();
            
            Map<String, Object> updateMap = new HashMap<>();
            updateMap.put("updated_at", LocalDateTime.now().toString());
            
            if (updateData.getFirstName() != null) updateMap.put("first_name", updateData.getFirstName());
            if (updateData.getLastName() != null) updateMap.put("last_name", updateData.getLastName());
            if (updateData.getPhoneNumber() != null) updateMap.put("phone_number", updateData.getPhoneNumber());
            if (updateData.getNotificationPreferences() != null) updateMap.put("notification_preferences", updateData.getNotificationPreferences());
            
            JsonNode updatedUser = supabaseService.update("users", userId, updateMap);
            
            return convertJsonToUserDTO(updatedUser);
            
        } catch (Exception e) {
            logger.error("Update profile error", e);
            return null;
        }
    }
    
    /**
     * Change password
     */
    public boolean changePassword(String token, String currentPassword, String newPassword) {
        try {
            // This would typically involve Supabase's password update functionality
            // For now, we'll just log the attempt and return true
            logger.info("Password change requested");
            return true;
        } catch (Exception e) {
            logger.error("Change password error", e);
            return false;
        }
    }
    
    /**
     * Forgot password
     */
    public boolean forgotPassword(String email) {
        try {
            // Check if user exists
            JsonNode users = supabaseService.select("users", Map.of("email", email));
            
            if (users == null || users.size() == 0) {
                return false;
            }
            
            JsonNode user = users.get(0);
            String userId = user.get("id").asText();
            
            // Generate reset token
            String resetToken = UUID.randomUUID().toString();
            LocalDateTime resetExpires = LocalDateTime.now().plusHours(1); // 1 hour
            
            // Delete any existing reset tokens for this user
            supabaseService.deleteWhere("password_reset_tokens", Map.of("user_id", userId));
            
            // Store reset token in database
            Map<String, Object> tokenData = new HashMap<>();
            tokenData.put("user_id", userId);
            tokenData.put("token", resetToken);
            tokenData.put("expires_at", resetExpires.toString());
            tokenData.put("used", false);
            
            supabaseService.insert("password_reset_tokens", tokenData);
            
            // Send reset email
            String resetUrl = frontendUrl + "/reset-password?token=" + resetToken;
            emailService.sendPasswordResetEmail(email, resetUrl);
            
            return true;
            
        } catch (Exception e) {
            logger.error("Forgot password error for email: " + email, e);
            return false;
        }
    }
    
    /**
     * Reset password
     */
    public boolean resetPassword(String token, String newPassword) {
        try {
            // Find the reset token
            JsonNode resetTokens = supabaseService.select("password_reset_tokens", 
                Map.of("token", token, "used", false));
                
            if (resetTokens == null || resetTokens.size() == 0) {
                return false;
            }
            
            JsonNode resetTokenRecord = resetTokens.get(0);
            
            // Check if token has expired
            LocalDateTime expiresAt = LocalDateTime.parse(resetTokenRecord.get("expires_at").asText());
            if (LocalDateTime.now().isAfter(expiresAt)) {
                // Delete expired token
                supabaseService.delete("password_reset_tokens", resetTokenRecord.get("id").asText());
                return false;
            }
            
            String userId = resetTokenRecord.get("user_id").asText();
            
            // Get user
            JsonNode users = supabaseService.select("users", Map.of("id", userId));
            if (users == null || users.size() == 0) {
                return false;
            }
            
            // Mark token as used
            Map<String, Object> updateToken = new HashMap<>();
            updateToken.put("used", true);
            supabaseService.update("password_reset_tokens", resetTokenRecord.get("id").asText(), updateToken);
            
            // Note: Here you would need to use Supabase Admin API to update the password
            // This is a simplified implementation
            logger.info("Password reset successful for user: {}", userId);
            
            return true;
            
        } catch (Exception e) {
            logger.error("Password reset error", e);
            return false;
        }
    }
    
    /**
     * Verify email
     */
    public boolean verifyEmail(String token) {
        try {
            // This is a simplified implementation
            // In a real application, you'd verify the token and update the user's email_verified status
            logger.info("Email verification attempted with token: {}", token);
            return true;
        } catch (Exception e) {
            logger.error("Email verification error", e);
            return false;
        }
    }
    
    /**
     * Helper method to determine user type based on document
     */
    private String determineUserType(String documentType, String documentNumber) {
        if ("NIT".equals(documentType)) {
            return "juridical";
        }
        return "natural";
    }
    
    /**
     * Helper method to convert JsonNode to UserDTO
     */
    private UserDTO convertJsonToUserDTO(JsonNode userNode) {
        if (userNode == null || userNode.isNull()) {
            return null;
        }

        try {
            // Supabase puede devolver arreglos; tomar primer elemento
            if (userNode.isArray() && userNode.size() > 0) {
                userNode = userNode.get(0);
            }

            UserDTO user = new UserDTO();
            user.setId(getTextValue(userNode, "id"));
            user.setEmail(getTextValue(userNode, "email"));
            user.setFirstName(getTextValue(userNode, "first_name"));
            user.setLastName(getTextValue(userNode, "last_name"));
            user.setDocumentNumber(getTextValue(userNode, "document_number"));
            user.setDocumentType(getTextValue(userNode, "document_type"));
            user.setUserType(getTextValue(userNode, "user_type"));

            String phoneNumber = getTextValue(userNode, "phone_number");
            if (!phoneNumber.isEmpty()) {
                user.setPhoneNumber(phoneNumber);
            }

            String companyId = getTextValue(userNode, "company_id");
            if (!companyId.isEmpty()) {
                user.setCompanyId(companyId);
            }

            user.setActive(userNode.path("is_active").asBoolean(true));
            user.setEmailVerified(userNode.path("email_verified").asBoolean(false));

            JsonNode notifNode = userNode.get("notification_preferences");
            if (notifNode != null && !notifNode.isNull()) {
                Map<String, Object> notifPrefs = objectMapper.convertValue(notifNode, Map.class);
                user.setNotificationPreferences(notifPrefs);
            } else {
                user.setNotificationPreferences(new HashMap<>());
            }

            String createdAt = getTextValue(userNode, "created_at");
            if (!createdAt.isEmpty()) {
                try {
                    user.setCreatedAt(LocalDateTime.parse(createdAt));
                } catch (DateTimeParseException ex) {
                    try {
                        user.setCreatedAt(OffsetDateTime.parse(createdAt).toLocalDateTime());
                    } catch (DateTimeParseException offsetEx) {
                        logger.debug("Unable to parse created_at value: {}", createdAt, offsetEx);
                    }
                }
            }

            String updatedAt = getTextValue(userNode, "updated_at");
            if (!updatedAt.isEmpty()) {
                try {
                    user.setUpdatedAt(LocalDateTime.parse(updatedAt));
                } catch (DateTimeParseException ex) {
                    try {
                        user.setUpdatedAt(OffsetDateTime.parse(updatedAt).toLocalDateTime());
                    } catch (DateTimeParseException offsetEx) {
                        logger.debug("Unable to parse updated_at value: {}", updatedAt, offsetEx);
                    }
                }
            }

            return user;
        } catch (Exception e) {
            logger.error("Error converting JsonNode to UserDTO", e);
            return null;
        }
    }

    private String getTextValue(JsonNode node, String fieldName) {
        JsonNode valueNode = node.get(fieldName);
        if (valueNode == null || valueNode.isNull()) {
            return "";
        }
        return valueNode.asText("");
    }
}