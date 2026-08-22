import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { runSimulation } from '../src/orchestrator/runSimulation'
import type { SimScenario, RunConfig } from '../src/types'

try { process.loadEnvFile('.env.local') } catch { /* Baseline runs need no environment file. */ }

const [scenarioId = 'ENG-001', condition = 'haven', seedText = '204617'] = process.argv.slice(2)
if (condition !== 'haven' && condition !== 'baseline') throw new Error('Condition must be "haven" or "baseline"')
const seed = Number(seedText)
if (!Number.isSafeInteger(seed)) throw new Error('Seed must be a safe integer')

const scenario = JSON.parse(
  await readFile(resolve('scenarios', 'library', `${scenarioId}.json`), 'utf8'),
) as SimScenario
const config: RunConfig = {
  runId: crypto.randomUUID(), seed, hotelProfile: 'boutique_100_room',
  occupancyRate: scenario.hotel_setup.occupancy_percent / 100,
  staffingCondition: 'reduced', condition, scenarioVersion: scenario.version,
}
const result = await runSimulation(scenario, config)
const outputDirectory = resolve('reports', 'output')
await mkdir(outputDirectory, { recursive: true })
await writeFile(
  resolve(outputDirectory, `${result.runId}.scorecard.json`),
  `${JSON.stringify(result.scorecard, null, 2)}\n`,
  { encoding: 'utf8', flag: 'wx' },
)
console.log(JSON.stringify({
  run_id: result.runId, scenario: result.scenarioId, condition: result.condition,
  score: result.finalScore, status: result.status,
}, null, 2))
