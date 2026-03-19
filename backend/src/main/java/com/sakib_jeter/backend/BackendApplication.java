package com.sakib_jeter.backend;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import com.sakib_jeter.backend.external.StockDataSeeder;
import com.sakib_jeter.backend.repository.StockCacheRepository;

@SpringBootApplication
public class BackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(BackendApplication.class, args);
	}

	@Bean
	CommandLineRunner init(StockDataSeeder seeder, StockCacheRepository repository) {
		return args -> {
			// Only seed if the database is empty
			if (repository.count() == 0) {
				System.out.println("Database is empty. Starting seeding...");
				seeder.seedAll();
				System.out.println("Seeding complete.");
			} else {
				System.out.println("Database already contains data. Skipping seeding.");
			}
		};
	}
}
