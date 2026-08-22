/**
* Haven Operations Simulator™ — Synthetic Hotel Generator
* HCCGSA LLC | ARCHITEK N ADVOCACY™
*
* Generates a fully realized boutique hotel with rooms, floors,
* occupancy state, staffing per shift, and operational stress conditions.
* Everything is deterministic from the seed — the same seed always
* produces the same hotel.
*/
import { SeededRandom } from "../orchestrator/seededRandom";
export type StaffingCondition = "normal" | "reduced" | "overloaded";
export type RoomType = "standard" | "deluxe" | "suite" | "accessible";
export type RoomStatus = "available" | "occupied" | "out_of_order" | "maintenance";
export interface SimRoom {
id: string;
roomNumber: string;
floor: number;
roomType: RoomType;
status: RoomStatus;
synthetic: true;
}
export interface SimStaffMember {
id: string;
name: string;
role: "front_desk" | "engineering" | "housekeeping" | "fb" | "security" | "manager";
department: string;
shiftStart: string; // "07:00"
shiftEnd: string; // "15:00"
avgResponseMinutes: number;
concurrentCapacity: number;
authorityLimitUsd: number;
escalationAuthority: boolean;
qualityProfile: "strong" | "average" | "overloaded";
available: boolean;
synthetic: true;
}
export interface SimHotel {
id: string;
name: string;
roomCount: number;
floors: number;
starRating: number;


timezone: string;
city: string;
occupancyRate: number;
staffingCondition: StaffingCondition;
rooms: SimRoom[];
staff: SimStaffMember[];
openIssueCount: number;
recurringPatterns: string[];
synthetic: true;
}
const HOTEL_NAMES = [
"The Morrow Hotel",
"Clover House",
"The Aldgate",
"Pemberton Suites",
"The Clifford",
"Harlow Hotel",
"The Whitmore",
"Aspen House",
"The Langford",
"Cedar & Stone Hotel",
];
const STAFF_NAMES = [
"Marcus T.", "Priya S.", "Daniel W.", "Amara K.", "Carlos R.",
"Fatima O.", "James L.", "Elena V.", "Omar H.", "Claire B.",
"Kwame A.", "Nadia P.", "Rashid M.", "Sylvia C.", "Troy N.",
"Ingrid F.", "Deon J.", "Mei Y.", "Patrick G.", "Asha D.",
];
const CITIES = ["New York", "Chicago", "Boston", "Miami", "Atlanta", "Seattle"];
const RECURRING_PATTERNS = [
"Slow hot water in rooms on floor 3",
"Wi-Fi drops in northeast corner rooms",
"Elevator wait times during morning rush",
"Room 214 AC reported twice this week",
"Late breakfast service complaints on weekends",
];
export function generateHotel(seed: number, config: {
roomCount?: number;
occupancyRate?: number;
staffingCondition?: StaffingCondition;
}): SimHotel {
const rng = new SeededRandom(seed);
const roomCount = config.roomCount ?? rng.nextInt(40, 120);
const floors = Math.ceil(roomCount / 20);
const occupancyRate = config.occupancyRate ?? rng.next() * 0.5 + 0.5; // 50–100%
const staffingCondition = config.staffingCondition ?? rng.pick(["normal", "reduced",


"overloaded"] as StaffingCondition[]);
const rooms = generateRooms(rng, roomCount, floors, occupancyRate);
const staff = generateStaff(rng, staffingCondition);
const patternCount = rng.nextInt(0, 3);
const recurringPatterns = rng.shuffle(RECURRING_PATTERNS).slice(0, patternCount);
return {
id: `sim-hotel-${seed}`,
name: rng.pick(HOTEL_NAMES),
roomCount,
floors,
starRating: rng.nextInt(3, 5),
timezone: "America/New_York",
city: rng.pick(CITIES),
occupancyRate: Math.round(occupancyRate * 100) / 100,
staffingCondition,
rooms,
staff,
openIssueCount: rng.nextInt(0, 5),
recurringPatterns,
synthetic: true,
};
}
function generateRooms(rng: SeededRandom, count: number, floors: number, occupancyRate:
number): SimRoom[] {
const rooms: SimRoom[] = [];
for (let i = 1; i <= count; i++) {
const floor = Math.ceil(i / Math.ceil(count / floors));
const roomType: RoomType = i % 20 === 0 ? "suite"
: i % 10 === 0 ? "accessible"
: i % 3 === 0 ? "deluxe"
: "standard";
let status: RoomStatus = "available";
const rand = rng.next();
if (rand < occupancyRate) status = "occupied";
else if (rand < occupancyRate + 0.03) status = "out_of_order";
else if (rand < occupancyRate + 0.05) status = "maintenance";
rooms.push({
id: `sim-room-${i}`,
roomNumber: `${floor}${String(i % 20 || 20).padStart(2, "0")}`,
floor,
roomType,
status,
synthetic: true,
});
}


return rooms;
}
function generateStaff(rng: SeededRandom, condition: StaffingCondition):
SimStaffMember[] {
const staffList: SimStaffMember[] = [];
const shuffledNames = rng.shuffle(STAFF_NAMES);
let nameIndex = 0;
const departments = [
{ role: "front_desk" as const, department: "Front Desk", count: condition ===
"reduced" ? 1 : 2 },
{ role: "engineering" as const, department: "Engineering", count: condition ===
"reduced" ? 1 : 2 },
{ role: "housekeeping" as const, department: "Housekeeping", count: condition ===
"overloaded" ? 1 : 3 },
{ role: "fb" as const, department: "Food & Beverage", count: 1 },
{ role: "security" as const, department: "Security", count: 1 },
{ role: "manager" as const, department: "Management", count: 1 },
];
const shifts = [
{ start: "07:00", end: "15:00" },
{ start: "15:00", end: "23:00" },
{ start: "23:00", end: "07:00" },
];
departments.forEach(({ role, department, count }) => {
for (let i = 0; i < count; i++) {
const shift = shifts[i % shifts.length];
const qualityProfile = condition === "overloaded"
? rng.pick(["average", "overloaded"] as const)
: rng.pick(["strong", "average"] as const);
staffList.push({
id: `sim-staff-${nameIndex}`,
name: shuffledNames[nameIndex % shuffledNames.length],
role,
department,
shiftStart: shift.start,
shiftEnd: shift.end,
avgResponseMinutes: role === "manager" ? 5
: qualityProfile === "strong" ? 6
: qualityProfile === "overloaded" ? 18
: 10,
concurrentCapacity: qualityProfile === "overloaded" ? 5 : 3,
authorityLimitUsd: role === "manager" ? 500 : role === "front_desk" ? 50 : 0,
escalationAuthority: role === "manager",
qualityProfile,
available: rng.nextBool(condition === "reduced" ? 0.7 : 0.9),
synthetic: true,


});
nameIndex++;
}
});
return staffList;
}


