package com.judicial.processes.security;

import java.io.IOException;
import java.util.ArrayList;

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
    
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, 
                                  FilterChain filterChain) throws ServletException, IOException {
        
        // Configurar CORS headers para producción
        String allowedOrigins = System.getenv().getOrDefault("CORS_ORIGINS", "*");
        response.setHeader("Access-Control-Allow-Origin", allowedOrigins);
        response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type, X-Requested-With");
        response.setHeader("Access-Control-Allow-Credentials", "true");
        response.setHeader("Access-Control-Max-Age", "3600");
        
        // Manejar preflight requests (OPTIONS)
        if ("OPTIONS".equals(request.getMethod())) {
            response.setStatus(HttpServletResponse.SC_OK);
            return;
        }
        
        String authHeader = request.getHeader("Authorization");
        String token = null;
        String userId = null;
        
        // Check if Authorization header exists and starts with "Bearer "
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7); // Remove "Bearer " prefix
            
            // For now, we'll use a simple token validation
            // In the original backend, tokens are temporary and simple
            if (token != null && token.startsWith("temp_token_")) {
                // Extract user ID from token (this is a simplified approach)
                // In the original backend, the token structure is: temp_token_{userId}-{timestamp}-{random}
                try {
                    String[] tokenParts = token.split("-");
                    if (tokenParts.length >= 2) {
                        userId = tokenParts[0].replace("temp_token_", "");
                        
                        // Create authentication object
                        if (SecurityContextHolder.getContext().getAuthentication() == null) {
                            UsernamePasswordAuthenticationToken authToken = 
                                new UsernamePasswordAuthenticationToken(userId, null, new ArrayList<>());
                            
                            authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                            SecurityContextHolder.getContext().setAuthentication(authToken);
                        }
                    }
                } catch (Exception e) {
                    logger.debug("Invalid token format: " + token);
                }
            }
        }
        
        filterChain.doFilter(request, response);
    }
}