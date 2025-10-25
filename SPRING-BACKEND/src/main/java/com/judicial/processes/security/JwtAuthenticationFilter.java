package com.judicial.processes.security;

import java.io.IOException;
import java.util.ArrayList;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.fasterxml.jackson.databind.JsonNode;
import com.judicial.processes.service.SupabaseService;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    
    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);
    
    @Autowired
    private SupabaseService supabaseService;
    
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

            if (SecurityContextHolder.getContext().getAuthentication() == null) {
                try {
                    JsonNode userNode = supabaseService.getUser(token);
                    if (userNode != null && userNode.has("id")) {
                        userId = userNode.get("id").asText();
                        logger.debug("JWT Filter - Supabase user validated: {}", userId);

                        UsernamePasswordAuthenticationToken authToken = 
                            new UsernamePasswordAuthenticationToken(userId, null, new ArrayList<>());
                        authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(authToken);
                        logger.info("JWT Filter - Authentication set for Supabase user: {}", userId);
                    } else {
                        logger.warn("JWT Filter - Supabase validation failed or missing id");
                    }
                } catch (Exception e) {
                    logger.error("JWT Filter - Error validating Supabase token: {}", e.getMessage());
                }
            } else {
                logger.debug("JWT Filter - Authentication already exists");
            }
        }
        
        filterChain.doFilter(request, response);
    }
}