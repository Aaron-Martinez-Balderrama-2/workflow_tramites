package com.antigravity.workflow_tramites.services;

import com.antigravity.workflow_tramites.models.Tramite;
import com.antigravity.workflow_tramites.models.Usuario;
import com.antigravity.workflow_tramites.repositories.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class PrivilegiosService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    /**
     * Evalúa si un usuario tiene permisos para ver o modificar un trámite.
     * En un sistema BPMN real, esto se valida cruzando el rol del usuario
     * con los carriles (Lanes) por donde ha pasado el trámite, o con la empresa.
     */
    public boolean tieneAccesoAlTramite(String usuarioId, Tramite tramite) {
        if (tramite == null || usuarioId == null) return false;
        
        Usuario user = usuarioRepository.findById(usuarioId).orElse(null);
        if (user == null) return false;

        // Por defecto: Un usuario de una empresa solo puede ver trámites de su empresa
        if (!user.getEmpresaId().equals(tramite.getEmpresaId())) {
            return false;
        }

        // Si es administrador, tiene acceso a todo dentro de la empresa
        if ("ADMINISTRADOR".equalsIgnoreCase(user.getRol())) {
            return true;
        }

        // Aquí se puede agregar lógica más compleja:
        // Ej: Verificar si el trámite está asignado al sector del usuario
        return true; 
    }

    /**
     * Evalúa si un campo específico del formulario dinámico debe ser de solo lectura
     * para el usuario actual.
     */
    public boolean puedeModificarCampo(String usuarioId, String campoId, String laneAsociado) {
        Usuario user = usuarioRepository.findById(usuarioId).orElse(null);
        if (user == null) return false;

        if ("ADMINISTRADOR".equalsIgnoreCase(user.getRol())) return true;
        
        // Si el campo está asociado a un Lane/Rol específico, verificar si el usuario tiene ese rol
        if (laneAsociado != null && !laneAsociado.isEmpty()) {
            return user.getRol().equalsIgnoreCase(laneAsociado) || user.getAreaTrabajo().equalsIgnoreCase(laneAsociado);
        }

        return true; // Por defecto
    }
}
