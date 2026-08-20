import { NextResponse } from "next/server";
import { headers } from "next/headers";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { BookingStatus, NotificationChannel, NotificationStatus, PaymentStatus } from "@/generated/prisma/enums";
import { sendBookingEmail } from "@/lib/email";
import { checkAvailability } from "@/lib/availability";

async function confirmPaidSession(session:Stripe.Checkout.Session){
  const bookingId=session.metadata?.bookingId;
  if(!bookingId) return;

  let shouldEmail=false;
  await prisma.$transaction(async tx=>{
    const booking=await tx.booking.findUnique({where:{id:bookingId},include:{hold:true}});
    if(!booking||booking.status!==BookingStatus.PENDING_PAYMENT) return;
    if(!booking.hold||booking.hold.expiresAt<new Date()||booking.hold.status!==BookingStatus.HOLD) throw new Error("PAID_SESSION_FOR_EXPIRED_HOLD");

    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${booking.vehicleId}))`;
    const availability=await checkAvailability(booking.vehicleId,booking.startAt,booking.endAt,booking.hold.id,tx,booking.id);
    if(!availability.available) throw new Error(`PAYMENT_CONFLICT_${availability.reason}`);

    const payment=await tx.payment.findFirst({where:{bookingId,stripeCheckoutSessionId:session.id}});
    if(!payment) throw new Error("PAYMENT_RECORD_MISSING");

    if(payment.status!==PaymentStatus.PAID){
      await tx.payment.update({where:{id:payment.id},data:{status:PaymentStatus.PAID,stripePaymentIntentId:typeof session.payment_intent==="string"?session.payment_intent:undefined}});
    }

    const paid=payment.amountCents;
    await tx.booking.update({
      where:{id:bookingId},
      data:{
        status:BookingStatus.CONFIRMED,
        paymentStatus:paid>=booking.totalCents?PaymentStatus.PAID:PaymentStatus.PARTIALLY_PAID,
        amountPaidCents:paid,
        amountDueCents:Math.max(0,booking.totalCents-paid)
      }
    });
    await tx.bookingHold.update({where:{id:booking.hold.id},data:{status:BookingStatus.CONFIRMED}});

    if(booking.promoCode){
      const promo=await tx.promoCode.findUnique({where:{code:booking.promoCode}});
      if(promo) await tx.promoRedemption.upsert({where:{bookingId:booking.id},update:{},create:{promoCodeId:promo.id,customerId:booking.customerId,bookingId:booking.id}});
    }
    shouldEmail=true;
  });

  if(shouldEmail){
    const booking=await prisma.booking.findUnique({where:{id:bookingId}});
    if(booking?.guestEmail){
      try{
        const sent=await sendBookingEmail({to:booking.guestEmail,subject:`Reservation confirmed — ${booking.reference}`,html:`<h1>Reservation confirmed</h1><p>Reference: ${booking.reference}</p>`,idempotencyKey:`booking-confirmed-${booking.reference}`});
        await prisma.notification.create({data:{bookingId:booking.id,channel:NotificationChannel.EMAIL,template:"booking-confirmed",recipient:booking.guestEmail,status:NotificationStatus.SENT,providerId:sent.id,sentAt:new Date()}});
      }catch(error){
        console.error("Booking confirmation email failed",error);
        await prisma.notification.create({data:{bookingId:booking.id,channel:NotificationChannel.EMAIL,template:"booking-confirmed",recipient:booking.guestEmail,status:NotificationStatus.FAILED,error:error instanceof Error?error.message:"EMAIL_FAILED"}}).catch(()=>{});
      }
    }
  }
}

async function expireSessionBooking(session:Stripe.Checkout.Session,paymentFailed=false){
  const bookingId=session.metadata?.bookingId;
  if(!bookingId) return;
  const booking=await prisma.booking.findUnique({where:{id:bookingId}});
  if(!booking||booking.status!==BookingStatus.PENDING_PAYMENT) return;
  await prisma.$transaction([
    prisma.booking.update({where:{id:bookingId},data:{status:BookingStatus.EXPIRED,paymentStatus:paymentFailed?PaymentStatus.FAILED:booking.paymentStatus}}),
    ...(booking.holdId?[prisma.bookingHold.updateMany({where:{id:booking.holdId},data:{status:BookingStatus.EXPIRED}})]:[]),
    ...(paymentFailed?[prisma.payment.updateMany({where:{bookingId,stripeCheckoutSessionId:session.id,status:PaymentStatus.UNPAID},data:{status:PaymentStatus.FAILED}})]:[])
  ]);
}

export async function POST(req:Request){
  if(!stripe||!process.env.STRIPE_WEBHOOK_SECRET) return NextResponse.json({error:"Stripe not configured"},{status:503});
  const body=await req.text();
  const signature=(await headers()).get("stripe-signature");
  if(!signature) return NextResponse.json({error:"Missing signature"},{status:400});

  let event:Stripe.Event;
  try{
    event=stripe.webhooks.constructEvent(body,signature,process.env.STRIPE_WEBHOOK_SECRET);
  }catch{
    return NextResponse.json({error:"Invalid signature"},{status:400});
  }

  try{
    if(event.type==="checkout.session.completed"){
      const session=event.data.object;
      if(session.payment_status==="paid") await confirmPaidSession(session);
    }else if(event.type==="checkout.session.async_payment_succeeded"){
      await confirmPaidSession(event.data.object);
    }else if(event.type==="checkout.session.async_payment_failed"){
      await expireSessionBooking(event.data.object,true);
    }else if(event.type==="checkout.session.expired"){
      await expireSessionBooking(event.data.object,false);
    }
    return NextResponse.json({received:true});
  }catch(error){
    console.error(error);
    return NextResponse.json({error:"Webhook processing failed"},{status:500});
  }
}
