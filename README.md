Haven Operations Simulator™
Independent validation framework for Haven Memory OS™
HCCGSA LLC | ARCHITEK N ADVOCACY™
Author: Nathaniel Clarke | ORCID: 0009-0005-5311-1358
Why this repo exists separately
This simulator lives in its own repository — completely separate from haven-memory-os — because the
system being tested cannot grade itself.
The simulator:
Generates a synthetic boutique hotel (rooms, guests, staff, shifts)
Fires real guest complaint scenarios through Haven's test intake API
Scores Haven's outputs using an independent evaluator
Compares Haven vs. a manual baseline under identical conditions
Logs every input, AI output, decision, and failure with a full audit trail
Results are credible for investor review, partner evaluation, and academic publication because no part of
Haven's code touches the scoring layer.
What this is NOT
Not a live hotel
Not real guest data
Not a claim of real revenue or satisfaction outcomes
"These are synthetic-system validation results. They demonstrate that Haven Memory OS™ routes,
analyzes, escalates, and resolves correctly under controlled conditions. Real proof of commercial
outcomes begins with a consented first-hotel pilot."
Repo structure
haven-ops-simulator/
├── sim-schema/
│ └── 001_create_sim_schema.sql 	# Supabase sim schema — run in simulator project
only


├── scenarios/
│ └── library/ 	# Version-controlled scenario JSON files
│ 	├── ENG-001.json 	# Cold shower — business traveler
│ 	├── FD-001.json 	# Early check-in — repeat VIP guest
│ 	├── SEC-001.json 	# Aggressive guest report — safety critical
│ 	├── SHF-001.json 	# Shift handoff failure
│ 	└── ADV-001.json 	# Prompt injection attempt
├── src/
│ ├── types.ts 	# Shared TypeScript types
│ ├── guards/
│ │ └── productionGuard.ts 	# Hard block: synthetic data never reaches
production
│ ├── orchestrator/
│ │ ├── simulationClock.ts 	# Advances simulated time without real waiting
│ │ ├── seededRandom.ts 	# Deterministic RNG — same seed = same hotel
every time
│ │ └── runSimulation.ts 	# Main run orchestrator
│ ├── generators/
│ │ ├── hotelGenerator.ts 	# Synthetic hotel, rooms, staff
│ │ └── guestGenerator.ts 	# Synthetic guests + state machine
│ ├── evaluator/
│ │ └── evaluator.ts 	# Independent scoring engine
│ └── audit/
│ 	└── auditLogger.ts 	# Structured audit record for every run
└── .env.example 	# Environment variable template — never commit
real values
Setup
1. Create a separate Supabase project for the simulator
Never use the production Haven Supabase project. Create a new one at supabase.com.
2. Run the schema
In the new Supabase project → SQL Editor:
-- Copy and run: sim-schema/001_create_sim_schema.sql
3. Configure environment variables
cp .env.example .env.local
# Fill in your simulator Supabase URL, keys, and Haven test intake URL
# Never commit .env.local


4. Point to Haven's test intake endpoint
The HAVEN_TEST_INTAKE_URL must point to a non-production deployment of Haven Memory OS™ — either
simulator.haven-mos.org or a Cloudflare preview deployment.
Never point this at haven-mos.org production.
Running a simulation
import { runSimulation } from "./src/orchestrator/runSimulation"
import ENG001 from "./scenarios/library/ENG-001.json"
const result = await runSimulation(ENG001, {
runId: crypto.randomUUID(),
seed: 204617, 	// same seed = same hotel every run
hotelProfile: "boutique_100_room",
occupancyRate: 0.86,
staffingCondition: "reduced",
condition: "haven", 	// or "baseline"
scenarioVersion: "1.0.0",
})
console.log(result.scorecard.summary)
console.log(`Score: ${result.finalScore}/100`)
Release gates
No Haven feature ships to a real pilot hotel until all gates pass:
Gate 	Required Result
Core scenario completion 	30/30 scenarios execute without errors
Routing accuracy 	≥ 90% by issue category
Safety suite 	0 critical unsafe outputs
Privacy suite 	0 cross-guest data disclosures
Shift handoff 	100% context retained
RLS / security 	Simulator cannot access production data
Regression suite 	All prior passing scenarios still pass


Gate 	Required Result
Human review 	Hospitality reviewer sign-off
Attribution
Author: Nathaniel Clarke
ORCID: 0009-0005-5311-1358
Organization: HCCGSA LLC
License: CC BY 4.0
Cite as: Clarke, N. (2026). Haven Operations Simulator™. HCCGSA LLC.
ARCHITEK N ADVOCACY™ | haven-mos.org


