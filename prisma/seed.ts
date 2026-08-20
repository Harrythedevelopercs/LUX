import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { UserRole, VehicleStatus } from "../generated/prisma/enums";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const packages = [
  ["Two Hour Rental",120,66086],["Four Hour Rental",240,84142],["Six Hour Rental",360,102198],
  ["Eight Hour Rental",480,120255],["Twenty-Four Hour Rental",1440,156367],["Two Day Rental",2880,312734],
  ["Three Day Rental",4320,469101],["Four Day Rental",5760,625468],["Five Day Rental",7200,781835],
  ["Six Day Rental",8640,938202],["Seven Day Rental",10080,1094569]
] as const;

async function main(){
  const location = await prisma.location.upsert({
    where:{slug:"main-location"}, update:{},
    create:{name:"Main Rental Location",slug:"main-location",address1:"123 Luxury Drive",city:"Los Angeles",state:"CA",postalCode:"90001",timezone:process.env.DEFAULT_TIMEZONE || "America/Los_Angeles"}
  });
  for(let day=0;day<7;day++) await prisma.businessHour.upsert({
    where:{locationId_dayOfWeek:{locationId:location.id,dayOfWeek:day}}, update:{},
    create:{locationId:location.id,dayOfWeek:day,openMinute:480,closeMinute:1320,closed:false}
  });
  const category = await prisma.vehicleCategory.upsert({where:{slug:"exotic"},update:{},create:{name:"Exotic",slug:"exotic"}});
  const vehicle = await prisma.vehicle.upsert({
    where:{slug:"2023-lamborghini-huracan-evo-spyder-purple"},
    update:{locationId:location.id,categoryId:category.id},
    create:{
      slug:"2023-lamborghini-huracan-evo-spyder-purple", make:"Lamborghini", model:"Huracán EVO Spyder", year:2023, color:"Purple",
      categoryId:category.id, locationId:location.id, status:VehicleStatus.AVAILABLE, featured:true, bodyStyle:"Convertible", transmission:"Automatic",
      seats:2,doors:2,horsepower:630,engine:"5.2L naturally aspirated V10",minimumAge:25,securityDepositCents:250000,includedMileage:100,
      extraMileageCents:499,description:"An open-top V10 exotic built for an unforgettable luxury driving experience."
    }
  });
  await prisma.vehicleImage.deleteMany({where:{vehicleId:vehicle.id}});
  await prisma.vehicleImage.createMany({data:[
    {vehicleId:vehicle.id,url:"https://images.unsplash.com/photo-1621135802920-133df287f89c?auto=format&fit=crop&w=1800&q=85",alt:"Purple exotic sports car",hero:true,sortOrder:0},
    {vehicleId:vehicle.id,url:"https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=1400&q=85",alt:"Luxury sports car detail",sortOrder:1}
  ]});
  for (let i=0;i<packages.length;i++){
    const [title,durationMinutes,priceCents]=packages[i];
    await prisma.rentalPackage.upsert({
      where:{vehicleId_durationMinutes:{vehicleId:vehicle.id,durationMinutes}},
      update:{title,priceCents,active:true,displayOrder:i},
      create:{vehicleId:vehicle.id,title,durationMinutes,priceCents,displayOrder:i}
    });
  }
  await prisma.businessSetting.upsert({where:{id:"default"},update:{},create:{id:"default",businessName:process.env.BUSINESS_NAME||"Apex Exotic Rentals",timezone:process.env.DEFAULT_TIMEZONE||"America/Los_Angeles",holdMinutes:31}});
  for (const addon of [
    {name:"Additional Driver",description:"Add one approved additional driver to the rental.",priceCents:7500},
    {name:"Vehicle Delivery",description:"Delivery request; final service area must be configured by the operator.",priceCents:15000}
  ]){
    let a=await prisma.addOn.findFirst({where:{name:addon.name}});
    if(!a)a=await prisma.addOn.create({data:{...addon,priceType:"PER_RENTAL"}});
    await prisma.vehicleAddOn.upsert({where:{vehicleId_addOnId:{vehicleId:vehicle.id,addOnId:a.id}},update:{},create:{vehicleId:vehicle.id,addOnId:a.id}});
  }
  const email=process.env.DEMO_ADMIN_EMAIL || "admin@example.com";
  const password=process.env.DEMO_ADMIN_PASSWORD || "ChangeMe123!";
  const passwordHash=await bcrypt.hash(password,12);
  await prisma.user.upsert({
    where:{email}, update:{passwordHash,role:UserRole.SUPER_ADMIN,active:true},
    create:{email,passwordHash,role:UserRole.SUPER_ADMIN,firstName:"Demo",lastName:"Admin",admin:{create:{jobTitle:"Owner"}}}
  });
  console.log(`Seeded ${vehicle.year} ${vehicle.make} ${vehicle.model} with ${packages.length} packages.`);
  console.log(`Development admin: ${email}`);
}
main().finally(()=>prisma.$disconnect());
