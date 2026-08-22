/**
* Haven Operations Simulator™ — Production Guard
* HCCGSA LLC | ARCHITEK N ADVOCACY™
*
* CRITICAL SAFETY RULE:
* Synthetic simulation data must NEVER reach the production environment.
* This guard is called at the top of every function that sends data
* to the Haven intake API. It is not optional.
*/
export type SimEnvironment = "simulation" | "development" | "production";
export function assertSimulationEnvironment(payload: {
synthetic: boolean;
}): void {
const environment = (process.env.VITE_ENVIRONMENT ||
"simulation") as SimEnvironment;
// Hard block: synthetic data cannot enter production under any circumstances
if (environment === "production" && payload.synthetic === true) {
throw new Error(
"[HAVEN SIMULATOR GUARD] BLOCKED: Synthetic simulation data is " +
"disabled in production. This payload was rejected before sending. " +
"Check your VITE_ENVIRONMENT variable — it must not be 'production' " +
"in the simulator repo."
);
}
// Soft block: warn loudly if synthetic flag is missing
if (payload.synthetic !== true) {
throw new Error(
"[HAVEN SIMULATOR GUARD] BLOCKED: All simulator payloads must carry " +
"synthetic = true. This payload is missing the field. Add it before sending."
);
}
// Confirm environment is valid
const validEnvironments: SimEnvironment[] = ["simulation", "development"];
if (!validEnvironments.includes(environment)) {
throw new Error(
`[HAVEN SIMULATOR GUARD] BLOCKED: Unknown environment "${environment}". ` +
"Valid values are: simulation, development."
);
}
}
export function getSimEnvironment(): SimEnvironment {


return (process.env.VITE_ENVIRONMENT || "simulation") as SimEnvironment;
}

