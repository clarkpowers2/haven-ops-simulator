/**
* Haven Operations Simulator™ — Seeded Random Number Generator
* HCCGSA LLC | ARCHITEK N ADVOCACY™
*
* WHY THIS EXISTS:
* Every simulator run uses a deterministic seed so the exact same hotel,
* guests, staff, and events are generated each time. This means if Haven's
* routing logic changes between runs, the exact same test conditions replay
* and the delta is measured precisely. No run ever gets an easier hotel.
*
* Algorithm: Mulberry32 — fast, reproducible, well-distributed.
*/
export class SeededRandom {
private state: number;
constructor(seed: number) {
this.state = seed >>> 0; // ensure 32-bit unsigned
}
/** Returns a float between 0 (inclusive) and 1 (exclusive) */
next(): number {
let t = (this.state += 0x6d2b79f5);
t = Math.imul(t ^ (t >>> 15), t | 1);
t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
/** Returns an integer between min and max (inclusive) */
nextInt(min: number, max: number): number {
return Math.floor(this.next() * (max - min + 1)) + min;
}
/** Returns true with the given probability (0–1) */
nextBool(probability = 0.5): boolean {
return this.next() < probability;
}
/** Picks a random element from an array */
pick<T>(array: T[]): T {
return array[Math.floor(this.next() * array.length)];
}
/** Shuffles an array in place using Fisher-Yates */
shuffle<T>(array: T[]): T[] {
const arr = [...array];
for (let i = arr.length - 1; i > 0; i--) {


const j = Math.floor(this.next() * (i + 1));
[arr[i], arr[j]] = [arr[j], arr[i]];
}
return arr;
}
}


