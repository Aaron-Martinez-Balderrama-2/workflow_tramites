package com.antigravity.workflow_tramites.services;

import com.antigravity.workflow_tramites.models.Documento;
import com.antigravity.workflow_tramites.models.DocumentoVersion;
import com.antigravity.workflow_tramites.models.TareaInstancia;
import com.antigravity.workflow_tramites.models.Usuario;
import com.antigravity.workflow_tramites.repositories.DocumentoRepository;
import com.antigravity.workflow_tramites.repositories.DocumentoVersionRepository;
import com.antigravity.workflow_tramites.repositories.TareaInstanciaRepository;
import com.antigravity.workflow_tramites.repositories.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class DocumentoService {

    @Autowired
    private DocumentoRepository documentoRepository;

    @Autowired
    private DocumentoVersionRepository versionRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private TareaInstanciaRepository tareaInstanciaRepository;

    public void verificarPrivilegios(String tramiteId, String usuarioId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        if ("ADMINISTRADOR".equalsIgnoreCase(usuario.getRol())) {
            return; // Administradores tienen acceso total
        }

        // Si es funcionario, debe tener asignada alguna tarea activa (no completada) del trámite
        List<TareaInstancia> tareas = tareaInstanciaRepository.findByTramiteId(tramiteId);
        boolean tieneTareaAsignada = tareas.stream()
                .anyMatch(t -> usuarioId.equals(t.getAsignadoA()) && !"COMPLETADA".equalsIgnoreCase(t.getEstado()));

        if (!tieneTareaAsignada) {
            throw new SecurityException("No tienes privilegios de edición en este trámite (debes tener una tarea activa asignada).");
        }
    }

    public String guardarDocumento(String tramiteId, String contenidoHtml, String autorId, String autorNombre) {
        // Verificar privilegios
        verificarPrivilegios(tramiteId, autorId);

        // 1. Obtener o crear el documento activo
        Optional<Documento> docOpt = documentoRepository.findByTramiteId(tramiteId);
        Documento doc;
        if (docOpt.isPresent()) {
            doc = docOpt.get();
        } else {
            doc = new Documento();
            doc.setTramiteId(tramiteId);
        }
        doc.setContenidoHtml(contenidoHtml);
        doc.setUltimoEditor(autorNombre);
        doc.setUltimaModificacion(LocalDateTime.now());
        documentoRepository.save(doc);

        // 2. Crear una nueva versión inmutable
        List<DocumentoVersion> versionesExistentes = versionRepository.findByTramiteIdOrderByVersionAsc(tramiteId);
        int nuevaVersionNum = versionesExistentes.size() + 1;

        DocumentoVersion version = new DocumentoVersion();
        version.setTramiteId(tramiteId);
        version.setVersion(nuevaVersionNum);
        version.setContenidoHtml(contenidoHtml);
        version.setAutor(autorNombre);
        version.setFechaGuardado(LocalDateTime.now());
        versionRepository.save(version);

        return "Versión " + nuevaVersionNum + " guardada localmente.";
    }

    public List<String> listarVersionesKeys(String tramiteId) {
        // En base de datos devolvemos una lista de identificadores para que el frontend pueda consultarlos
        List<DocumentoVersion> versiones = versionRepository.findByTramiteIdOrderByVersionAsc(tramiteId);
        return versiones.stream()
                .map(v -> v.getId() + "|" + v.getVersion() + "|" + v.getAutor() + "|" + v.getFechaGuardado())
                .collect(Collectors.toList());
    }

    public String obtenerContenidoVersion(String versionId) {
        DocumentoVersion version = versionRepository.findById(versionId)
                .orElseThrow(() -> new IllegalArgumentException("Versión de documento no encontrada"));
        return version.getContenidoHtml();
    }

    public String obtenerContenidoActual(String tramiteId) {
        return documentoRepository.findByTramiteId(tramiteId)
                .map(Documento::getContenidoHtml)
                .orElse("");
    }

    public String hacerRollback(String tramiteId, String versionId, String autorId, String autorNombre) {
        // Verificar privilegios
        verificarPrivilegios(tramiteId, autorId);

        // Obtener el HTML de la versión seleccionada
        DocumentoVersion versionDestino = versionRepository.findById(versionId)
                .orElseThrow(() -> new IllegalArgumentException("Versión destino no existe"));

        String htmlRollback = versionDestino.getContenidoHtml();

        // Guardar como el estado actual y registrar una nueva versión del rollback
        return guardarDocumento(tramiteId, htmlRollback, autorId, autorNombre + " (Rollback a V" + versionDestino.getVersion() + ")");
    }
}
