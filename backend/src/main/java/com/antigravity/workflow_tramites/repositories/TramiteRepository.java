package com.antigravity.workflow_tramites.repositories;

import com.antigravity.workflow_tramites.models.Tramite;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface TramiteRepository extends MongoRepository<Tramite, String> {
    List<Tramite> findByEmpresaId(String empresaId);
}
