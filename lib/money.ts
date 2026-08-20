export function formatMoney(cents:number,currency="USD"){
  return new Intl.NumberFormat("en-US",{style:"currency",currency}).format(cents/100);
}
export function percentOf(cents:number, percent:number){ return Math.round(cents * percent / 100); }
