package com.antigravity.workflow_tramites.repositories;

import com.antigravity.workflow_tramites.models.DocumentoVersion;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentoVersionRepository extends MongoRepository<DocumentoVersion, String> {
    List<DocumentoVersion> findByTramiteIdOrderByVersionAsc(String tramiteId);
}
