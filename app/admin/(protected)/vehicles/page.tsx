import {prisma} from "@/lib/db";
import {FleetEditor} from "./FleetEditor";

export const dynamic = "force-dynamic";

export default async function Vehicles(){
  const rows = await prisma.vehicle.findMany({
    include: {
      rentalPackages: {orderBy: {displayOrder: "asc"}},
      location: true
    }
  });

  return (
    <>
      <div className="eyebrow">Fleet management</div>
      <h1>Vehicles & pricing</h1>
      <p className="muted">Status and rental-package prices below are live database values. Changes are audit logged.</p>
      <FleetEditor vehicles={rows.map(v=>({
        id: v.id,
        name: `${v.year} ${v.make} ${v.model}`,
        color: v.color,
        status: v.status,
        location: v.location.name,
        packages: v.rentalPackages.map(p=>({id:p.id,title:p.title,priceCents:p.priceCents}))
      }))}/>
    </>
  );
}

