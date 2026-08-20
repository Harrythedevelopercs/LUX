import { z } from "zod";
const localDate=z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const localTime=z.string().regex(/^\d{2}:\d{2}$/);
export const availabilitySchema=z.object({vehicleId:z.string().min(1),rentalPackageId:z.string().min(1),localDate,localTime});
export const checkoutSchema=z.object({
  vehicleId:z.string().min(1),rentalPackageId:z.string().min(1),localDate,localTime,pickupLocationId:z.string().min(1),returnLocationId:z.string().min(1),
  addOnIds:z.array(z.string()).default([]),promoCode:z.string().trim().optional(),notes:z.string().max(1000).optional(),
  customer:z.object({firstName:z.string().min(1).max(80),lastName:z.string().min(1).max(80),email:z.string().email(),phone:z.string().min(7).max(40)}),
  driver:z.object({dateOfBirth:localDate,licenseNumber:z.string().min(3).max(100),licenseIssuer:z.string().min(2).max(100),licenseExpiresAt:localDate,insuranceProvider:z.string().max(120).optional(),insurancePolicyNumber:z.string().max(120).optional()}),
  agreementVersion:z.string().default("draft-v1")
});
