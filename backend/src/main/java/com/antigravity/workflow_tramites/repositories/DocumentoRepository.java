package com.antigravity.workflow_tramites.repositories;

import com.antigravity.workflow_tramites.models.Documento;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DocumentoRepository extends MongoRepository<Documento, String> {
    Optional<Documento> findByTramiteId(String tramiteId);
}
