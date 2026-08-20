import { NextResponse } from "next/server";
import { z } from "zod";
import { BookingStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { checkAvailability } from "@/lib/availability";

const operationalStatuses=[
  BookingStatus.CONFIRMED,
  BookingStatus.IN_PROGRESS,
  BookingStatus.COMPLETED,
  BookingStatus.CANCELLED,
  BookingStatus.NO_SHOW
] as const;

export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}){
  try{
    const actor=await requireAdmin();
    const {id}=await params;
    const input=z.object({
      status:z.enum(operationalStatuses),
      internalNotes:z.string().max(3000).optional()
    }).parse(await req.json());

    const result=await prisma.$transaction(async tx=>{
      const before=await tx.booking.findUnique({where:{id},include:{hold:true}});
      if(!before) throw new Error("NOT_FOUND");

      if(input.status===BookingStatus.CONFIRMED){
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${before.vehicleId}))`;
        const availability=await checkAvailability(before.vehicleId,before.startAt,before.endAt,before.holdId??undefined,tx,before.id);
        if(!availability.available) throw new Error(availability.reason);
      }

      const after=await tx.booking.update({
        where:{id},
        data:{
          status:input.status,
          internalNotes:input.internalNotes,
          cancelledAt:input.status===BookingStatus.CANCELLED?new Date():input.status===BookingStatus.CONFIRMED?null:undefined
        }
      });

      if(before.holdId&&input.status===BookingStatus.CANCELLED){
        await tx.bookingHold.updateMany({where:{id:before.holdId},data:{status:BookingStatus.EXPIRED}});
      }else if(before.holdId&&input.status===BookingStatus.CONFIRMED){
        await tx.bookingHold.updateMany({where:{id:before.holdId},data:{status:BookingStatus.CONFIRMED}});
      }

      await tx.auditLog.create({
        data:{
          actorId:actor.id,
          action:"BOOKING_UPDATE",
          entityType:"Booking",
          entityId:id,
          before:{status:before.status,internalNotes:before.internalNotes},
          after:{status:after.status,internalNotes:after.internalNotes}
        }
      });
      return after;
    });

    return NextResponse.json({ok:true,booking:result});
  }catch(error){
    const message=error instanceof Error?error.message:"INVALID";
    const status=message==="NOT_FOUND"?404:message==="UNAUTHORIZED"?401:400;
    return NextResponse.json({message},{status});
  }
}
