package com.codeforge.controller;

import com.codeforge.model.PipelineRun;
import com.codeforge.service.WebhookService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/webhooks")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class WebhookController {

    private final WebhookService webhookService;

    @PostMapping("/github/{owner}/{repo}")
    public ResponseEntity<Map<String, Object>> handleGithubWebhook(
            @PathVariable String owner,
            @PathVariable String repo,
            @RequestHeader(value = "x-github-event", defaultValue = "push") String githubEvent,
            @RequestHeader(value = "x-hub-signature-256", required = false) String signature,
            @RequestBody Map<String, Object> payload) {

        log.info("Received GitHub Webhook [{}] for {}/{}", githubEvent, owner, repo);

        // Process webhook and verify HMAC
        PipelineRun triggeredRun = webhookService.processGithubPush(owner, repo, payload, signature);

        return ResponseEntity.status(HttpStatus.ACCEPTED).body(Map.of(
                "message", "GitHub push webhook accepted. Pipeline #" + triggeredRun.getRunNumber() + " queued in Kafka partition " + triggeredRun.getKafkaPartition() + ".",
                "run", triggeredRun
        ));
    }
}
