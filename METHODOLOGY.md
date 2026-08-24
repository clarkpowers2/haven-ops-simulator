# Haven Operations Simulator — Methodology

## Purpose

The Haven Operations Simulator is an internal product-validation environment for evaluating Haven Memory OS workflow behavior using **synthetic hotel-service scenarios**. It tests structured issue capture, routing, acknowledgement, shift handoff, escalation, verified closure, and AI-safety guardrails.

It is not a live-hotel study, an independent third-party validation, or evidence of actual revenue, review, loyalty, or guest-satisfaction outcomes.

## Scope

The simulator evaluates the same defined scenario under two conditions:

- **Baseline:** a documented manual hotel workflow without Haven’s structured routing, persistent case context, automated escalation triggers, or AI recommendations.
- **Haven-assisted:** the Haven test workflow with structured case state, recommended routing, response guidance subject to human approval, cross-shift context, and escalation rules.

The baseline must be reasonable and operationally plausible. It must not be intentionally weakened to increase the apparent difference between conditions.

## Data policy

- All simulator hotels, staff, rooms, stays, messages, and outcomes are fictional.
- Every simulator record must carry `synthetic: true` and a `simulation_run_id`.
- Simulator data must not be mixed with production guest data.
- No real guest message, personally identifiable information, hotel operating record, or customer data may be added without documented authorization and a separate approved protocol.

## Scenario library

The initial suite contains 30 version-controlled scenarios:

| Area | Scenario count | IDs |
|---|---:|---|
| Front desk | 8 | FD-001 to FD-008 |
| Housekeeping | 6 | HK-001 to HK-006 |
| Engineering | 5 | ENG-001 to ENG-005 |
| Food and beverage | 4 | FB-001 to FB-004 |
| Security | 3 | SEC-001 to SEC-003 |
| Shift handoff | 2 | SHF-001 to SHF-002 |
| Adversarial / AI safety | 2 | ADV-001 to ADV-002 |

Each scenario must define: the synthetic hotel context, guest context, trigger event, expected department, urgency, service-level target, prohibited actions, resolution definition, and scoring rubric.

## Reproducibility

Each run must record:

- Scenario ID and version
- Repository commit SHA
- Run ID and correlation ID
- Random seed
- Execution date and simulated timezone
- Test condition: `baseline` or `haven`
- Application, routing-rule, model, and prompt versions
- Full synthetic input and sanitized output
- Human overrides and final evaluation result

The same scenario, seed, and version configuration should produce a replayable run. Changes to a scenario, scoring rubric, prompt, model, workflow, or baseline require a new version and a new comparison run.

## Measurements

The simulator reports component metrics rather than treating one summary score as proof of product value:

- Capture rate
- Correct routing rate
- Acknowledgement-SLA compliance
- Context-retention rate through shift handoff
- Verified-resolution rate
- Duplicate-explanation rate
- Escalation rate
- Manager-override rate
- Unsafe-output rate
- Pattern-alert precision

A critical safety failure fails a run regardless of any weighted summary score.

## Human review

A qualified hospitality operations reviewer must independently assess a representative sample using the rubric in `reports/human-review/REVIEW-PROTOCOL.md`. Where feasible, two reviewers should score the same sample independently. Differences are documented and resolved without modifying historical run evidence.

## Reporting language

Permitted external wording:

> Haven has published a version-controlled synthetic hotel-operations simulator with 30 scenarios and a documented internal evaluation framework. Results are simulation findings, not live-hotel outcomes.

Prohibited wording without additional evidence:

- “Independent validation”
- “Real hotel complaint scenarios”
- Claims of verified revenue, loyalty, review, or satisfaction impact
- Claims that simulation results represent all hotels or real guest behavior

## Limitations

Simulation behavior depends on scenario assumptions, workflow configuration, staffing models, scoring rules, and the system version under test. Results demonstrate test-environment behavior only. Commercial or guest-experience claims require a consented live-property pilot with documented methodology.
