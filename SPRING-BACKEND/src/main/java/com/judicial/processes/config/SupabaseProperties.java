package com.judicial.processes.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "supabase")
public class SupabaseProperties {
    private String url;
    private String serviceRoleKey;
    private String anonKey;
    private String authUrl;
    private String restUrl;

    // Getters and setters
    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
        // Auto-generate auth and rest URLs if not explicitly set
        if (this.authUrl == null) {
            this.authUrl = url + "/auth/v1";
        }
        if (this.restUrl == null) {
            this.restUrl = url + "/rest/v1";
        }
    }

    public String getServiceRoleKey() {
        return serviceRoleKey;
    }

    public void setServiceRoleKey(String serviceRoleKey) {
        this.serviceRoleKey = serviceRoleKey;
    }

    public String getAnonKey() {
        return anonKey;
    }

    public void setAnonKey(String anonKey) {
        this.anonKey = anonKey;
    }

    public String getAuthUrl() {
        return authUrl;
    }

    public void setAuthUrl(String authUrl) {
        this.authUrl = authUrl;
    }

    public String getRestUrl() {
        return restUrl;
    }

    public void setRestUrl(String restUrl) {
        this.restUrl = restUrl;
    }
}