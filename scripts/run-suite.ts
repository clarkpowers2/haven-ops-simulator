import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { runSimulation } from '../src/orchestrator/runSimulation'
import type { RunConfig, RunResult, SimScenario } from '../src/types'
import type { StaffingCondition } from '../src/generators/hotelGenerator'

try { process.loadEnvFile('.env.local') } catch { /* The Haven condition reports a clear error if secrets are absent. */ }

const seedIndex = process.argv.indexOf('--seed')
const seed = Number(seedIndex >= 0 ? process.argv[seedIndex + 1] : '204617')
if (!Number.isSafeInteger(seed)) throw new Error('Seed must be a safe integer')

const scenarioDirectory = resolve('scenarios', 'library')
const files = (await readdir(scenarioDirectory)).filter(file => file.endsWith('.json')).sort()
if (files.length !== 30) throw new Error(`Expected exactly 30 scenarios; found ${files.length}`)

const results: RunResult[] = []
for (const file of files) {
  const scenario = JSON.parse(await readFile(resolve(scenarioDirectory, file), 'utf8')) as SimScenario
  for (const condition of ['baseline', 'haven'] as const) {
    const config: RunConfig = {
      runId: crypto.randomUUID(),
      seed,
      hotelProfile: 'boutique_100_room',
      occupancyRate: scenario.hotel_setup.occupancy_percent / 100,
      staffingCondition: staffingCondition(scenario.hotel_setup.staffing_condition),
      condition,
      scenarioVersion: scenario.version,
    }
    console.log(`[SUITE] ${scenario.id} ${condition}`)
    const result = await runSimulation(scenario, config)
    results.push(result)
    await writeScorecard(result)
  }
}

const summary = {
  suite_version: '1.0.0',
  seed,
  generated_at: new Date().toISOString(),
  scenario_count: files.length,
  run_count: results.length,
  conditions: {
    baseline: summarize(results.filter(result => result.condition === 'baseline')),
    haven: summarize(results.filter(result => result.condition === 'haven')),
  },
}
const outputDirectory = resolve('reports', 'output')
const summaryFile = `suite-${seed}-${new Date().toISOString().replace(/[:.]/g, '-')}.summary.json`
await writeFile(resolve(outputDirectory, summaryFile), `${JSON.stringify(summary, null, 2)}\n`, 'utf8')
console.log(`[SUITE] Wrote reports/output/${summaryFile}`)
console.log(JSON.stringify(summary, null, 2))

function staffingCondition(value: string): StaffingCondition {
  if (value.includes('overloaded')) return 'overloaded'
  if (value.includes('reduced')) return 'reduced'
  return 'normal'
}

async function writeScorecard(result: RunResult): Promise<void> {
  const outputDirectory = resolve('reports', 'output')
  await mkdir(outputDirectory, { recursive: true })
  await writeFile(
    resolve(outputDirectory, `${result.runId}.scorecard.json`),
    `${JSON.stringify(result.scorecard, null, 2)}\n`,
    { encoding: 'utf8', flag: 'wx' },
  )
}

function summarize(conditionResults: RunResult[]) {
  const metric = (result: RunResult, name: string) => result.scorecard.metrics.find(item => item.name === name)
  return {
    passed: conditionResults.filter(result => result.status === 'passed').length,
    failed: conditionResults.filter(result => result.status === 'failed').length,
    needs_review: conditionResults.filter(result => result.status === 'needs_review').length,
    critical_safety_failures: conditionResults.reduce((sum, result) => sum + result.criticalSafetyFailures, 0),
    average_weighted_score: Math.round(
      conditionResults.reduce((sum, result) => sum + result.finalScore, 0) / conditionResults.length * 10,
    ) / 10,
    routing_accuracy_percent: Math.round(
      conditionResults.filter(result => metric(result, 'routing_accuracy')?.pass).length / conditionResults.length * 1000,
    ) / 10,
    context_retention_percent: Math.round(
      conditionResults.filter(result => metric(result, 'context_retention')?.pass).length / conditionResults.length * 1000,
    ) / 10,
    items: conditionResults.map(result => ({
      scenario_id: result.scenarioId,
      run_id: result.runId,
      status: result.status,
      score: result.finalScore,
      critical_safety_failures: result.criticalSafetyFailures,
      failed_metrics: result.scorecard.metrics.filter(item => !item.pass).map(item => ({ name: item.name, reason: item.notes })),
    })),
  }
}
