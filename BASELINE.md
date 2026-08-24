# Baseline Workflow Specification

## Purpose

This document defines the manual comparison condition for Haven Operations Simulator runs. A fair baseline is necessary: the simulator must compare Haven against a realistic, documented hotel operating process—not an intentionally degraded one.

## Manual workflow

1. A synthetic guest message or staff-observed issue is received by front desk or the relevant staff member.
2. The recipient reviews the available message and any standard operating notes.
3. The recipient selects a department manually and communicates the issue through the documented baseline channel.
4. The assigned department acknowledges or acts according to the scenario’s staffing capacity and service-level target.
5. A manager is notified when a defined escalation rule is met.
6. At shift end, the outgoing staff member records the issue in the baseline handoff mechanism.
7. The receiving staff member relies only on the information preserved by that baseline mechanism.
8. A case is closed only after the scenario’s completion condition is met.

## Baseline constraints

The baseline does not include Haven-only capabilities:

- No automated route recommendation
- No AI-generated urgency or churn-risk score
- No AI-drafted response
- No automatic cross-shift case summary
- No automatic pattern detection
- No autonomous dispatch or compensation decision

However, the baseline may use ordinary staff judgement, normal manager escalation, standard notes, phone/radio/email/task communication, and reasonable departmental expertise.

## Fairness controls

- The same hotel context, occupancy, staffing condition, issue timing, guest profile, and random seed must be used for paired baseline and Haven runs.
- The manual baseline must be scored by the same scenario rubric, except for criteria dependent exclusively on a Haven feature.
- Baseline delays must arise from documented workload, shift, or operational assumptions—not arbitrary penalties.
- All baseline assumptions must be recorded in the run artifact.

## Baseline outputs

For each baseline run, preserve:

- The selected department and reason
- Acknowledgement and completion timestamps
- Handoff notes available to the next shift
- Manager escalations
- Guest follow-up events
- Final resolution decision
- Evaluator score and supporting notes

## Interpretive limit

A difference between the baseline and Haven conditions is evidence of behavior under the simulator’s assumptions. It is not evidence of actual hotel revenue, guest satisfaction, guest loyalty, public-review prevention, or operational outcomes until confirmed in a live pilot.
