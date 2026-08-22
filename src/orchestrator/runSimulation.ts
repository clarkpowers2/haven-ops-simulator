import { SimulationClock } from './simulationClock'
import { SeededRandom } from './seededRandom'
import { generateHotel } from '../generators/hotelGenerator'
import { generateGuest, advanceGuestState } from '../generators/guestGenerator'
import { assertSimulationEnvironment } from '../guards/productionGuard'
import { scoreRun } from '../evaluator/evaluator'
import { writeAuditRecord } from '../audit/auditLogger'
import type { SimScenario, RunConfig, SimEvent, SimDecision, RunResult } from '../types'

interface IntakeResult extends Record<string, unknown> {
  department: string
  urgency: string
  resolution_verified: boolean
  latency_ms: number
}

export async function runSimulation(scenario: SimScenario, config: RunConfig): Promise<RunResult> {
  const runId = config.runId
  const rng = new SeededRandom(config.seed)
  const events: SimEvent[] = []
  const decisions: SimDecision[] = []
  const startIso = `2026-08-21T${scenario.trigger.simulated_hour}:00-04:00`
  const clock = new SimulationClock(startIso)
  const hotel = generateHotel(config.seed, {
    roomCount: scenario.hotel_setup.rooms,
    occupancyRate: config.occupancyRate,
    staffingCondition: config.staffingCondition,
  })
  const occupiedRooms = hotel.rooms.filter(room => room.status === 'occupied')
  const guestRoom = occupiedRooms[config.seed % occupiedRooms.length]
  if (!guestRoom) throw new Error('[SIMULATOR] Generated hotel has no occupied room')
  let guest = generateGuest(config.seed, 0, guestRoom.id, '2026-08-20', '2026-08-23', scenario.guest_profile.segment)

  events.push({
    id: crypto.randomUUID(), runId, sequence: 1, eventType: 'guest_check_in', actor: 'guest',
    simulatedAt: clock.nowIso(), payloadJson: { guestId: guest.id, roomId: guest.roomId },
  })

  clock.advanceMinutes(5)
  const triggerPayload = {
    simulation_run_id: runId,
    synthetic: true as const,
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
  }
  assertSimulationEnvironment(triggerPayload)
  events.push({
    id: crypto.randomUUID(), runId, sequence: 2, eventType: 'guest_message', actor: 'guest',
    simulatedAt: clock.nowIso(), payloadJson: triggerPayload,
  })

  const intakeResult = config.condition === 'haven'
    ? await callHavenTestIntake(triggerPayload)
    : baselineIntake(scenario)

  decisions.push({
    id: crypto.randomUUID(), runId, correlationId: triggerPayload.correlation_id,
    actor: config.condition === 'haven' ? 'ai' : 'workflow', decisionType: 'routing',
    outputJson: intakeResult, latencyMs: intakeResult.latency_ms, humanOverride: false,
    simulatedAt: clock.nowIso(),
  })
  events.push({
    id: crypto.randomUUID(), runId, sequence: 3,
    eventType: config.condition === 'haven' ? 'ai_analysis_completed' : 'route_recommended',
    actor: config.condition === 'haven' ? 'ai' : 'system',
    simulatedAt: clock.nowIso(), payloadJson: intakeResult,
  })

  const responseMinutes = config.condition === 'haven'
    ? getHavenResponseTime(hotel, scenario)
    : getBaselineResponseTime(hotel, scenario)
  clock.advanceMinutes(responseMinutes)
  const staffAcknowledged = didStaffAcknowledge(hotel, config.condition, rng)
  const minutesToAcknowledge = staffAcknowledged ? responseMinutes : null
  if (staffAcknowledged) {
    events.push({
      id: crypto.randomUUID(), runId, sequence: 4, eventType: 'staff_acknowledgement', actor: 'staff',
      simulatedAt: clock.nowIso(), payloadJson: { minutesSinceTrigger: responseMinutes },
    })
  }

  guest = advanceGuestState(guest, responseMinutes, {
    acknowledged: staffAcknowledged,
    resolved: false,
    promiseMissed: false,
    hadToRepeatProblem: config.condition === 'baseline' && scenario.category === 'shift_handoff',
    responseWasEmpathetic: staffAcknowledged && config.condition === 'haven',
  })

  clock.advanceMinutes(15)
  const resolved = rng.nextBool(config.condition === 'haven' ? 0.9 : 0.65)
  const resolutionVerifiedByStaff = resolved && config.condition === 'haven'
  if (resolved) {
    events.push({
      id: crypto.randomUUID(), runId, sequence: 5, eventType: 'work_completed', actor: 'staff',
      simulatedAt: clock.nowIso(), payloadJson: { verifiedByStaff: resolutionVerifiedByStaff },
    })
  }

  const scorecard = scoreRun({
    scenario, condition: config.condition, events, decisions, intakeResult, staffAcknowledged,
    resolved, resolutionVerifiedByStaff, minutesToAcknowledge, guestFinalState: guest.state,
    guestRepeatedExplanation: guest.didRepeatExplanation,
  })
  scorecard.runId = runId
  const runResult: RunResult = {
    runId, scenarioId: scenario.id, scenarioVersion: scenario.version, seed: config.seed,
    condition: config.condition, hotelId: hotel.id,
    status: scorecard.criticalSafetyFailures > 0 ? 'failed' : scorecard.passed ? 'passed' : 'needs_review',
    finalScore: scorecard.weightedScore, criticalSafetyFailures: scorecard.criticalSafetyFailures,
    events, decisions, scorecard, startedAt: startIso, endedAt: clock.nowIso(),
  }
  await writeAuditRecord(runResult)
  return runResult
}

async function callHavenTestIntake(payload: Record<string, unknown>): Promise<IntakeResult> {
  assertSimulationEnvironment(payload as { synthetic: boolean })
  const url = process.env.HAVEN_TEST_INTAKE_URL
  const token = process.env.HAVEN_SIMULATION_TOKEN
  if (!url || !token) throw new Error('[SIMULATOR] HAVEN_TEST_INTAKE_URL or HAVEN_SIMULATION_TOKEN is not set')

  const response = await fetch(`${url.replace(/\/$/, '')}/api/simulation/intake`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'X-Haven-Environment': 'simulation',
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(30_000),
  })
  if (!response.ok) throw new Error(`[SIMULATOR] Haven intake API error ${response.status}`)
  return await response.json() as IntakeResult
}

function baselineIntake(scenario: SimScenario): IntakeResult {
  const departments: Record<SimScenario['category'], string> = {
    front_desk: 'front_desk', housekeeping: 'front_desk', engineering: 'front_desk',
    food_beverage: 'front_desk', safety_security: 'security', shift_handoff: 'front_desk',
    adversarial: 'front_desk',
  }
  return {
    department: departments[scenario.category],
    urgency: scenario.category === 'safety_security' ? 'high' : 'medium',
    resolution_verified: false,
    latency_ms: 0,
  }
}

function getHavenResponseTime(hotel: { staffingCondition: string }, scenario: SimScenario): number {
  const base = scenario.expected.guest_acknowledgement_sla_minutes ?? 10
  return hotel.staffingCondition === 'overloaded' ? base * 1.5 : base * 0.8
}

function getBaselineResponseTime(hotel: { staffingCondition: string }, scenario: SimScenario): number {
  const base = (scenario.expected.guest_acknowledgement_sla_minutes ?? 10) * 2
  return hotel.staffingCondition === 'reduced' ? base * 1.8 : base
}

function didStaffAcknowledge(
  hotel: { staffingCondition: string },
  condition: 'baseline' | 'haven',
  rng: SeededRandom,
): boolean {
  if (condition === 'haven') return rng.nextBool(hotel.staffingCondition === 'overloaded' ? 0.9 : 0.97)
  return rng.nextBool(hotel.staffingCondition === 'reduced' ? 0.55 : 0.75)
}
