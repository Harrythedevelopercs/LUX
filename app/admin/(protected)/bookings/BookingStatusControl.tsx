"use client";
import { useState } from "react";

const allowed=["CONFIRMED","IN_PROGRESS","COMPLETED","CANCELLED","NO_SHOW"];

export function BookingStatusControl({id,initial}:{id:string;initial:string}){
  const [status,setStatus]=useState(initial);
  const [busy,setBusy]=useState(false);

  async function change(next:string){
    const previous=status;
    setBusy(true);
    setStatus(next);
    const response=await fetch(`/api/admin/bookings/${id}`,{
      method:"PATCH",
      headers:{"content-type":"application/json"},
      body:JSON.stringify({status:next})
    });
    if(!response.ok){
      const data=await response.json().catch(()=>({}));
      setStatus(previous);
      alert(data.message||"Update failed");
    }
    setBusy(false);
  }

  const options=allowed.includes(status)?allowed:[status,...allowed];
  return <select disabled={busy} value={status} onChange={e=>change(e.target.value)} style={{background:"#0c0e12",border:"1px solid #282c35",borderRadius:8,padding:7}}>
    {options.map(x=><option key={x}>{x}</option>)}
  </select>;
}
