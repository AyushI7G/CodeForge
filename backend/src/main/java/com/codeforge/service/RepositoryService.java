package com.codeforge.service;

import com.codeforge.model.Repository;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RepositoryService {

    private final Map<String, Repository> repoStore = new ConcurrentHashMap<>();

    public RepositoryService() {
        Repository web = Repository.builder()
                .id("repo-1")
                .owner("acme")
                .name("codeforge-web")
                .defaultBranch("main")
                .isPrivate(false)
                .webhookSecret("cf_sec_9938f01bca")
                .webhookUrl("https://api.codeforge.internal/v1/webhooks/github/acme/codeforge-web")
                .lastActive("5 minutes ago")
                .build();

        Repository api = Repository.builder()
                .id("repo-2")
                .owner("acme")
                .name("auth-service")
                .defaultBranch("main")
                .isPrivate(true)
                .webhookSecret("cf_sec_8841a99f1c")
                .webhookUrl("https://api.codeforge.internal/v1/webhooks/github/acme/auth-service")
                .lastActive("2 hours ago")
                .build();

        repoStore.put(web.getId(), web);
        repoStore.put(api.getId(), api);
    }

    public List<Repository> findAllRepositories() {
        return new ArrayList<>(repoStore.values());
    }

    public Repository createRepository(Map<String, Object> body) {
        String owner = (String) body.getOrDefault("owner", "acme");
        String name = (String) body.get("name");
        String branch = (String) body.getOrDefault("defaultBranch", "main");
        boolean isPrivate = Boolean.TRUE.equals(body.get("isPrivate"));

        String id = "repo-" + System.currentTimeMillis();
        String secret = "cf_sec_" + UUID.randomUUID().toString().substring(0, 10);

        Repository repo = Repository.builder()
                .id(id)
                .owner(owner)
                .name(name)
                .defaultBranch(branch)
                .isPrivate(isPrivate)
                .webhookSecret(secret)
                .webhookUrl("https://api.codeforge.internal/v1/webhooks/github/" + owner + "/" + name)
                .lastActive("Just connected")
                .build();

        repoStore.put(repo.getId(), repo);
        return repo;
    }

    public void updateWorkflow(String id, String yaml) {
        Repository repo = repoStore.get(id);
        if (repo != null) {
            repo.setPipelineYaml(yaml);
            repoStore.put(id, repo);
        }
    }
}
