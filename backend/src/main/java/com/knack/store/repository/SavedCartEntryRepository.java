package com.knack.store.repository;

import com.knack.store.model.SavedCartEntry;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SavedCartEntryRepository extends JpaRepository<SavedCartEntry, Long> {
}
