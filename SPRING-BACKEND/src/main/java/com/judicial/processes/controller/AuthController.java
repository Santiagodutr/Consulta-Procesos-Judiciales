package com.judicial.processes.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.judicial.processes.dto.ApiResponse;
import com.judicial.processes.dto.AuthDTO.*;
import com.judicial.processes.dto.AuthDTO.AuthResponse;
import com.judicial.processes.dto.AuthDTO.ChangePasswordRequest;
import com.judicial.processes.dto.AuthDTO.ForgotPasswordRequest;
import com.judicial.processes.dto.AuthDTO.LoginRequest;
import com.judicial.processes.dto.AuthDTO.RefreshTokenRequest;
import com.judicial.processes.dto.AuthDTO.RegisterRequest;
import com.judicial.processes.dto.AuthDTO.ResetPasswordRequest;
import com.judicial.processes.dto.AuthDTO.UserDTO;
import com.judicial.processes.service.AuthService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001", "http://localhost:19006"})
public class AuthController {
    
    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);
    
    @Autowired
    private AuthService authService;
    
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletRequest httpRequest) {
        try {
            logger.info("Registration attempt for email: {}", request.getEmail());
            
            AuthResponse authResponse = authService.register(request);
            
            logger.info("User registered successfully: {}", request.getEmail());
            
            return ResponseEntity.status(201).body(
                new ApiResponse<>(true, authResponse, 
                "Registration successful. Please check your email for verification.")
            );
            
        } catch (RuntimeException e) {
            logger.error("Registration failed for email: " + request.getEmail(), e);
            return ResponseEntity.badRequest().body(
                new ApiResponse<>(false, e.getMessage())
            );
        } catch (Exception e) {
            logger.error("Unexpected registration error for email: " + request.getEmail(), e);
            return ResponseEntity.internalServerError().body(
                new ApiResponse<>(false, "Registration failed")
            );
        }
    }
    
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {
        try {
            logger.info("Login attempt for email: {}", request.getEmail());
            
            AuthResponse authResponse = authService.login(request.getEmail(), request.getPassword());
            
            if (authResponse != null) {
                logger.info("User logged in successfully: {}", request.getEmail());
                return ResponseEntity.ok(
                    new ApiResponse<>(true, authResponse, "Login successful")
                );
            } else {
                return ResponseEntity.status(401).body(
                    new ApiResponse<>(false, "Invalid email or password")
                );
            }
            
        } catch (RuntimeException e) {
            logger.error("Login failed for email: " + request.getEmail(), e);
            return ResponseEntity.status(401).body(
                new ApiResponse<>(false, e.getMessage())
            );
        } catch (Exception e) {
            logger.error("Unexpected login error for email: " + request.getEmail(), e);
            return ResponseEntity.internalServerError().body(
                new ApiResponse<>(false, "Login failed")
            );
        }
    }
    
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(HttpServletRequest request) {
        try {
            String authHeader = request.getHeader("Authorization");
            String token = null;
            
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                token = authHeader.substring(7);
            }
            
            if (token != null) {
                authService.logout(token);
            }
            
            logger.info("User logged out successfully");
            
            return ResponseEntity.ok(
                new ApiResponse<>(true, "Logout successful")
            );
            
        } catch (Exception e) {
            logger.error("Logout error", e);
            return ResponseEntity.internalServerError().body(
                new ApiResponse<>(false, "Logout failed")
            );
        }
    }
    
    @PostMapping("/refresh-token")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(
            @Valid @RequestBody RefreshTokenRequest request) {
        try {
            AuthResponse authResponse = authService.refreshToken(request.getRefreshToken());
            
            if (authResponse != null) {
                return ResponseEntity.ok(
                    new ApiResponse<>(true, authResponse, "Token refreshed successfully")
                );
            } else {
                return ResponseEntity.status(401).body(
                    new ApiResponse<>(false, "Invalid refresh token")
                );
            }
            
        } catch (Exception e) {
            logger.error("Token refresh error", e);
            return ResponseEntity.status(401).body(
                new ApiResponse<>(false, "Invalid refresh token")
            );
        }
    }
    
    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<UserDTO>> getProfile(HttpServletRequest request) {
        try {
            String authHeader = request.getHeader("Authorization");
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body(
                    new ApiResponse<>(false, "Access token is required")
                );
            }
            
            String token = authHeader.substring(7);
            UserDTO user = authService.getProfile(token);
            
            if (user != null) {
                return ResponseEntity.ok(
                    new ApiResponse<>(true, user, null)
                );
            } else {
                return ResponseEntity.status(401).body(
                    new ApiResponse<>(false, "Invalid token")
                );
            }
            
        } catch (Exception e) {
            logger.error("Get profile error", e);
            return ResponseEntity.status(401).body(
                new ApiResponse<>(false, "Authentication failed")
            );
        }
    }
    
    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<UserDTO>> updateProfile(
            @RequestBody UserDTO updateData,
            HttpServletRequest request) {
        try {
            String authHeader = request.getHeader("Authorization");
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body(
                    new ApiResponse<>(false, "Access token is required")
                );
            }
            
            String token = authHeader.substring(7);
            UserDTO updatedUser = authService.updateProfile(token, updateData);
            
            if (updatedUser != null) {
                logger.info("Profile updated successfully");
                return ResponseEntity.ok(
                    new ApiResponse<>(true, updatedUser, "Profile updated successfully")
                );
            } else {
                return ResponseEntity.status(401).body(
                    new ApiResponse<>(false, "Invalid token")
                );
            }
            
        } catch (Exception e) {
            logger.error("Profile update error", e);
            return ResponseEntity.internalServerError().body(
                new ApiResponse<>(false, "Profile update failed")
            );
        }
    }
    
    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            HttpServletRequest httpRequest) {
        try {
            String authHeader = httpRequest.getHeader("Authorization");
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body(
                    new ApiResponse<>(false, "Access token is required")
                );
            }
            
            String token = authHeader.substring(7);
            boolean success = authService.changePassword(token, request.getCurrentPassword(), request.getNewPassword());
            
            if (success) {
                logger.info("Password changed successfully");
                return ResponseEntity.ok(
                    new ApiResponse<>(true, "Password changed successfully")
                );
            } else {
                return ResponseEntity.status(400).body(
                    new ApiResponse<>(false, "Current password is incorrect")
                );
            }
            
        } catch (Exception e) {
            logger.error("Change password error", e);
            return ResponseEntity.internalServerError().body(
                new ApiResponse<>(false, "Password change failed")
            );
        }
    }
    
    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request) {
        try {
            boolean success = authService.forgotPassword(request.getEmail());
            
            if (success) {
                logger.info("Password reset email sent to: {}", request.getEmail());
                return ResponseEntity.ok(
                    new ApiResponse<>(true, "Password reset email sent successfully")
                );
            } else {
                return ResponseEntity.status(404).body(
                    new ApiResponse<>(false, "No user found with this email")
                );
            }
            
        } catch (Exception e) {
            logger.error("Forgot password error for email: " + request.getEmail(), e);
            return ResponseEntity.internalServerError().body(
                new ApiResponse<>(false, "Failed to send reset email")
            );
        }
    }
    
    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {
        try {
            boolean success = authService.resetPassword(request.getToken(), request.getNewPassword());
            
            if (success) {
                logger.info("Password reset successful");
                return ResponseEntity.ok(
                    new ApiResponse<>(true, "Password reset successful")
                );
            } else {
                return ResponseEntity.status(400).body(
                    new ApiResponse<>(false, "Invalid or expired reset token")
                );
            }
            
        } catch (Exception e) {
            logger.error("Password reset error", e);
            return ResponseEntity.internalServerError().body(
                new ApiResponse<>(false, "Failed to reset password")
            );
        }
    }
    
    @GetMapping("/verify-email/{token}")
    public ResponseEntity<ApiResponse<Void>> verifyEmail(@PathVariable String token) {
        try {
            boolean success = authService.verifyEmail(token);
            
            if (success) {
                logger.info("Email verification successful for token: {}", token);
                return ResponseEntity.ok(
                    new ApiResponse<>(true, "Email verified successfully")
                );
            } else {
                return ResponseEntity.status(400).body(
                    new ApiResponse<>(false, "Invalid or expired verification token")
                );
            }
            
        } catch (Exception e) {
            logger.error("Email verification error for token: " + token, e);
            return ResponseEntity.internalServerError().body(
                new ApiResponse<>(false, "Email verification failed")
            );
        }
    }
}