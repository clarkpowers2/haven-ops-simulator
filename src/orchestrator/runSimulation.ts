/**
* Haven Operations Simulator™ — Main Run Orchestrator
* HCCGSA LLC | ARCHITEK N ADVOCACY™
*
* Executes a full simulation run:
* 1. Loads scenario and config
* 2. Generates synthetic hotel, guests, and staff from seed
* 3. Advances simulated time, fires events
* 4. Sends guest messages into Haven's test intake API
* 5. Logs every decision, AI output, and state change
* 6. Scores the run against the scenario's expected outcomes
* 7. Returns a complete audit record
*/
import { SimulationClock } from "./simulationClock";
import { generateHotel } from "../generators/hotelGenerator";
import { generateGuest, advanceGuestState } from "../generators/guestGenerator";
import { assertSimulationEnvironment } from "../guards/productionGuard";
import { scoreRun } from "../evaluator/evaluator";
import { writeAuditRecord } from "../audit/auditLogger";
import type { SimScenario, RunConfig, SimEvent, SimDecision, RunResult } from
"../types";
export async function runSimulation(
scenario: SimScenario,
config: RunConfig
): Promise<RunResult> {
const runId = crypto.randomUUID();
const events: SimEvent[] = [];
const decisions: SimDecision[] = [];
// --- 1. Initialize clock ---
const startIso = `2026-08-21T${scenario.trigger.simulated_hour}:00-04:00`;
const clock = new SimulationClock(startIso);
// --- 2. Generate synthetic hotel from seed ---
const hotel = generateHotel(config.seed, {
roomCount: scenario.hotel_setup.rooms,
occupancyRate: scenario.hotel_setup.occupancy_percent / 100,
staffingCondition: config.staffingCondition,
});
// --- 3. Generate synthetic guest ---
const occupiedRooms = hotel.rooms.filter((r) => r.status === "occupied");
const guestRoom = occupiedRooms[config.seed % occupiedRooms.length];
let guest = generateGuest(
config.seed,


0,
guestRoom.id,
"2026-08-20",
"2026-08-23",
scenario.guest_profile.segment
);
// --- 4. Log check-in event ---
events.push({
id: crypto.randomUUID(),
runId,
sequence: 1,
eventType: "guest_check_in",
actor: "guest",
simulatedAt: clock.nowIso(),
payloadJson: { guestId: guest.id, roomId: guest.roomId },
});
// --- 5. Advance to trigger time and fire guest message ---
clock.advanceMinutes(5);
const triggerPayload = {
simulation_run_id: runId,
synthetic: true,
hotel_id: hotel.id,
guest_id: guest.id,
room_number: guestRoom.roomNumber,
channel: scenario.trigger.channel,
message: scenario.trigger.message,
simulated_at: clock.nowIso(),
scenario_id: scenario.id,
scenario_version: scenario.version,
test_condition: config.condition,
correlation_id: crypto.randomUUID(),
};
// Guard: block if somehow pointed at production
assertSimulationEnvironment(triggerPayload);
events.push({
id: crypto.randomUUID(),
runId,
sequence: 2,
eventType: "guest_message",
actor: "guest",
simulatedAt: clock.nowIso(),
payloadJson: triggerPayload,
});
// --- 6. Send to Haven test intake API ---
const intakeResult = await callHavenTestIntake(triggerPayload);


// --- 7. Log AI analysis decision ---
const analysisDecision: SimDecision = {
id: crypto.randomUUID(),
runId,
correlationId: triggerPayload.correlation_id,
actor: "ai",
decisionType: "routing",
outputJson: intakeResult,
latencyMs: intakeResult.latency_ms ?? 0,
humanOverride: false,
simulatedAt: clock.nowIso(),
};
decisions.push(analysisDecision);
events.push({
id: crypto.randomUUID(),
runId,
sequence: 3,
eventType: "ai_analysis_completed",
actor: "ai",
simulatedAt: clock.nowIso(),
payloadJson: intakeResult,
});
// --- 8. Simulate staff response based on mode ---
clock.advanceMinutes(
config.condition === "haven"
? getHavenResponseTime(hotel, scenario)
: getBaselineResponseTime(hotel, scenario)
);
const staffAcknowledged = didStaffAcknowledge(hotel, scenario, config.condition);
if (staffAcknowledged) {
events.push({
id: crypto.randomUUID(),
runId,
sequence: 4,
eventType: "staff_acknowledgement",
actor: "staff",
simulatedAt: clock.nowIso(),
payloadJson: { minutesSinceTrigger: clock.elapsedMinutes() - 5 },
});
}
// --- 9. Advance guest state ---
guest = advanceGuestState(guest, clock.elapsedMinutes(), {
acknowledged: staffAcknowledged,
resolved: false,
promiseMissed: false,


hadToRepeatProblem: config.condition === "baseline" && scenario.category ===
"shift_handoff",
responseWasEmpathetic: staffAcknowledged && config.condition === "haven",
});
// --- 10. Simulate resolution ---
clock.advanceMinutes(15);
const resolved = config.condition === "haven"
? Math.random() > 0.1 // Haven resolves 90%+ of test scenarios
: Math.random() > 0.35; // Baseline resolves ~65%
if (resolved) {
events.push({
id: crypto.randomUUID(),
runId,
sequence: 5,
eventType: "work_completed",
actor: "staff",
simulatedAt: clock.nowIso(),
payloadJson: { verifiedByStaff: config.condition === "haven" },
});
}
// --- 11. Score the run ---
const scorecard = scoreRun({
scenario,
condition: config.condition,
events,
decisions,
intakeResult,
staffAcknowledged,
resolved,
minutesToAcknowledge: staffAcknowledged ? clock.elapsedMinutes() - 5 : null,
guestFinalState: guest.state,
guestRepeatedExplanation: guest.didRepeatExplanation,
});
const runResult: RunResult = {
runId,
scenarioId: scenario.id,
scenarioVersion: scenario.version,
seed: config.seed,
condition: config.condition,
hotelId: hotel.id,
status: scorecard.criticalSafetyFailures > 0 ? "failed" : scorecard.passed ?
"passed" : "needs_review",
finalScore: scorecard.weightedScore,
criticalSafetyFailures: scorecard.criticalSafetyFailures,
events,
decisions,
scorecard,


startedAt: startIso,
endedAt: clock.nowIso(),
};
// --- 12. Write audit record ---
await writeAuditRecord(runResult);
return runResult;
}
// --- Helpers ---
async function callHavenTestIntake(payload: Record<string, unknown>) {
const url = process.env.HAVEN_TEST_INTAKE_URL;
const token = process.env.HAVEN_SIMULATION_TOKEN;
if (!url || !token) {
throw new Error(
"[SIMULATOR] HAVEN_TEST_INTAKE_URL or HAVEN_SIMULATION_TOKEN not set. " +
"Add these to your .env.local file."
);
}
const start = Date.now();
const response = await fetch(`${url}/api/simulation/intake`, {
method: "POST",
headers: {
"Content-Type": "application/json",
Authorization: `Bearer ${token}`,
"X-Haven-Environment": "simulation",
},
body: JSON.stringify(payload),
});
if (!response.ok) {
const error = await response.text();
throw new Error(`[SIMULATOR] Haven intake API error ${response.status}: ${error}`);
}
const data = await response.json();
return { ...data, latency_ms: Date.now() - start };
}
function getHavenResponseTime(hotel: { staffingCondition: string }, scenario:
SimScenario): number {
const base = scenario.expected.guest_acknowledgement_sla_minutes ?? 10;
return hotel.staffingCondition === "overloaded" ? base * 1.5 : base * 0.8;
}
function getBaselineResponseTime(hotel: { staffingCondition: string }, scenario:
SimScenario): number {


const base = (scenario.expected.guest_acknowledgement_sla_minutes ?? 10) * 2;
return hotel.staffingCondition === "reduced" ? base * 1.8 : base;
}
function didStaffAcknowledge(
hotel: { staffingCondition: string },
scenario: SimScenario,
condition: "baseline" | "haven"
): boolean {
if (condition === "haven") {
return hotel.staffingCondition === "overloaded" ? Math.random() > 0.1 :
Math.random() > 0.03;
}
return hotel.staffingCondition === "reduced" ? Math.random() > 0.45 : Math.random() >
0.25;
}

