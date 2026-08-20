import crypto from "node:crypto";
export function bookingReference(){
  const d=new Date();
  const stamp=`${String(d.getUTCFullYear()).slice(-2)}${String(d.getUTCMonth()+1).padStart(2,"0")}${String(d.getUTCDate()).padStart(2,"0")}`;
  return `LHE-${stamp}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}
