package com.codeforge.controller;

import com.codeforge.model.Repository;
import com.codeforge.service.RepositoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/repos")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class RepositoryController {

    private final RepositoryService repositoryService;

    @GetMapping
    public ResponseEntity<List<Repository>> getAllRepositories() {
        return ResponseEntity.ok(repositoryService.findAllRepositories());
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> connectRepository(@RequestBody Map<String, Object> body) {
        Repository created = repositoryService.createRepository(body);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "message", "Repository connected successfully",
                "repo", created
        ));
    }

    @PutMapping("/{id}/workflow")
    public ResponseEntity<Map<String, Object>> updateWorkflow(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        repositoryService.updateWorkflow(id, body.get("yaml"));
        return ResponseEntity.ok(Map.of(
                "message", "Workflow configuration updated",
                "yaml", body.get("yaml")
        ));
    }
}
