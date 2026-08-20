import {prisma} from "@/lib/db";
import {formatMoney} from "@/lib/money";
import {BookingStatusControl} from "./BookingStatusControl";

export const dynamic = "force-dynamic";

export default async function Bookings(){
  const rows = await prisma.booking.findMany({
    orderBy: {startAt: "asc"},
    take: 100,
    include: {vehicle: true, rentalPackage: true, driver: true}
  });

  return (
    <>
      <div className="eyebrow">Reservations</div>
      <h1>Bookings</h1>
      <div className="tableWrap">
        <table>
          <thead>
            <tr>
              <th>Reference</th>
              <th>Customer</th>
              <th>Vehicle</th>
              <th>Rental</th>
              <th>Pickup</th>
              <th>Total</th>
              <th>Driver</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(b => (
              <tr key={b.id}>
                <td>{b.reference}</td>
                <td>{b.guestFirstName} {b.guestLastName}<br/><span className="muted">{b.guestEmail}</span></td>
                <td>{b.vehicle.year} {b.vehicle.make} {b.vehicle.model}</td>
                <td>{b.rentalPackage.title}</td>
                <td>{b.startAt.toLocaleString()}</td>
                <td>{formatMoney(b.totalCents)}</td>
                <td>{b.driver?.licenseIssuer || "—"}<br/><span className="muted">{b.driver?.licenseNumber || ""}</span></td>
                <td><BookingStatusControl id={b.id} initial={b.status}/></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

