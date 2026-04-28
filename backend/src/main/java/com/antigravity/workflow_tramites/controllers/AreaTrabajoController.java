package com.antigravity.workflow_tramites.controllers;

import com.antigravity.workflow_tramites.models.AreaTrabajo;
import com.antigravity.workflow_tramites.repositories.AreaTrabajoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/areas")
public class AreaTrabajoController {

    @Autowired
    private AreaTrabajoRepository repository;

    @GetMapping
    public List<AreaTrabajo> getAll() {
        return repository.findAll();
    }

    @PostMapping
    public AreaTrabajo create(@RequestBody AreaTrabajo area) {
        return repository.save(area);
    }
    
    @PutMapping("/{id}")
    public AreaTrabajo update(@PathVariable String id, @RequestBody AreaTrabajo area) {
        area.setId(id);
        return repository.save(area);
    }
    
    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id) {
        repository.deleteById(id);
    }
}
