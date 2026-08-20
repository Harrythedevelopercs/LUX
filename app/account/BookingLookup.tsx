"use client";
import {useState} from "react";

interface BookingLookupData {
  vehicle: string;
  startAt: string;
  status: string;
  totalCents: number;
}

export function BookingLookup(){
  const [reference,setReference]=useState("");
  const [email,setEmail]=useState("");
  const [data,setData]=useState<BookingLookupData | null>(null);
  const [error,setError]=useState("");
  async function load(){
    setError("");
    const r=await fetch(`/api/bookings/${encodeURIComponent(reference)}?email=${encodeURIComponent(email)}`);
    const d=await r.json();
    if(!r.ok) setError(d.message||"Not found");
    else setData(d);
  }
  return (
    <div className="loginBox" style={{marginTop:20}}>
      <div className="field">
        <label>Booking reference</label>
        <input value={reference} onChange={e=>setReference(e.target.value.toUpperCase())} placeholder="LHE-..."/>
      </div>
      <div className="field">
        <label>Email</label>
        <input type="email" value={email} onChange={e=>setEmail(e.target.value)}/>
      </div>
      <button className="btn primary" onClick={load}>View Booking</button>
      {error&&<p style={{color:"#ff9aa4"}}>{error}</p>}
      {data&& (
        <div className="summary">
          <div className="row"><span>Vehicle</span><b>{data.vehicle}</b></div>
          <div className="row"><span>Pickup</span><b>{new Date(data.startAt).toLocaleString()}</b></div>
          <div className="row"><span>Status</span><b>{data.status}</b></div>
          <div className="row total"><span>Total</span><span>${(data.totalCents/100).toFixed(2)}</span></div>
        </div>
      )}
    </div>
  );
}

