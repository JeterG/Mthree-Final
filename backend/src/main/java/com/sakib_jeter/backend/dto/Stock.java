package com.sakib_jeter.backend.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class Stock {
    private LocalDateTime date;
    private double open;
    private double high;
    private double low;
    private double close;
}