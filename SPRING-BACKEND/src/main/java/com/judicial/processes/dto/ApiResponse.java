package com.judicial.processes.dto;

import java.util.Map;

public class ApiResponse<T> {
    private boolean success;
    private T data;
    private String message;
    private String[] errors;
    private Map<String, Object> pagination;

    public ApiResponse() {}

    public ApiResponse(boolean success, T data, String message) {
        this.success = success;
        this.data = data;
        this.message = message;
    }

    public ApiResponse(boolean success, String message) {
        this.success = success;
        this.message = message;
    }

    // Getters and setters
    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public T getData() {
        return data;
    }

    public void setData(T data) {
        this.data = data;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String[] getErrors() {
        return errors;
    }

    public void setErrors(String[] errors) {
        this.errors = errors;
    }

    public Map<String, Object> getPagination() {
        return pagination;
    }

    public void setPagination(Map<String, Object> pagination) {
        this.pagination = pagination;
    }
}