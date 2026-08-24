# Simulation Evidence Artifacts

This directory holds sanitized, versioned evidence for completed simulator runs. Do not place production guest data, credentials, API keys, or real hotel operational records here.

## Required artifact per released suite

Create one directory per suite run, for example:

```text
reports/output/2026-08-22-suite-v1/
  manifest.json
  baseline-summary.csv
  haven-summary.csv
  paired-comparison.csv
  audit-log-sanitized.jsonl
  safety-results.csv
  human-review-summary.md
  checksums.sha256
```

## Manifest fields

`manifest.json` must include:

- Suite name and date
- Repository commit SHA
- Scenario IDs and versions
- Run IDs and correlation IDs
- Test conditions
- Random seeds
- Application, routing-rule, model, and prompt versions
- Timezone
- Scoring rubric version
- Statement that the data are synthetic
- Known limitations and unresolved issues

## Audit-log fields

Each sanitized audit record should include at minimum:

```json
{
  "simulation_run_id": "uuid",
  "correlation_id": "uuid",
  "scenario_id": "ENG-001",
  "scenario_version": "1.0.0",
  "condition": "haven",
  "event_type": "route_recommended",
  "simulated_at": "2026-08-22T06:45:00-04:00",
  "prompt_version": "versioned-prompt-id",
  "model_version": "configured-model-id",
  "result": "engineering",
  "human_override": false
}
```

## Evidence integrity

- Preserve source artifacts after publication.
- Record SHA-256 checksums for delivered report files.
- Correct errors through a new dated artifact; never silently replace prior published evidence.
- A public Git repository records version history but does not by itself provide independent validation.

## Permitted external description

> These records document synthetic simulation tests of Haven workflow behavior. They do not establish live-hotel performance, financial impact, guest satisfaction, loyalty, or review outcomes.
