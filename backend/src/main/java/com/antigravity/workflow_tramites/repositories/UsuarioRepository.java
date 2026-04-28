package com.antigravity.workflow_tramites.repositories;

import com.antigravity.workflow_tramites.models.Usuario;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UsuarioRepository extends MongoRepository<Usuario, String> {
    Usuario findByEmail(String email);
    java.util.List<Usuario> findByEmpresaId(String empresaId);
}
