package com.example.personalfinance;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/** Entry point of the monolithic Personal Finance + Investment Accounting API. */
@SpringBootApplication
public class PersonalFinanceApplication {
    public static void main(String[] args) {
        SpringApplication.run(PersonalFinanceApplication.class, args);
    }
}
