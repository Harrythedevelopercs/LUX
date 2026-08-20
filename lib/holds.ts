import "server-only";
import { BookingStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import { checkAvailability } from "@/lib/availability";
import { addMinutes } from "@/lib/overlap";

export async function createBookingHold(vehicleId:string,startAt:Date,endAt:Date,fingerprint?:string){
  const settings=await prisma.businessSetting.findUnique({where:{id:"default"}});
  const expiresAt=addMinutes(new Date(),Math.max(31,settings?.holdMinutes??30));
  return prisma.$transaction(async tx=>{
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${vehicleId}))`;
    const availability=await checkAvailability(vehicleId,startAt,endAt,undefined,tx);
    if(!availability.available) throw new Error(availability.reason);
    return tx.bookingHold.create({data:{vehicleId,startAt,endAt,expiresAt,status:BookingStatus.HOLD,fingerprint}});
  });
}

export async function expireOldHolds(){
  const expired=await prisma.bookingHold.findMany({where:{status:BookingStatus.HOLD,expiresAt:{lt:new Date()}},select:{id:true}});
  if(!expired.length) return {count:0};
  const ids=expired.map(x=>x.id);
  await prisma.$transaction([
    prisma.booking.updateMany({where:{holdId:{in:ids},status:BookingStatus.PENDING_PAYMENT},data:{status:BookingStatus.EXPIRED}}),
    prisma.bookingHold.updateMany({where:{id:{in:ids}},data:{status:BookingStatus.EXPIRED}})
  ]);
  return {count:ids.length};
}
