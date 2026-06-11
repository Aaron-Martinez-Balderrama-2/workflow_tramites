package com.antigravity.workflow_tramites.controllers;

import com.antigravity.workflow_tramites.models.Empresa;
import com.antigravity.workflow_tramites.models.Usuario;
import com.antigravity.workflow_tramites.repositories.EmpresaRepository;
import com.antigravity.workflow_tramites.repositories.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(originPatterns = "*")
public class AuthController {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private EmpresaRepository empresaRepository;

    @PostMapping("/register-admin")
    public ResponseEntity<?> registerAdmin(@RequestBody Usuario usuario) {
        if (usuarioRepository.findByEmail(usuario.getEmail()) != null) {
            return ResponseEntity.badRequest().body("{\"mensaje\": \"El email ya está en uso.\"}");
        }
        usuario.setRol("ADMINISTRADOR");
        Usuario savedUser = usuarioRepository.save(usuario);
        
        Map<String, Object> response = new HashMap<>();
        response.put("usuarioId", savedUser.getId());
        response.put("mensaje", "Administrador registrado. Por favor, registre la empresa.");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/register-empresa/{usuarioId}")
    public ResponseEntity<?> registerEmpresa(@PathVariable String usuarioId, @RequestBody Empresa empresaRequest) {
        Optional<Usuario> userOpt = usuarioRepository.findById(usuarioId);
        if (!userOpt.isPresent()) {
            return ResponseEntity.badRequest().body("{\"mensaje\": \"Usuario no encontrado.\"}");
        }
        
        Usuario usuario = userOpt.get();
        
        // Crear la empresa
        Empresa nuevaEmpresa = new Empresa();
        nuevaEmpresa.setNombre(empresaRequest.getNombre());
        nuevaEmpresa.setSistemaGenerado(false);
        Empresa savedEmpresa = empresaRepository.save(nuevaEmpresa);
        
        // Vincular usuario a la empresa
        usuario.setEmpresaId(savedEmpresa.getId());
        usuarioRepository.save(usuario);
        
        Map<String, Object> response = new HashMap<>();
        response.put("mensaje", "Empresa registrada exitosamente.");
        response.put("usuario", usuario);
        response.put("empresa", savedEmpresa);
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String email = credentials.get("email");
        String password = credentials.get("password");
        
        Usuario usuario = usuarioRepository.findByEmail(email);
        if (usuario != null && password.equals(usuario.getPassword())) {
            // Devolvemos un mapa que incluya los datos del usuario y el flag de la empresa
            Map<String, Object> resp = new HashMap<>();
            resp.put("id", usuario.getId());
            resp.put("nombre", usuario.getNombre());
            resp.put("email", usuario.getEmail());
            resp.put("rol", usuario.getRol());
            resp.put("empresaId", usuario.getEmpresaId());
            resp.put("areaTrabajo", usuario.getAreaTrabajo());
            
            boolean sistemaGenerado = false;
            if (usuario.getEmpresaId() != null) {
                sistemaGenerado = empresaRepository.findById(usuario.getEmpresaId())
                    .map(Empresa::isSistemaGenerado)
                    .orElse(false);
            }
            resp.put("sistemaGenerado", sistemaGenerado);
            
            return ResponseEntity.ok(resp);
        }
        
        return ResponseEntity.status(401).body("{\"mensaje\": \"Credenciales inválidas.\"}");
    }
    @GetMapping("/empresa/{id}")
    public ResponseEntity<?> getEmpresa(@PathVariable String id) {
        return empresaRepository.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
}
