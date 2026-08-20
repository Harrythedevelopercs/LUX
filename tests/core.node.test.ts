import test from "node:test";
import assert from "node:assert/strict";
import { intervalsOverlap, addMinutes } from "../lib/overlap";
import { zonedLocalToUtc, zonedParts } from "../lib/time";
import { ageOnLocalDate, validateDriverAge, dateOnlyToUtc } from "../lib/eligibility";
import { percentOf } from "../lib/money";


test("overlap and turnaround boundaries",()=>{
  const start=new Date("2026-08-20T21:00:00Z");
  const end=new Date("2026-08-21T01:00:00Z");
  assert.equal(intervalsOverlap(new Date("2026-08-20T22:00:00Z"),new Date("2026-08-20T23:00:00Z"),start,end),true);
  assert.equal(intervalsOverlap(end,new Date("2026-08-21T02:00:00Z"),start,end),false);
  const bufferedEnd=addMinutes(end,30);
  assert.equal(intervalsOverlap(end,new Date("2026-08-21T02:00:00Z"),start,bufferedEnd),true);
  assert.equal(intervalsOverlap(bufferedEnd,new Date("2026-08-21T03:00:00Z"),start,bufferedEnd),false);
});

test("Los Angeles local pickup converts to UTC and round trips",()=>{
  const utc=zonedLocalToUtc("2026-08-20","14:00","America/Los_Angeles");
  assert.equal(utc.toISOString(),"2026-08-20T21:00:00.000Z");
  assert.deepEqual(zonedParts(utc,"America/Los_Angeles"),{date:"2026-08-20",dayOfWeek:4,minuteOfDay:840});
});

test("nonexistent DST local time is rejected",()=>{
  assert.throws(()=>zonedLocalToUtc("2026-03-08","02:30","America/Los_Angeles"),/INVALID_LOCAL_DATETIME/);
});

test("driver age is based on rental local calendar date, not UTC",()=>{
  assert.equal(ageOnLocalDate("2001-08-21","2026-08-20"),24);
  assert.throws(()=>validateDriverAge("2001-08-21","2026-08-20",25),/DRIVER_BELOW_MINIMUM_AGE/);
  assert.equal(ageOnLocalDate("2001-08-21","2026-08-21"),25);
});

test("licence/date-only storage conversion preserves date",()=>{
  assert.equal(dateOnlyToUtc("2026-08-20").toISOString(),"2026-08-20T00:00:00.000Z");
  assert.throws(()=>dateOnlyToUtc("2026-02-30"),/INVALID_DATE/);
});

test("integer-cent percentage calculation",()=>{
  assert.equal(percentOf(84142,25),21036);
});
