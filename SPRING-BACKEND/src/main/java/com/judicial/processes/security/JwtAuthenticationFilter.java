package com.judicial.processes.security;

import java.io.IOException;
import java.util.ArrayList;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    
    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);
    
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, 
                                  FilterChain filterChain) throws ServletException, IOException {
        
        String authHeader = request.getHeader("Authorization");
        String token = null;
        String userId = null;
        
        logger.debug("JWT Filter - Request URI: {}", request.getRequestURI());
        logger.debug("JWT Filter - Authorization header: {}", authHeader != null ? "Present" : "Missing");
        
        // Check if Authorization header exists and starts with "Bearer "
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7); // Remove "Bearer " prefix
            logger.debug("JWT Filter - Token extracted: {}", token.substring(0, Math.min(50, token.length())) + "...");
            
            // For now, we'll use a simple token validation
            // In the original backend, tokens are temporary and simple
            if (token != null && token.startsWith("temp_token_")) {
                // Extract user ID from token (this is a simplified approach)
                // In the original backend, the token structure is: temp_token_{userId}-{timestamp}-{random}
                try {
                    if (token.startsWith("temp_token_")) {
                        // Remove "temp_token_" prefix
                        String withoutPrefix = token.substring(11); // "temp_token_".length() = 11
                        
                        // Find the UUID part (format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
                        // UUIDs have 36 characters with 4 hyphens at specific positions
                        if (withoutPrefix.length() >= 36) {
                            userId = withoutPrefix.substring(0, 36);
                            logger.debug("JWT Filter - Extracted userId: {}", userId);
                            
                            // Validate UUID format
                            if (userId.matches("[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}")) {
                                logger.debug("JWT Filter - UUID format valid");
                                // Create authentication object
                                if (SecurityContextHolder.getContext().getAuthentication() == null) {
                                    UsernamePasswordAuthenticationToken authToken = 
                                        new UsernamePasswordAuthenticationToken(userId, null, new ArrayList<>());
                                    
                                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                                    SecurityContextHolder.getContext().setAuthentication(authToken);
                                    logger.info("JWT Filter - Authentication set for user: {}", userId);
                                } else {
                                    logger.debug("JWT Filter - Authentication already exists");
                                }
                            } else {
                                logger.warn("JWT Filter - Invalid UUID format: {}", userId);
                            }
                        } else {
                            logger.warn("JWT Filter - Token too short after prefix removal: {}", withoutPrefix.length());
                        }
                    }
                } catch (Exception e) {
                    logger.error("JWT Filter - Error extracting userId from token: {}", e.getMessage());
                }
            } else {
                logger.debug("JWT Filter - Token doesn't start with 'temp_token_'");
            }
        }
        
        filterChain.doFilter(request, response);
    }
}