import "server-only";
import { DiscountType, PriceType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import { percentOf } from "@/lib/money";

export async function calculatePrice(input:{vehicleId:string;rentalPackageId:string;addOnIds:string[];promoCode?:string}){
  const uniqueAddOnIds=[...new Set(input.addOnIds)];
  const [vehicle,pkg,settings,taxes,fees,addons]=await Promise.all([
    prisma.vehicle.findUnique({where:{id:input.vehicleId}}),
    prisma.rentalPackage.findFirst({where:{id:input.rentalPackageId,vehicleId:input.vehicleId,active:true}}),
    prisma.businessSetting.findUnique({where:{id:"default"}}),
    prisma.taxRule.findMany({where:{active:true}}),
    prisma.feeRule.findMany({where:{active:true}}),
    prisma.addOn.findMany({where:{id:{in:uniqueAddOnIds},active:true,vehicles:{some:{vehicleId:input.vehicleId}}}})
  ]);
  if(!vehicle||!pkg) throw new Error("INVALID_PRICE_CONFIGURATION");
  if(addons.length!==uniqueAddOnIds.length) throw new Error("INVALID_ADDON");
  const addOnLines=addons.map(a=>{
    let multiplier=1;
    if(a.priceType===PriceType.PER_DAY) multiplier=Math.ceil(pkg.durationMinutes/1440);
    else if(a.priceType===PriceType.PER_HOUR) multiplier=Math.ceil(pkg.durationMinutes/60);
    return {addOnId:a.id,quantity:1,unitCents:a.priceCents,totalCents:a.priceCents*multiplier,name:a.name};
  });
  const addOnCents=addOnLines.reduce((sum,a)=>sum+a.totalCents,0);
  const base=pkg.priceCents+addOnCents;
  let discountCents=0;
  if(input.promoCode){
    const now=new Date();
    const promo=await prisma.promoCode.findUnique({where:{code:input.promoCode.toUpperCase()},include:{vehicleRules:true,packageRules:true,_count:{select:{redemptions:true}}}});
    const valid=promo&&promo.active&&(!promo.startsAt||promo.startsAt<=now)&&(!promo.expiresAt||promo.expiresAt>=now)&&(!promo.minimumBookingCents||base>=promo.minimumBookingCents)&&(!promo.maxRedemptions||promo._count.redemptions<promo.maxRedemptions);
    if(!valid) throw new Error("INVALID_PROMO_CODE");
    const vehicleAllowed=!promo.vehicleRules.length||promo.vehicleRules.some(r=>r.vehicleId===input.vehicleId);
    const packageAllowed=!promo.packageRules.length||promo.packageRules.some(r=>r.rentalPackageId===input.rentalPackageId);
    if(!vehicleAllowed||!packageAllowed) throw new Error("PROMO_NOT_APPLICABLE");
    discountCents=promo.type===DiscountType.PERCENTAGE?percentOf(base,promo.amount):Math.min(base,promo.amount);
  }
  const taxable=Math.max(0,base-discountCents);
  const taxCents=taxes.reduce((sum,t)=>sum+Math.round(taxable*t.percentBp/10_000),0);
  const feeCents=fees.reduce((sum,f)=>sum+(f.type===DiscountType.PERCENTAGE?Math.round(taxable*f.amount/100):f.amount),0);
  const totalCents=taxable+taxCents+feeCents;
  const depositPercent=settings?.depositPercent ?? 25;
  const dueTodayCents=percentOf(totalCents,depositPercent);
  return {subtotalCents:pkg.priceCents,addOnCents,addOnLines,discountCents,taxCents,feeCents,totalCents,dueTodayCents,securityDepositCents:vehicle.securityDepositCents,currency:settings?.currency??"USD"};
}
