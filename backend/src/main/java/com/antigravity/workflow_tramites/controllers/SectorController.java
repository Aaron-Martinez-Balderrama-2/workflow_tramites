package com.antigravity.workflow_tramites.controllers;

import com.antigravity.workflow_tramites.models.Sector;
import com.antigravity.workflow_tramites.repositories.SectorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/sectores")
@CrossOrigin(originPatterns = "*")
public class SectorController {
    @Autowired
    private SectorRepository repository;

    @GetMapping("/empresa/{empresaId}")
    public List<Sector> obtenerPorEmpresa(@PathVariable String empresaId) {
        return repository.findByEmpresaId(empresaId);
    }
}
