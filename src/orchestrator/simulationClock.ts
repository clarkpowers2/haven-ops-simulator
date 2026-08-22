/**
* Haven Operations Simulator™ — Simulation Clock
* HCCGSA LLC | ARCHITEK N ADVOCACY™
*
* The simulation clock advances time without real waiting.
* A full 90-day hotel scenario runs in minutes, not 90 days.
* All events are timestamped with simulated time, not wall-clock time.
*/
export class SimulationClock {
private current: Date;
private readonly startTime: Date;
private tickCallbacks: Array<(time: Date) => void> = [];
constructor(startIso: string) {
this.current = new Date(startIso);
this.startTime = new Date(startIso);
}
/** Current simulated timestamp */
now(): Date {
return new Date(this.current);
}
/** Current time as ISO string */
nowIso(): string {
return this.current.toISOString();
}
/** Elapsed simulated minutes since run start */
elapsedMinutes(): number {
return Math.floor(
(this.current.getTime() - this.startTime.getTime()) / 60000
);
}
/** Advance simulated time by N minutes */
advanceMinutes(minutes: number): void {
this.current = new Date(this.current.getTime() + minutes * 60 * 1000);
this.tickCallbacks.forEach((cb) => cb(this.now()));
}
/** Advance simulated time by N hours */
advanceHours(hours: number): void {
this.advanceMinutes(hours * 60);
}


/** Register a callback that fires on every tick */
onTick(callback: (time: Date) => void): void {
this.tickCallbacks.push(callback);
}
/** Returns true if simulated time has passed the given ISO timestamp */
isPast(isoTimestamp: string): boolean {
return this.current > new Date(isoTimestamp);
}
/** Returns simulated time N minutes from now */
futureIso(minutes: number): string {
return new Date(this.current.getTime() + minutes * 60 * 1000).toISOString();
}
}


