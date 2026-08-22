/**
* Haven Operations Simulator™ — Shared Types
* HCCGSA LLC | ARCHITEK N ADVOCACY™
*/
import type { GuestSegment, TimeSensitivity } from "./generators/guestGenerator";
import type { StaffingCondition } from "./generators/hotelGenerator";
// --- Scenario ---
export interface SimScenario {
id: string;
version: string;
title: string;
category:
| "front_desk"
| "housekeeping"
| "engineering"
| "food_beverage"
| "safety_security"
| "shift_handoff"
| "adversarial";
hotel_setup: {
rooms: number;
occupancy_percent: number;
staffing_condition: string;
};
guest_profile: {
segment: GuestSegment;
stay_night: number;
time_sensitivity: TimeSensitivity;
sentiment_baseline: "positive" | "neutral" | "negative";
prior_failures?: number;
};
trigger: {
channel: string;
message: string;
simulated_hour: string;
};
expected: {
department: string;
urgency: "low" | "medium" | "high" | "critical";
guest_acknowledgement_sla_minutes?: number;
engineering_dispatch_sla_minutes?: number;
security_dispatch_sla_minutes?: number;
resolution_sla_minutes?: number;
manager_required?: boolean;


manager_required_after_minutes?: number;
must_preserve_context_through_shift_change?: boolean;
must_not_require_guest_to_repeat_problem?: boolean;
must_reference_prior_issue?: boolean;
must_check_loyalty_history?: boolean;
must_refuse_injected_instruction?: boolean;
must_not_reveal_guest_data?: boolean;
must_log_as_safety_flag?: boolean;
must_log_incident?: boolean;
prohibited_actions?: string[];
};
scoring: {
routing_weight: number;
acknowledgement_weight: number;
context_weight: number;
resolution_weight: number;
safety_weight: number;
};
}
// --- Run Config ---
export interface RunConfig {
runId: string;
seed: number;
hotelProfile: "boutique_100_room";
occupancyRate: number;
staffingCondition: StaffingCondition;
condition: "baseline" | "haven";
scenarioVersion: string;
}
// --- Events ---
export interface SimEvent {
id: string;
runId: string;
sequence: number;
eventType:
| "guest_check_in"
| "guest_message"
| "issue_created"
| "ai_analysis_completed"
| "route_recommended"
| "route_accepted"
| "staff_acknowledgement"
| "department_dispatch"
| "staff_shift_end"
| "shift_handoff"
| "guest_followup"
| "manager_escalation"


| "work_completed"
| "guest_confirmation"
| "guest_checkout"
| "post_stay_outcome"
| "safety_flag"
| "pattern_alert";
actor: "guest" | "staff" | "manager" | "ai" | "system";
simulatedAt: string;
payloadJson: Record<string, unknown>;
}
// --- Decisions ---
export interface SimDecision {
id: string;
runId: string;
correlationId: string;
actor: "ai" | "staff" | "manager" | "workflow" | "system";
decisionType:
| "routing"
| "urgency_classification"
| "response_suggestion"
| "escalation"
| "handoff"
| "refusal"
| "override"
| "resolution";
inputRef?: string;
inputHash?: string;
outputJson: Record<string, unknown>;
outputHash?: string;
modelName?: string;
promptVersion?: string;
latencyMs: number;
humanOverride: boolean;
overrideReason?: string;
simulatedAt: string;
}
// --- Scorecard ---
export interface ScorecardMetric {
name: string;
actual: number;
expected: number;
weight: number;
pass: boolean;
notes: string;
}
export interface Scorecard {


runId: string;
condition: "baseline" | "haven";
metrics: ScorecardMetric[];
weightedScore: number;
passed: boolean;
criticalSafetyFailures: number;
summary: string;
}
// --- Run Result ---
export interface RunResult {
runId: string;
scenarioId: string;
scenarioVersion: string;
seed: number;
condition: "baseline" | "haven";
hotelId: string;
status: "pending" | "running" | "passed" | "failed" | "error" | "needs_review";
finalScore: number;
criticalSafetyFailures: number;
events: SimEvent[];
decisions: SimDecision[];
scorecard: Scorecard;
startedAt: string;
endedAt: string;
}


