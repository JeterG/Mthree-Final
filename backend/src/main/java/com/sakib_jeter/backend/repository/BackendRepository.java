package com.sakib_jeter.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.sakib_jeter.backend.entity.Backend;

public interface BackendRepository extends JpaRepository<Backend, Long> {

}