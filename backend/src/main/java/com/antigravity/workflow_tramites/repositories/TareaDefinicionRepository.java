package com.antigravity.workflow_tramites.repositories;

import com.antigravity.workflow_tramites.models.TareaDefinicion;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface TareaDefinicionRepository extends MongoRepository<TareaDefinicion, String> {
    List<TareaDefinicion> findByEmpresaId(String empresaId);
    void deleteByEmpresaId(String empresaId);
}
