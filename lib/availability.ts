import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { BookingStatus, MaintenanceStatus, VehicleStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import { addMinutes } from "@/lib/overlap";
import { zonedParts } from "@/lib/time";

const blockingBookingStatuses: BookingStatus[]=[BookingStatus.PENDING_PAYMENT,BookingStatus.PAID,BookingStatus.CONFIRMED,BookingStatus.IN_PROGRESS];
const unavailableVehicleStatuses: VehicleStatus[]=[VehicleStatus.UNAVAILABLE,VehicleStatus.INACTIVE,VehicleStatus.MAINTENANCE];
type DbClient = typeof prisma | Prisma.TransactionClient;

export async function getRentalPeriod(vehicleId:string,rentalPackageId:string,start:Date){
  const [pkg,settings,vehicle]=await Promise.all([
    prisma.rentalPackage.findFirst({where:{id:rentalPackageId,vehicleId,active:true}}),
    prisma.businessSetting.findUnique({where:{id:"default"}}),
    prisma.vehicle.findUnique({where:{id:vehicleId},include:{location:true}})
  ]);
  if(!pkg) throw new Error("INVALID_RENTAL_PACKAGE");
  if(!vehicle || !vehicle.active || unavailableVehicleStatuses.includes(vehicle.status)) throw new Error("VEHICLE_UNAVAILABLE");
  const end=addMinutes(start,pkg.durationMinutes);
  return {pkg,vehicle,settings,end};
}

export async function checkAvailability(vehicleId:string,start:Date,end:Date,ignoreHoldId?:string,db:DbClient=prisma,ignoreBookingId?:string){
  const settings=await db.businessSetting.findUnique({where:{id:"default"}});
  const buffer=settings?.turnaroundMinutes ?? 30;
  const bufferedStart=addMinutes(start,-buffer), bufferedEnd=addMinutes(end,buffer);
  const now=new Date();
  const [booking,hold,block,maintenance]=await Promise.all([
    db.booking.findFirst({where:{vehicleId,id:ignoreBookingId?{not:ignoreBookingId}:undefined,status:{in:blockingBookingStatuses},startAt:{lt:bufferedEnd},endAt:{gt:bufferedStart}},select:{reference:true,startAt:true,endAt:true}}),
    db.bookingHold.findFirst({where:{vehicleId,status:BookingStatus.HOLD,expiresAt:{gt:now},id:ignoreHoldId?{not:ignoreHoldId}:undefined,startAt:{lt:bufferedEnd},endAt:{gt:bufferedStart}},select:{id:true,expiresAt:true}}),
    db.availabilityBlock.findFirst({where:{vehicleId,active:true,startAt:{lt:bufferedEnd},endAt:{gt:bufferedStart}},select:{id:true,reason:true}}),
    db.maintenanceRecord.findFirst({where:{vehicleId,status:{in:[MaintenanceStatus.SCHEDULED,MaintenanceStatus.IN_PROGRESS]},startAt:{lt:bufferedEnd},endAt:{gt:bufferedStart}},select:{id:true,type:true}})
  ]);
  if(booking) return {available:false as const,reason:"VEHICLE_ALREADY_RESERVED"};
  if(hold) return {available:false as const,reason:"VEHICLE_TEMPORARILY_HELD"};
  if(block) return {available:false as const,reason:"VEHICLE_BLOCKED"};
  if(maintenance) return {available:false as const,reason:"VEHICLE_MAINTENANCE"};
  return {available:true as const};
}

export async function validateLeadTime(start:Date){
  const settings=await prisma.businessSetting.findUnique({where:{id:"default"}});
  const minLead=settings?.minimumLeadMinutes ?? 120;
  const maxDays=settings?.maximumAdvanceDays ?? 365;
  const now=new Date();
  if(start.getTime() < now.getTime()+minLead*60_000) throw new Error("MINIMUM_LEAD_TIME");
  if(start.getTime() > now.getTime()+maxDays*86_400_000) throw new Error("TOO_FAR_IN_ADVANCE");
}

export async function validateBusinessHours(locationId:string,start:Date,end:Date){
  const location=await prisma.location.findUnique({where:{id:locationId},include:{businessHours:true,specialHours:true}});
  if(!location) throw new Error("INVALID_LOCATION");
  for(const dt of [start,end]){
    const lp=zonedParts(dt,location.timezone);
    const special=location.specialHours.find(x=>x.date.toISOString().slice(0,10)===lp.date);
    const schedule=special ?? location.businessHours.find(x=>x.dayOfWeek===lp.dayOfWeek);
    if(!schedule || schedule.closed || schedule.openMinute==null || schedule.closeMinute==null || lp.minuteOfDay<schedule.openMinute || lp.minuteOfDay>schedule.closeMinute) throw new Error("OUTSIDE_BUSINESS_HOURS");
  }
}
