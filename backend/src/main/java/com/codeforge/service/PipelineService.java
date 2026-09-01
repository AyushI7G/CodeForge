package com.codeforge.service;

import com.codeforge.model.PipelineRun;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PipelineService {

    private final Map<String, PipelineRun> runsStore = new ConcurrentHashMap<>();

    public PipelineService() {
        // Initialize with default historical runs
        PipelineRun run25 = PipelineRun.builder()
                .id("run-25")
                .runNumber(25)
                .repoName("acme/codeforge-web")
                .branch("main")
                .commitHash("7b4c91a")
                .commitMessage("fix(auth): update session token renewal middleware and tests")
                .author("Ayushi Gupta")
                .authorEmail("ayushi@codeforge.internal")
                .status(PipelineRun.RunStatus.FAILED)
                .triggerType("WEBHOOK_PUSH")
                .createdAt(Instant.now().minusSeconds(1200))
                .startedAt(Instant.now().minusSeconds(1199))
                .finishedAt(Instant.now().minusSeconds(1161))
                .durationTotalMs(38000L)
                .errorMessage("3 test suites failed in src/auth/__tests__/session.spec.ts")
                .errorStepId("step-tests")
                .workerNode("k8s-worker-node-us-east-1a")
                .containerId("docker-runner-7b4c91a")
                .postgresId("pg_run_25_db992")
                .kafkaPartition(2)
                .build();

        PipelineRun run24 = PipelineRun.builder()
                .id("run-24")
                .runNumber(24)
                .repoName("acme/codeforge-web")
                .branch("main")
                .commitHash("4e9d20c")
                .commitMessage("feat(ui): add pipeline DAG visualizer and status pill matrix")
                .author("Ayushi Gupta")
                .authorEmail("ayushi@codeforge.internal")
                .status(PipelineRun.RunStatus.SUCCESS)
                .triggerType("WEBHOOK_PUSH")
                .createdAt(Instant.now().minusSeconds(3600))
                .startedAt(Instant.now().minusSeconds(3599))
                .finishedAt(Instant.now().minusSeconds(3534))
                .durationTotalMs(65000L)
                .workerNode("k8s-worker-node-us-east-1b")
                .containerId("docker-runner-4e9d20c")
                .postgresId("pg_run_24_db991")
                .kafkaPartition(1)
                .build();

        runsStore.put(run25.getId(), run25);
        runsStore.put(run24.getId(), run24);
    }

    public List<PipelineRun> findAllRuns() {
        List<PipelineRun> list = new ArrayList<>(runsStore.values());
        list.sort((a, b) -> Integer.compare(b.getRunNumber(), a.getRunNumber()));
        return list;
    }

    public Optional<PipelineRun> findRunById(String id) {
        return Optional.ofNullable(runsStore.get(id));
    }

    public PipelineRun dispatchManualRun(Map<String, Object> payload) {
        int nextRunNumber = runsStore.values().stream()
                .mapToInt(PipelineRun::getRunNumber)
                .max()
                .orElse(25) + 1;

        String commitHash = (String) payload.getOrDefault("commitHash", UUID.randomUUID().toString().substring(0, 7));

        PipelineRun run = PipelineRun.builder()
                .id("run-" + nextRunNumber)
                .runNumber(nextRunNumber)
                .repoName((String) payload.getOrDefault("repoName", "acme/codeforge-web"))
                .branch((String) payload.getOrDefault("branch", "main"))
                .commitHash(commitHash)
                .commitMessage((String) payload.getOrDefault("commitMessage", "manual: trigger pipeline execution"))
                .author((String) payload.getOrDefault("author", "Developer"))
                .authorEmail((String) payload.getOrDefault("authorEmail", "dev@codeforge.internal"))
                .status(PipelineRun.RunStatus.QUEUED)
                .triggerType((String) payload.getOrDefault("triggerType", "MANUAL_DISPATCH"))
                .createdAt(Instant.now())
                .workerNode("k8s-worker-node-us-east-" + (Math.random() > 0.5 ? "1a" : "1b"))
                .containerId("docker-runner-" + commitHash)
                .postgresId("pg_run_" + nextRunNumber + "_" + UUID.randomUUID().toString().substring(0, 4))
                .kafkaPartition((int) (Math.random() * 8))
                .build();

        runsStore.put(run.getId(), run);
        return run;
    }

    public PipelineRun saveRun(PipelineRun run) {
        runsStore.put(run.getId(), run);
        return run;
    }

    public PipelineRun updateRun(String id, Map<String, Object> updates) {
        PipelineRun run = runsStore.get(id);
        if (run == null) throw new NoSuchElementException("Run not found: " + id);

        if (updates.containsKey("status")) {
            run.setStatus(PipelineRun.RunStatus.valueOf((String) updates.get("status")));
        }
        if (updates.containsKey("startedAt")) {
            run.setStartedAt(Instant.parse((String) updates.get("startedAt")));
        }
        if (updates.containsKey("finishedAt")) {
            run.setFinishedAt(Instant.parse((String) updates.get("finishedAt")));
        }
        if (updates.containsKey("durationTotalMs")) {
            run.setDurationTotalMs(((Number) updates.get("durationTotalMs")).longValue());
        }
        if (updates.containsKey("errorMessage")) {
            run.setErrorMessage((String) updates.get("errorMessage"));
        }
        if (updates.containsKey("errorStepId")) {
            run.setErrorStepId((String) updates.get("errorStepId"));
        }

        runsStore.put(id, run);
        return run;
    }

    public PipelineRun cancelRun(String id) {
        PipelineRun run = runsStore.get(id);
        if (run == null) throw new NoSuchElementException("Run not found: " + id);

        run.setStatus(PipelineRun.RunStatus.CANCELLED);
        run.setFinishedAt(Instant.now());
        runsStore.put(id, run);
        return run;
    }
}
