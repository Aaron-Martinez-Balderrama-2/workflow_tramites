package com.antigravity.workflow_tramites.repositories;

import com.antigravity.workflow_tramites.models.Sector;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface SectorRepository extends MongoRepository<Sector, String> {
    List<Sector> findByEmpresaId(String empresaId);
    void deleteByEmpresaId(String empresaId);
}
