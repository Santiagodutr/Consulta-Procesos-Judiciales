package com.judicial.processes;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class JudicialProcessesApplication {
    public static void main(String[] args) {
        SpringApplication.run(JudicialProcessesApplication.class, args);
    }
}