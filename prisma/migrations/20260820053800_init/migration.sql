-- Initial PostgreSQL schema for Apex Exotic Rentals.
-- Generated to match prisma/schema.prisma so production can use `prisma migrate deploy`.

CREATE TYPE "UserRole" AS ENUM ('CUSTOMER','SUPER_ADMIN','ADMIN','MANAGER','STAFF');
CREATE TYPE "VehicleStatus" AS ENUM ('AVAILABLE','RENTED','RESERVED','MAINTENANCE','UNAVAILABLE','INACTIVE');
CREATE TYPE "BookingStatus" AS ENUM ('DRAFT','HOLD','PENDING_PAYMENT','PAID','CONFIRMED','IN_PROGRESS','COMPLETED','CANCELLED','REFUNDED','EXPIRED','NO_SHOW');
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID','PARTIALLY_PAID','PAID','REFUNDED','PARTIALLY_REFUNDED','FAILED');
CREATE TYPE "PaymentKind" AS ENUM ('RENTAL','DEPOSIT','SECURITY_DEPOSIT','BALANCE','REFUND');
CREATE TYPE "PaymentProvider" AS ENUM ('STRIPE','MANUAL');
CREATE TYPE "PriceType" AS ENUM ('FIXED','PER_RENTAL','PER_DAY','PER_HOUR','PER_UNIT');
CREATE TYPE "DiscountType" AS ENUM ('FIXED','PERCENTAGE');
CREATE TYPE "AvailabilityBlockType" AS ENUM ('MANUAL','MAINTENANCE','PREP','OTHER');
CREATE TYPE "DocumentType" AS ENUM ('DRIVER_LICENSE_FRONT','DRIVER_LICENSE_BACK','INSURANCE','OTHER');
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL','SMS');
CREATE TYPE "NotificationStatus" AS ENUM ('QUEUED','SENT','FAILED');
CREATE TYPE "MaintenanceStatus" AS ENUM ('SCHEDULED','IN_PROGRESS','COMPLETED','CANCELLED');
CREATE TYPE "AgreementStatus" AS ENUM ('ACCEPTED','REVOKED');

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT,
  "role" "UserRole" NOT NULL DEFAULT 'CUSTOMER',
  "firstName" TEXT,
  "lastName" TEXT,
  "phone" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Session" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CustomerProfile" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "dateOfBirth" TIMESTAMP(3),
  "address1" TEXT,
  "address2" TEXT,
  "city" TEXT,
  "state" TEXT,
  "postalCode" TEXT,
  "country" TEXT,
  "licenseNumber" TEXT,
  "licenseIssuer" TEXT,
  "licenseExpiresAt" TIMESTAMP(3),
  "insuranceProvider" TEXT,
  "insurancePolicyNumber" TEXT,
  "emergencyContactName" TEXT,
  "emergencyContactPhone" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CustomerProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdminProfile" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "jobTitle" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AdminProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Location" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "address1" TEXT NOT NULL,
  "address2" TEXT,
  "city" TEXT NOT NULL,
  "state" TEXT NOT NULL,
  "postalCode" TEXT NOT NULL,
  "country" TEXT NOT NULL DEFAULT 'US',
  "latitude" DECIMAL(9,6),
  "longitude" DECIMAL(9,6),
  "phone" TEXT,
  "timezone" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BusinessHour" (
  "id" TEXT NOT NULL,
  "locationId" TEXT NOT NULL,
  "dayOfWeek" INTEGER NOT NULL,
  "openMinute" INTEGER,
  "closeMinute" INTEGER,
  "closed" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "BusinessHour_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SpecialHour" (
  "id" TEXT NOT NULL,
  "locationId" TEXT NOT NULL,
  "date" DATE NOT NULL,
  "openMinute" INTEGER,
  "closeMinute" INTEGER,
  "closed" BOOLEAN NOT NULL DEFAULT false,
  "note" TEXT,
  CONSTRAINT "SpecialHour_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VehicleCategory" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  CONSTRAINT "VehicleCategory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Vehicle" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "make" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "trim" TEXT,
  "year" INTEGER NOT NULL,
  "color" TEXT NOT NULL,
  "status" "VehicleStatus" NOT NULL DEFAULT 'AVAILABLE',
  "vin" TEXT,
  "licensePlate" TEXT,
  "transmission" TEXT,
  "seats" INTEGER,
  "doors" INTEGER,
  "horsepower" INTEGER,
  "engine" TEXT,
  "bodyStyle" TEXT,
  "minimumAge" INTEGER NOT NULL DEFAULT 25,
  "includedMileage" INTEGER,
  "extraMileageCents" INTEGER,
  "securityDepositCents" INTEGER NOT NULL DEFAULT 0,
  "description" TEXT,
  "featured" BOOLEAN NOT NULL DEFAULT false,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "locationId" TEXT NOT NULL,
  "categoryId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VehicleImage" (
  "id" TEXT NOT NULL,
  "vehicleId" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "alt" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "hero" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "VehicleImage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RentalPackage" (
  "id" TEXT NOT NULL,
  "vehicleId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "durationMinutes" INTEGER NOT NULL,
  "priceCents" INTEGER NOT NULL,
  "includedMileage" INTEGER,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "displayOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "RentalPackage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AddOn" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "priceType" "PriceType" NOT NULL,
  "priceCents" INTEGER NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AddOn_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VehicleAddOn" (
  "vehicleId" TEXT NOT NULL,
  "addOnId" TEXT NOT NULL,
  CONSTRAINT "VehicleAddOn_pkey" PRIMARY KEY ("vehicleId","addOnId")
);

CREATE TABLE "Booking" (
  "id" TEXT NOT NULL,
  "reference" TEXT NOT NULL,
  "customerId" TEXT,
  "guestEmail" TEXT,
  "guestFirstName" TEXT,
  "guestLastName" TEXT,
  "guestPhone" TEXT,
  "vehicleId" TEXT NOT NULL,
  "rentalPackageId" TEXT NOT NULL,
  "pickupLocationId" TEXT NOT NULL,
  "returnLocationId" TEXT NOT NULL,
  "startAt" TIMESTAMP(3) NOT NULL,
  "endAt" TIMESTAMP(3) NOT NULL,
  "timezone" TEXT NOT NULL,
  "subtotalCents" INTEGER NOT NULL,
  "addOnCents" INTEGER NOT NULL DEFAULT 0,
  "discountCents" INTEGER NOT NULL DEFAULT 0,
  "taxCents" INTEGER NOT NULL DEFAULT 0,
  "feeCents" INTEGER NOT NULL DEFAULT 0,
  "securityDepositCents" INTEGER NOT NULL DEFAULT 0,
  "totalCents" INTEGER NOT NULL,
  "amountPaidCents" INTEGER NOT NULL DEFAULT 0,
  "amountDueCents" INTEGER NOT NULL,
  "status" "BookingStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
  "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
  "promoCode" TEXT,
  "customerNotes" TEXT,
  "internalNotes" TEXT,
  "cancelledAt" TIMESTAMP(3),
  "holdId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BookingDriver" (
  "id" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "dateOfBirth" TIMESTAMP(3) NOT NULL,
  "licenseNumber" TEXT NOT NULL,
  "licenseIssuer" TEXT NOT NULL,
  "licenseExpiresAt" TIMESTAMP(3) NOT NULL,
  "insuranceProvider" TEXT,
  "insurancePolicyNumber" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BookingDriver_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BookingHold" (
  "id" TEXT NOT NULL,
  "vehicleId" TEXT NOT NULL,
  "startAt" TIMESTAMP(3) NOT NULL,
  "endAt" TIMESTAMP(3) NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "status" "BookingStatus" NOT NULL DEFAULT 'HOLD',
  "fingerprint" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BookingHold_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BookingAddOn" (
  "id" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "addOnId" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "unitCents" INTEGER NOT NULL,
  "totalCents" INTEGER NOT NULL,
  CONSTRAINT "BookingAddOn_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Payment" (
  "id" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "provider" "PaymentProvider" NOT NULL,
  "kind" "PaymentKind" NOT NULL,
  "status" "PaymentStatus" NOT NULL,
  "amountCents" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "stripeCustomerId" TEXT,
  "stripePaymentIntentId" TEXT,
  "stripeCheckoutSessionId" TEXT,
  "externalReference" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Refund" (
  "id" TEXT NOT NULL,
  "paymentId" TEXT NOT NULL,
  "amountCents" INTEGER NOT NULL,
  "providerRefundId" TEXT,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AvailabilityBlock" (
  "id" TEXT NOT NULL,
  "vehicleId" TEXT NOT NULL,
  "type" "AvailabilityBlockType" NOT NULL,
  "startAt" TIMESTAMP(3) NOT NULL,
  "endAt" TIMESTAMP(3) NOT NULL,
  "reason" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AvailabilityBlock_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MaintenanceRecord" (
  "id" TEXT NOT NULL,
  "vehicleId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "startAt" TIMESTAMP(3) NOT NULL,
  "endAt" TIMESTAMP(3) NOT NULL,
  "notes" TEXT,
  "status" "MaintenanceStatus" NOT NULL DEFAULT 'SCHEDULED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MaintenanceRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PromoCode" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "type" "DiscountType" NOT NULL,
  "amount" INTEGER NOT NULL,
  "minimumBookingCents" INTEGER,
  "startsAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "maxRedemptions" INTEGER,
  "perCustomerLimit" INTEGER,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PromoCode_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PromoRedemption" (
  "id" TEXT NOT NULL,
  "promoCodeId" TEXT NOT NULL,
  "customerId" TEXT,
  "bookingId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PromoRedemption_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PromoVehicleRule" (
  "promoCodeId" TEXT NOT NULL,
  "vehicleId" TEXT NOT NULL,
  CONSTRAINT "PromoVehicleRule_pkey" PRIMARY KEY ("promoCodeId","vehicleId")
);

CREATE TABLE "PromoPackageRule" (
  "promoCodeId" TEXT NOT NULL,
  "rentalPackageId" TEXT NOT NULL,
  CONSTRAINT "PromoPackageRule_pkey" PRIMARY KEY ("promoCodeId","rentalPackageId")
);

CREATE TABLE "DriverDocument" (
  "id" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "type" "DocumentType" NOT NULL,
  "storageKey" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "encrypted" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DriverDocument_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Notification" (
  "id" TEXT NOT NULL,
  "bookingId" TEXT,
  "channel" "NotificationChannel" NOT NULL,
  "template" TEXT NOT NULL,
  "recipient" TEXT NOT NULL,
  "status" "NotificationStatus" NOT NULL DEFAULT 'QUEUED',
  "providerId" TEXT,
  "error" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "sentAt" TIMESTAMP(3),
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditLog" (
  "id" TEXT NOT NULL,
  "actorId" TEXT,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "before" JSONB,
  "after" JSONB,
  "ipAddress" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BusinessSetting" (
  "id" TEXT NOT NULL DEFAULT 'default',
  "businessName" TEXT NOT NULL,
  "timezone" TEXT NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "holdMinutes" INTEGER NOT NULL DEFAULT 31,
  "turnaroundMinutes" INTEGER NOT NULL DEFAULT 30,
  "slotMinutes" INTEGER NOT NULL DEFAULT 30,
  "minimumLeadMinutes" INTEGER NOT NULL DEFAULT 120,
  "maximumAdvanceDays" INTEGER NOT NULL DEFAULT 365,
  "depositPercent" INTEGER NOT NULL DEFAULT 25,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BusinessSetting_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TaxRule" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "percentBp" INTEGER NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TaxRule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FeeRule" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" "DiscountType" NOT NULL,
  "amount" INTEGER NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FeeRule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RentalAgreementAcceptance" (
  "id" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "version" TEXT NOT NULL,
  "status" "AgreementStatus" NOT NULL DEFAULT 'ACCEPTED',
  "ipAddress" TEXT,
  "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RentalAgreementAcceptance_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VehicleHandover" (
  "id" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "pickupOdometer" INTEGER,
  "pickupFuel" TEXT,
  "pickupNotes" TEXT,
  "pickupAt" TIMESTAMP(3),
  "returnOdometer" INTEGER,
  "returnFuel" TEXT,
  "returnNotes" TEXT,
  "returnedAt" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VehicleHandover_pkey" PRIMARY KEY ("id")
);

-- Uniques
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");
CREATE UNIQUE INDEX "CustomerProfile_userId_key" ON "CustomerProfile"("userId");
CREATE UNIQUE INDEX "AdminProfile_userId_key" ON "AdminProfile"("userId");
CREATE UNIQUE INDEX "Location_slug_key" ON "Location"("slug");
CREATE UNIQUE INDEX "BusinessHour_locationId_dayOfWeek_key" ON "BusinessHour"("locationId","dayOfWeek");
CREATE UNIQUE INDEX "SpecialHour_locationId_date_key" ON "SpecialHour"("locationId","date");
CREATE UNIQUE INDEX "VehicleCategory_slug_key" ON "VehicleCategory"("slug");
CREATE UNIQUE INDEX "Vehicle_slug_key" ON "Vehicle"("slug");
CREATE UNIQUE INDEX "Vehicle_vin_key" ON "Vehicle"("vin");
CREATE UNIQUE INDEX "Vehicle_licensePlate_key" ON "Vehicle"("licensePlate");
CREATE UNIQUE INDEX "RentalPackage_vehicleId_durationMinutes_key" ON "RentalPackage"("vehicleId","durationMinutes");
CREATE UNIQUE INDEX "Booking_reference_key" ON "Booking"("reference");
CREATE UNIQUE INDEX "Booking_holdId_key" ON "Booking"("holdId");
CREATE UNIQUE INDEX "BookingDriver_bookingId_key" ON "BookingDriver"("bookingId");
CREATE UNIQUE INDEX "Payment_stripePaymentIntentId_key" ON "Payment"("stripePaymentIntentId");
CREATE UNIQUE INDEX "Payment_stripeCheckoutSessionId_key" ON "Payment"("stripeCheckoutSessionId");
CREATE UNIQUE INDEX "Refund_providerRefundId_key" ON "Refund"("providerRefundId");
CREATE UNIQUE INDEX "PromoCode_code_key" ON "PromoCode"("code");
CREATE UNIQUE INDEX "PromoRedemption_bookingId_key" ON "PromoRedemption"("bookingId");
CREATE UNIQUE INDEX "VehicleHandover_bookingId_key" ON "VehicleHandover"("bookingId");

-- Query indexes
CREATE INDEX "Session_userId_expiresAt_idx" ON "Session"("userId","expiresAt");
CREATE INDEX "Vehicle_locationId_active_status_idx" ON "Vehicle"("locationId","active","status");
CREATE INDEX "VehicleImage_vehicleId_sortOrder_idx" ON "VehicleImage"("vehicleId","sortOrder");
CREATE INDEX "RentalPackage_vehicleId_active_displayOrder_idx" ON "RentalPackage"("vehicleId","active","displayOrder");
CREATE INDEX "Booking_vehicleId_startAt_endAt_status_idx" ON "Booking"("vehicleId","startAt","endAt","status");
CREATE INDEX "Booking_customerId_createdAt_idx" ON "Booking"("customerId","createdAt");
CREATE INDEX "Booking_paymentStatus_status_idx" ON "Booking"("paymentStatus","status");
CREATE INDEX "BookingHold_vehicleId_startAt_endAt_expiresAt_status_idx" ON "BookingHold"("vehicleId","startAt","endAt","expiresAt","status");
CREATE INDEX "BookingAddOn_bookingId_idx" ON "BookingAddOn"("bookingId");
CREATE INDEX "Payment_bookingId_status_idx" ON "Payment"("bookingId","status");
CREATE INDEX "AvailabilityBlock_vehicleId_startAt_endAt_active_idx" ON "AvailabilityBlock"("vehicleId","startAt","endAt","active");
CREATE INDEX "MaintenanceRecord_vehicleId_startAt_endAt_status_idx" ON "MaintenanceRecord"("vehicleId","startAt","endAt","status");
CREATE INDEX "PromoRedemption_promoCodeId_customerId_idx" ON "PromoRedemption"("promoCodeId","customerId");
CREATE INDEX "DriverDocument_customerId_type_idx" ON "DriverDocument"("customerId","type");
CREATE INDEX "Notification_status_createdAt_idx" ON "Notification"("status","createdAt");
CREATE INDEX "AuditLog_entityType_entityId_createdAt_idx" ON "AuditLog"("entityType","entityId","createdAt");
CREATE INDEX "RentalAgreementAcceptance_bookingId_acceptedAt_idx" ON "RentalAgreementAcceptance"("bookingId","acceptedAt");

-- Foreign keys
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CustomerProfile" ADD CONSTRAINT "CustomerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdminProfile" ADD CONSTRAINT "AdminProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BusinessHour" ADD CONSTRAINT "BusinessHour_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SpecialHour" ADD CONSTRAINT "SpecialHour_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "VehicleCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "VehicleImage" ADD CONSTRAINT "VehicleImage_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RentalPackage" ADD CONSTRAINT "RentalPackage_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VehicleAddOn" ADD CONSTRAINT "VehicleAddOn_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VehicleAddOn" ADD CONSTRAINT "VehicleAddOn_addOnId_fkey" FOREIGN KEY ("addOnId") REFERENCES "AddOn"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "CustomerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_rentalPackageId_fkey" FOREIGN KEY ("rentalPackageId") REFERENCES "RentalPackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_pickupLocationId_fkey" FOREIGN KEY ("pickupLocationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_returnLocationId_fkey" FOREIGN KEY ("returnLocationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_holdId_fkey" FOREIGN KEY ("holdId") REFERENCES "BookingHold"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BookingDriver" ADD CONSTRAINT "BookingDriver_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BookingHold" ADD CONSTRAINT "BookingHold_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BookingAddOn" ADD CONSTRAINT "BookingAddOn_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BookingAddOn" ADD CONSTRAINT "BookingAddOn_addOnId_fkey" FOREIGN KEY ("addOnId") REFERENCES "AddOn"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AvailabilityBlock" ADD CONSTRAINT "AvailabilityBlock_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MaintenanceRecord" ADD CONSTRAINT "MaintenanceRecord_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PromoRedemption" ADD CONSTRAINT "PromoRedemption_promoCodeId_fkey" FOREIGN KEY ("promoCodeId") REFERENCES "PromoCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PromoVehicleRule" ADD CONSTRAINT "PromoVehicleRule_promoCodeId_fkey" FOREIGN KEY ("promoCodeId") REFERENCES "PromoCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PromoVehicleRule" ADD CONSTRAINT "PromoVehicleRule_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PromoPackageRule" ADD CONSTRAINT "PromoPackageRule_promoCodeId_fkey" FOREIGN KEY ("promoCodeId") REFERENCES "PromoCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PromoPackageRule" ADD CONSTRAINT "PromoPackageRule_rentalPackageId_fkey" FOREIGN KEY ("rentalPackageId") REFERENCES "RentalPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DriverDocument" ADD CONSTRAINT "DriverDocument_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "CustomerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RentalAgreementAcceptance" ADD CONSTRAINT "RentalAgreementAcceptance_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VehicleHandover" ADD CONSTRAINT "VehicleHandover_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
