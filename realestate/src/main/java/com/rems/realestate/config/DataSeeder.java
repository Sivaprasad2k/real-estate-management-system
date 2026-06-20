package com.rems.realestate.config;

import com.rems.realestate.model.User;
import com.rems.realestate.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.Set;

@Component
public class DataSeeder implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        String adminEmail = System.getenv("ADMIN_EMAIL");
        String adminPassword = System.getenv("ADMIN_PASSWORD");

        if (adminEmail == null || adminEmail.trim().isEmpty()) {
            adminEmail = "admin99@test.com";
        }
        if (adminPassword == null || adminPassword.trim().isEmpty()) {
            adminPassword = "password";
        }

        if (userRepository.findByEmail(adminEmail).isEmpty()) {
            Set<String> roles = new HashSet<>();
            roles.add("ROLE_USER");
            roles.add("ROLE_ADMIN");

            User admin = User.builder()
                    .name("Super Admin")
                    .email(adminEmail)
                    .password(passwordEncoder.encode(adminPassword))
                    .roles(roles)
                    .isVerified(true)
                    .build();

            userRepository.save(admin);
            System.out.println("Seeded Admin user: " + adminEmail);
        }
    }
}
