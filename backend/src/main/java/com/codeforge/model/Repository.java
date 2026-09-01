package com.codeforge.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "repositories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Repository {

    @Id
    private String id;

    @Column(nullable = false)
    private String owner;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String defaultBranch;

    private Boolean isPrivate;

    @Column(nullable = false)
    private String webhookSecret;

    @Column(nullable = false)
    private String webhookUrl;

    private String lastActive;

    @Column(columnDefinition = "TEXT")
    private String pipelineYaml;
}
