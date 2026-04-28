package com.antigravity.workflow_tramites.repositories;

import com.antigravity.workflow_tramites.models.TareaInstancia;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface TareaInstanciaRepository extends MongoRepository<TareaInstancia, String> {
    List<TareaInstancia> findByEmpresaId(String empresaId);
    List<TareaInstancia> findBySectorId(String sectorId);
    List<TareaInstancia> findByAsignadoA(String asignadoA);
    List<TareaInstancia> findByTramiteId(String tramiteId);
}
