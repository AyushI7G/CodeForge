package com.codeforge.controller;

import com.codeforge.model.PipelineRun;
import com.codeforge.service.PipelineService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/runs")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PipelineRunController {

    private final PipelineService pipelineService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllRuns() {
        List<PipelineRun> runs = pipelineService.findAllRuns();
        return ResponseEntity.ok(Map.of(
                "total", runs.size(),
                "runs", runs
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PipelineRun> getRunById(@PathVariable String id) {
        return pipelineService.findRunById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> dispatchRun(@RequestBody Map<String, Object> payload) {
        PipelineRun createdRun = pipelineService.dispatchManualRun(payload);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "message", "Pipeline #" + createdRun.getRunNumber() + " dispatched successfully",
                "run", createdRun
        ));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateRun(@PathVariable String id, @RequestBody Map<String, Object> updates) {
        PipelineRun updated = pipelineService.updateRun(id, updates);
        return ResponseEntity.ok(Map.of(
                "message", "Run updated",
                "run", updated
        ));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<Map<String, Object>> cancelRun(@PathVariable String id) {
        PipelineRun cancelled = pipelineService.cancelRun(id);
        return ResponseEntity.ok(Map.of(
                "message", "Run #" + cancelled.getRunNumber() + " cancelled",
                "run", cancelled
        ));
    }
}
