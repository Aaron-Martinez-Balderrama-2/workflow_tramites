package com.antigravity.workflow_tramites.repositories;

import com.antigravity.workflow_tramites.models.Empresa;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EmpresaRepository extends MongoRepository<Empresa, String> {
}
