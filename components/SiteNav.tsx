import Link from "next/link";
export function SiteNav(){return <header className="container nav"><Link className="brand" href="/">APEX EXOTIC RENTALS</Link><nav className="navlinks"><Link href="/cars">Fleet</Link><Link href="/account">My Booking</Link><Link href="/admin">Admin</Link></nav><Link className="btn primary" href="/cars">Book a Car</Link></header>}
