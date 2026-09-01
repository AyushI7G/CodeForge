package com.codeforge.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "pipeline_runs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PipelineRun {

    @Id
    private String id;

    @Column(nullable = false)
    private Integer runNumber;

    @Column(nullable = false)
    private String repoName;

    @Column(nullable = false)
    private String branch;

    @Column(nullable = false)
    private String commitHash;

    @Column(length = 1000)
    private String commitMessage;

    private String author;
    private String authorEmail;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RunStatus status;

    private String triggerType;
    private Instant createdAt;
    private Instant startedAt;
    private Instant finishedAt;
    private Long durationTotalMs;

    private String workerNode;
    private String containerId;
    private String postgresId;
    private Integer kafkaPartition;

    private String errorMessage;
    private String errorStepId;

    public enum RunStatus {
        QUEUED,
        RUNNING,
        SUCCESS,
        FAILED,
        CANCELLED
    }
}
