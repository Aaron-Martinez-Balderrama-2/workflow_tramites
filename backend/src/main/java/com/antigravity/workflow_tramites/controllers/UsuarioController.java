package com.antigravity.workflow_tramites.controllers;

import com.antigravity.workflow_tramites.models.Usuario;
import com.antigravity.workflow_tramites.repositories.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/usuarios")
@CrossOrigin(origins = "http://localhost:4200")
public class UsuarioController {

    @Autowired
    private UsuarioRepository repository;

    @GetMapping("/empresa/{empresaId}")
    public List<Usuario> getByEmpresa(@PathVariable String empresaId) {
        return repository.findByEmpresaId(empresaId);
    }

    @PostMapping
    public org.springframework.http.ResponseEntity<?> create(@RequestBody Usuario usuario) {
        if (repository.findByEmail(usuario.getEmail()) != null) {
            return org.springframework.http.ResponseEntity.badRequest().body("{\"mensaje\": \"El email ya está en uso.\"}");
        }
        Usuario savedUser = repository.save(usuario);
        return org.springframework.http.ResponseEntity.ok(savedUser);
    }
    
    @PutMapping("/{id}")
    public Usuario update(@PathVariable String id, @RequestBody Usuario usuario) {
        usuario.setId(id);
        return repository.save(usuario);
    }
    
    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id) {
        repository.deleteById(id);
    }
}
