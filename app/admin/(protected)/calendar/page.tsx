import {prisma} from "@/lib/db";
import {BlockForm} from "./BlockForm";

export const dynamic = "force-dynamic";

export default async function Calendar(){

  const start = new Date();
  const end = new Date(start.getTime() + 14 * 86400000);
  const vehicles = await prisma.vehicle.findMany({
    where: {active: true},
    include: {
      bookings: {
        where: {startAt: {lt: end}, endAt: {gt: start}},
        orderBy: {startAt: "asc"}
      },
      blocks: {
        where: {active: true, startAt: {lt: end}, endAt: {gt: start}}
      },
      maintenanceRecords: {
        where: {startAt: {lt: end}, endAt: {gt: start}}
      }
    }
  });

  return (
    <>
      <div className="eyebrow">Fleet calendar · next 14 days</div>
      <h1>Availability timeline</h1>
      <BlockForm vehicles={vehicles.map(v=>({id:v.id,name:`${v.year} ${v.make} ${v.model}`}))}/>
      <div className="grid">
        {vehicles.map(v => (
          <div className="adminPanel cardBody" key={v.id}>
            <h3>{v.year} {v.make} {v.model}</h3>
            {!v.bookings.length && !v.blocks.length && !v.maintenanceRecords.length && (
              <p className="muted">No reservations or blocks in this window.</p>
            )}
            {v.bookings.map(b => (
              <div className="notice" style={{marginBottom: 8}} key={b.id}>
                <b>{b.reference}</b><br/>{b.startAt.toLocaleString()} → {b.endAt.toLocaleString()} · {b.status}
              </div>
            ))}
            {v.blocks.map(b => (
              <div className="notice" style={{marginBottom: 8}} key={b.id}>
                BLOCK · {b.reason || b.type}<br/>{b.startAt.toLocaleString()} → {b.endAt.toLocaleString()}
              </div>
            ))}
            {v.maintenanceRecords.map(m => (
              <div className="notice" style={{marginBottom: 8}} key={m.id}>
                MAINTENANCE · {m.type}<br/>{m.startAt.toLocaleString()} → {m.endAt.toLocaleString()}
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}

