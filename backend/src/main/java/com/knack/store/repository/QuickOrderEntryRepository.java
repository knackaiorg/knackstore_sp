package com.knack.store.repository;

import com.knack.store.model.QuickOrderEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuickOrderEntryRepository extends JpaRepository<QuickOrderEntry, Long> {

    List<QuickOrderEntry> findBySessionId(String sessionId);

    void deleteBySessionId(String sessionId);
}
