/**
* Haven Operations Simulator™ — Audit Logger
* HCCGSA LLC | ARCHITEK N ADVOCACY™
*
* Writes a complete, structured audit record for every run.
* This is the evidence trail that makes simulator results
* credible for investor and partner review.
*
* Every input, AI output, routing decision, staff action,
* escalation, and failure is logged and retained.
*/
import type { RunResult } from "../types";
export interface AuditRecord {
schema_version: "1.0.0";
run_id: string;
scenario_id: string;
scenario_version: string;
condition: "baseline" | "haven";
seed: number;
hotel_id: string;
status: string;
final_score: number;
critical_safety_failures: number;
started_at: string;
ended_at: string;
event_count: number;
decision_count: number;
scorecard_summary: string;
metrics: Array<{
name: string;
actual: number;
expected: number;
pass: boolean;
weight: number;
notes: string;
}>;
generated_by: "haven-ops-simulator";
organization: "HCCGSA LLC";
methodology: "ARCHITEK N ADVOCACY™";
orcid: "0009-0005-5311-1358";
recorded_at: string;
}
export async function writeAuditRecord(result: RunResult): Promise<void> {
const record: AuditRecord = {


schema_version: "1.0.0",
run_id: result.runId,
scenario_id: result.scenarioId,
scenario_version: result.scenarioVersion,
condition: result.condition,
seed: result.seed,
hotel_id: result.hotelId,
status: result.status,
final_score: result.finalScore,
critical_safety_failures: result.criticalSafetyFailures,
started_at: result.startedAt,
ended_at: result.endedAt,
event_count: result.events.length,
decision_count: result.decisions.length,
scorecard_summary: result.scorecard.summary,
metrics: result.scorecard.metrics,
generated_by: "haven-ops-simulator",
organization: "HCCGSA LLC",
methodology: "ARCHITEK N ADVOCACY™",
orcid: "0009-0005-5311-1358",
recorded_at: new Date().toISOString(),
};
// Write to console in structured format during development
console.log("[AUDIT]", JSON.stringify(record, null, 2));
// In simulator environment, also persist to Supabase sim.runs and sim.scorecards
// This is handled by the API layer when connected to the sim Supabase project
// See: src/api/persistRun.ts
}
/**
* Returns a human-readable audit summary for export / review queue
*/
export function buildAuditSummary(result: RunResult): string {
const lines = [
`Haven Operations Simulator™ — Run Audit`,
`Organization: HCCGSA LLC | ARCHITEK N ADVOCACY™`,
`ORCID: 0009-0005-5311-1358`,
``,
`Run ID: 	${result.runId}`,
`Scenario: 	${result.scenarioId} v${result.scenarioVersion}`,
`Condition: 	${result.condition.toUpperCase()}`,
`Seed: 	${result.seed}`,
`Status: 	${result.status.toUpperCase()}`,
`Final Score: 	${result.finalScore}/100`,
`Safety Failures: ${result.criticalSafetyFailures}`,
`Started: 	${result.startedAt}`,
`Ended: 	${result.endedAt}`,
`Events Logged: ${result.events.length}`,
`Decisions Logged: ${result.decisions.length}`,


``,
`--- SCORECARD ---`,
...result.scorecard.metrics.map(
(m) => ` [${m.pass ? "PASS" : "FAIL"}] ${m.name}: ${m.actual}/${m.expected}
(weight: ${m.weight}) — ${m.notes}`
),
``,
`Summary: ${result.scorecard.summary}`,
``,
`EVIDENCE STATEMENT:`,
`These are synthetic-system validation results produced by an independent`,
`evaluator codebase. They do not represent live-property revenue,`,
`guest-satisfaction, or loyalty outcomes.`,
];
return lines.join("\n");
}


