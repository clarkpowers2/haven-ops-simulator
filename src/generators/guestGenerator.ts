/**
* Haven Operations Simulator™ — Synthetic Guest Generator
* HCCGSA LLC | ARCHITEK N ADVOCACY™
*
* Generates realistic but entirely fictional guest profiles.
* Names, emails, and phone numbers are synthetic and never real.
* Guest behavior is modeled as an explicit rule-based state machine —
* not a prediction of real human psychology.
*/
import { SeededRandom } from "../orchestrator/seededRandom";
export type GuestSegment =
| "business_traveler"
| "leisure"
| "family"
| "repeat_guest"
| "event_attendee"
| "vip"
| "accessibility_needs";
export type GuestState =
| "neutral"
| "friction_observed"
| "concern_expressed"
| "complaint_submitted"
| "awaiting_acknowledgement"
| "awaiting_resolution"
| "recovered"
| "frustrated"
| "escalated"
| "checked_out"
| "post_stay";
export type TimeSensitivity = "low" | "medium" | "high" | "critical";
export interface SimGuest {
id: string;
stayId: string;
roomId: string;
firstName: string;
lastName: string;
email: string;
segment: GuestSegment;
checkInDate: string;
checkOutDate: string;
stayNight: number; 	// current night of stay (1 = first night)


patienceMinutes: number; // how long before frustration triggers
timeSensitivity: TimeSensitivity;
sentimentBaseline: "positive" | "neutral" | "negative";
priorFailures: number; // issues already experienced this stay
state: GuestState;
didRepeatExplanation: boolean;
repeatedExplanationCount: number;
synthetic: true;
}
// Synthetic first names — diverse, fictional
const FIRST_NAMES = [
"James", "Aisha", "Marcus", "Priya", "Carlos", "Fatima",
"David", "Yuki", "Omar", "Simone", "Patrick", "Nadia",
"Robert", "Amara", "Kevin", "Elena", "Kwame", "Ingrid",
"Daniel", "Mei", "Troy", "Sylvia", "Rashid", "Claire",
];
// Synthetic last names — diverse, fictional
const LAST_NAMES = [
"Morrison", "Patel", "Rivera", "Nakamura", "Hassan", "Williams",
"Thompson", "Okonkwo", "Rodriguez", "Johansson", "Chen", "Baker",
"Anderson", "Mensah", "Campbell", "Volkov", "Ibrahim", "Fischer",
"Walker", "Santos", "Grant", "Kowalski", "Diallo", "Bennett",
];
export function generateGuest(
seed: number,
index: number,
roomId: string,
checkInDate: string,
checkOutDate: string,
segment?: GuestSegment
): SimGuest {
// Each guest uses a unique sub-seed so guests differ even with the same run seed
const rng = new SeededRandom(seed + index * 997);
const firstName = rng.pick(FIRST_NAMES);
const lastName = rng.pick(LAST_NAMES);
const guestSegment = segment ?? rng.pick([
"business_traveler", "leisure", "family",
"repeat_guest", "event_attendee", "vip",
] as GuestSegment[]);
// Patience and time sensitivity vary by segment
const { patienceMinutes, timeSensitivity, sentimentBaseline } =
getSegmentBehavior(rng, guestSegment);
const checkIn = new Date(checkInDate);
const checkOut = new Date(checkOutDate);
const stayNights = Math.round(


(checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
);
return {
id: `sim-guest-${seed}-${index}`,
stayId: `sim-stay-${seed}-${index}`,
roomId,
firstName,
lastName,
// Synthetic email — not real
email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@sim-guest.invalid`,
segment: guestSegment,
checkInDate,
checkOutDate,
stayNight: rng.nextInt(1, Math.max(1, stayNights)),
patienceMinutes,
timeSensitivity,
sentimentBaseline,
priorFailures: 0,
state: "neutral",
didRepeatExplanation: false,
repeatedExplanationCount: 0,
synthetic: true,
};
}
function getSegmentBehavior(rng: SeededRandom, segment: GuestSegment): {
patienceMinutes: number;
timeSensitivity: TimeSensitivity;
sentimentBaseline: "positive" | "neutral" | "negative";
} {
switch (segment) {
case "business_traveler":
return {
patienceMinutes: rng.nextInt(5, 12),
timeSensitivity: rng.pick(["high", "critical"]),
sentimentBaseline: "neutral",
};
case "vip":
return {
patienceMinutes: rng.nextInt(3, 8),
timeSensitivity: "critical",
sentimentBaseline: rng.pick(["positive", "neutral"]),
};
case "repeat_guest":
return {
patienceMinutes: rng.nextInt(10, 20),
timeSensitivity: "medium",
sentimentBaseline: "positive",
};
case "family":


return {
patienceMinutes: rng.nextInt(8, 15),
timeSensitivity: rng.pick(["medium", "high"]),
sentimentBaseline: "neutral",
};
case "accessibility_needs":
return {
patienceMinutes: rng.nextInt(5, 10),
timeSensitivity: "high",
sentimentBaseline: "neutral",
};
case "leisure":
case "event_attendee":
default:
return {
patienceMinutes: rng.nextInt(12, 25),
timeSensitivity: rng.pick(["low", "medium"]),
sentimentBaseline: rng.pick(["positive", "neutral"]),
};
}
}
/**
* Guest state machine — advances state based on system response
* This is a documented behavioral model, not a prediction of real emotion.
*/
export function advanceGuestState(
guest: SimGuest,
minutesSinceComplaint: number,
context: {
acknowledged: boolean;
resolved: boolean;
promiseMissed: boolean;
hadToRepeatProblem: boolean;
responseWasEmpathetic: boolean;
}
): SimGuest {
const updated = { ...guest };
if (context.hadToRepeatProblem) {
updated.repeatedExplanationCount += 1;
updated.didRepeatExplanation = true;
}
// Resolution path
if (
context.resolved &&
context.responseWasEmpathetic &&
!context.hadToRepeatProblem
) {
updated.state = "recovered";


return updated;
}
// Escalation triggers
if (
context.promiseMissed ||
updated.repeatedExplanationCount > 1 ||
updated.priorFailures >= 2
) {
updated.state = "escalated";
return updated;
}
// Patience exceeded without acknowledgement
if (
minutesSinceComplaint > guest.patienceMinutes &&
!context.acknowledged
) {
updated.state = "frustrated";
return updated;
}
// Normal progression
if (context.acknowledged && !context.resolved) {
updated.state = "awaiting_resolution";
} else if (!context.acknowledged) {
updated.state = "awaiting_acknowledgement";
}
return updated;
}


