package com.codeforge.service;

import com.codeforge.model.PipelineRun;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class WebhookService {

    private final PipelineService pipelineService;

    public PipelineRun processGithubPush(String owner, String repo, Map<String, Object> payload, String signature) {
        String repoFullName = owner + "/" + repo;
        log.info("Processing push webhook for repository: {}", repoFullName);

        String ref = (String) payload.getOrDefault("ref", "refs/heads/main");
        String branch = ref.replace("refs/heads/", "");
        String commitHash = (String) payload.getOrDefault("after", UUID.randomUUID().toString().substring(0, 7));

        Map<String, Object> headCommit = (Map<String, Object>) payload.get("head_commit");
        String commitMessage = headCommit != null ? (String) headCommit.getOrDefault("message", "webhook: git push to " + branch) : "webhook: git push event";

        Map<String, Object> authorObj = headCommit != null ? (Map<String, Object>) headCommit.get("author") : null;
        String author = authorObj != null ? (String) authorObj.getOrDefault("name", "Developer") : "Developer";
        String authorEmail = authorObj != null ? (String) authorObj.getOrDefault("email", "dev@codeforge.internal") : "dev@codeforge.internal";

        int nextRunNumber = pipelineService.findAllRuns().stream()
                .mapToInt(PipelineRun::getRunNumber)
                .max()
                .orElse(25) + 1;

        PipelineRun newRun = PipelineRun.builder()
                .id("run-" + nextRunNumber)
                .runNumber(nextRunNumber)
                .repoName(repoFullName)
                .branch(branch)
                .commitHash(commitHash.length() > 7 ? commitHash.substring(0, 7) : commitHash)
                .commitMessage(commitMessage)
                .author(author)
                .authorEmail(authorEmail)
                .status(PipelineRun.RunStatus.QUEUED)
                .triggerType("WEBHOOK_PUSH")
                .createdAt(Instant.now())
                .workerNode("k8s-worker-node-us-east-" + (Math.random() > 0.5 ? "1a" : "1b"))
                .containerId("docker-runner-" + (commitHash.length() > 7 ? commitHash.substring(0, 7) : commitHash))
                .postgresId("pg_run_" + nextRunNumber + "_" + UUID.randomUUID().toString().substring(0, 4))
                .kafkaPartition((int) (Math.random() * 8))
                .build();

        return pipelineService.saveRun(newRun);
    }

    public boolean verifyHmacSha256(String payload, String secret, String expectedSignatureHex) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKeySpec);
            byte[] hmacBytes = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hmacBytes) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString().equalsIgnoreCase(expectedSignatureHex.replace("sha256=", ""));
        } catch (Exception e) {
            log.error("Failed to verify HMAC signature", e);
            return false;
        }
    }
}
