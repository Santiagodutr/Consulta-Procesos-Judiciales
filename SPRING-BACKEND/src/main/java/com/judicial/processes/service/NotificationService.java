package com.judicial.processes.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.judicial.processes.entity.NotificationRecord;
import com.judicial.processes.repository.NotificationRepository;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    public NotificationRecord createNotification(NotificationRecord notificationRecord) {
        return notificationRepository.save(notificationRecord);
    }

    public List<NotificationRecord> getUnreadNotifications(String userId, int limit) {
        return notificationRepository.findUnreadByUser(userId, limit);
    }

    public List<NotificationRecord> getNotifications(String userId, int limit, int offset) {
        return notificationRepository.findByUser(userId, limit, offset);
    }

    public void markAsRead(String notificationId) {
        notificationRepository.markAsRead(notificationId);
    }

    public void markAllAsRead(String userId) {
        notificationRepository.markAllAsRead(userId);
    }
}
