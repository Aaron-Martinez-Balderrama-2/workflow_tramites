package com.antigravity.workflow_tramites.repositories;

import com.antigravity.workflow_tramites.models.PoliticaNegocio;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PoliticaNegocioRepository extends MongoRepository<PoliticaNegocio, String> {
}
