package com.antigravity.workflow_tramites.repositories;

import com.antigravity.workflow_tramites.models.AreaTrabajo;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AreaTrabajoRepository extends MongoRepository<AreaTrabajo, String> {
}
