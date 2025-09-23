package com.judicial.processes.dto;

import java.time.LocalDateTime;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AuthDTO {

    public static class LoginRequest {
        @NotBlank(message = "Email is required")
        @Email(message = "Valid email is required")
        private String email;
        
        @NotBlank(message = "Password is required")
        private String password;

        // Getters and setters
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    public static class RegisterRequest {
        @NotBlank(message = "Email is required")
        @Email(message = "Valid email is required")
        private String email;
        
        @NotBlank(message = "Password is required")
        @Size(min = 8, message = "Password must be at least 8 characters")
        private String password;
        
        @NotBlank(message = "First name is required")
        @Size(min = 2, message = "First name must be at least 2 characters")
        @JsonProperty("first_name")
        private String firstName;
        
        @NotBlank(message = "Last name is required")
        @Size(min = 2, message = "Last name must be at least 2 characters")
        @JsonProperty("last_name")
        private String lastName;
        
        @NotBlank(message = "Document number is required")
        @Size(min = 5, message = "Document number is required")
        @JsonProperty("document_number")
        private String documentNumber;
        
        @NotBlank(message = "Document type is required")
        @JsonProperty("document_type")
        private String documentType; // CC, CE, NIT, passport
        
        @NotBlank(message = "User type is required")
        @JsonProperty("user_type")
        private String userType; // natural, juridical, company
        
        @JsonProperty("phone_number")
        private String phoneNumber;
        
        @JsonProperty("company_id")
        private String companyId;

        // Getters and setters
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
        public String getFirstName() { return firstName; }
        public void setFirstName(String firstName) { this.firstName = firstName; }
        public String getLastName() { return lastName; }
        public void setLastName(String lastName) { this.lastName = lastName; }
        public String getDocumentNumber() { return documentNumber; }
        public void setDocumentNumber(String documentNumber) { this.documentNumber = documentNumber; }
        public String getDocumentType() { return documentType; }
        public void setDocumentType(String documentType) { this.documentType = documentType; }
        public String getUserType() { return userType; }
        public void setUserType(String userType) { this.userType = userType; }
        public String getPhoneNumber() { return phoneNumber; }
        public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
        public String getCompanyId() { return companyId; }
        public void setCompanyId(String companyId) { this.companyId = companyId; }
    }

    public static class AuthResponse {
        private UserDTO user;
        
        @JsonProperty("access_token")
        private String accessToken;
        
        @JsonProperty("refresh_token")
        private String refreshToken;
        
        @JsonProperty("expires_in")
        private long expiresIn;

        public AuthResponse() {}
        
        public AuthResponse(UserDTO user, String accessToken, String refreshToken, long expiresIn) {
            this.user = user;
            this.accessToken = accessToken;
            this.refreshToken = refreshToken;
            this.expiresIn = expiresIn;
        }

        // Getters and setters
        public UserDTO getUser() { return user; }
        public void setUser(UserDTO user) { this.user = user; }
        public String getAccessToken() { return accessToken; }
        public void setAccessToken(String accessToken) { this.accessToken = accessToken; }
        public String getRefreshToken() { return refreshToken; }
        public void setRefreshToken(String refreshToken) { this.refreshToken = refreshToken; }
        public long getExpiresIn() { return expiresIn; }
        public void setExpiresIn(long expiresIn) { this.expiresIn = expiresIn; }
    }

    public static class UserDTO {
        private String id;
        private String email;
        
        @JsonProperty("first_name")
        private String firstName;
        
        @JsonProperty("last_name")
        private String lastName;
        
        @JsonProperty("document_number")
        private String documentNumber;
        
        @JsonProperty("document_type")
        private String documentType;
        
        @JsonProperty("user_type")
        private String userType;
        
        @JsonProperty("phone_number")
        private String phoneNumber;
        
        @JsonProperty("company_id")
        private String companyId;
        
        @JsonProperty("is_active")
        private boolean isActive;
        
        @JsonProperty("email_verified")
        private boolean emailVerified;
        
        @JsonProperty("notification_preferences")
        private Map<String, Object> notificationPreferences;
        
        @JsonProperty("created_at")
        private LocalDateTime createdAt;
        
        @JsonProperty("updated_at")
        private LocalDateTime updatedAt;

        // Getters and setters
        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getFirstName() { return firstName; }
        public void setFirstName(String firstName) { this.firstName = firstName; }
        public String getLastName() { return lastName; }
        public void setLastName(String lastName) { this.lastName = lastName; }
        public String getDocumentNumber() { return documentNumber; }
        public void setDocumentNumber(String documentNumber) { this.documentNumber = documentNumber; }
        public String getDocumentType() { return documentType; }
        public void setDocumentType(String documentType) { this.documentType = documentType; }
        public String getUserType() { return userType; }
        public void setUserType(String userType) { this.userType = userType; }
        public String getPhoneNumber() { return phoneNumber; }
        public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
        public String getCompanyId() { return companyId; }
        public void setCompanyId(String companyId) { this.companyId = companyId; }
        public boolean isActive() { return isActive; }
        public void setActive(boolean active) { isActive = active; }
        public boolean isEmailVerified() { return emailVerified; }
        public void setEmailVerified(boolean emailVerified) { this.emailVerified = emailVerified; }
        public Map<String, Object> getNotificationPreferences() { return notificationPreferences; }
        public void setNotificationPreferences(Map<String, Object> notificationPreferences) { this.notificationPreferences = notificationPreferences; }
        public LocalDateTime getCreatedAt() { return createdAt; }
        public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
        public LocalDateTime getUpdatedAt() { return updatedAt; }
        public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    }

    public static class ChangePasswordRequest {
        @NotBlank(message = "Current password is required")
        @JsonProperty("current_password")
        private String currentPassword;
        
        @NotBlank(message = "New password is required")
        @Size(min = 8, message = "New password must be at least 8 characters")
        @JsonProperty("new_password")
        private String newPassword;

        // Getters and setters
        public String getCurrentPassword() { return currentPassword; }
        public void setCurrentPassword(String currentPassword) { this.currentPassword = currentPassword; }
        public String getNewPassword() { return newPassword; }
        public void setNewPassword(String newPassword) { this.newPassword = newPassword; }
    }

    public static class ForgotPasswordRequest {
        @NotBlank(message = "Email is required")
        @Email(message = "Valid email is required")
        private String email;

        // Getters and setters
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
    }

    public static class ResetPasswordRequest {
        @NotBlank(message = "Token is required")
        private String token;
        
        @NotBlank(message = "New password is required")
        @Size(min = 8, message = "New password must be at least 8 characters")
        @JsonProperty("new_password")
        private String newPassword;

        // Getters and setters
        public String getToken() { return token; }
        public void setToken(String token) { this.token = token; }
        public String getNewPassword() { return newPassword; }
        public void setNewPassword(String newPassword) { this.newPassword = newPassword; }
    }

    public static class RefreshTokenRequest {
        @NotBlank(message = "Refresh token is required")
        @JsonProperty("refresh_token")
        private String refreshToken;

        // Getters and setters
        public String getRefreshToken() { return refreshToken; }
        public void setRefreshToken(String refreshToken) { this.refreshToken = refreshToken; }
    }
}