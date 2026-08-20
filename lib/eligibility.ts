function parseIsoDate(value:string){
  const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if(!m) throw new Error("INVALID_DATE");
  const year=Number(m[1]),month=Number(m[2]),day=Number(m[3]);
  const d=new Date(Date.UTC(year,month-1,day));
  if(d.getUTCFullYear()!==year||d.getUTCMonth()!==month-1||d.getUTCDate()!==day) throw new Error("INVALID_DATE");
  return {year,month,day};
}

export function ageOnLocalDate(dateOfBirth:string,onDate:string){
  const birth=parseIsoDate(dateOfBirth), current=parseIsoDate(onDate);
  let age=current.year-birth.year;
  if(current.month<birth.month||(current.month===birth.month&&current.day<birth.day)) age--;
  return age;
}

export function validateDriverAge(dateOfBirth:string,pickupLocalDate:string,minimumAge:number){
  if(ageOnLocalDate(dateOfBirth,pickupLocalDate)<minimumAge) throw new Error("DRIVER_BELOW_MINIMUM_AGE");
}

export function dateOnlyToUtc(value:string){
  const {year,month,day}=parseIsoDate(value);
  return new Date(Date.UTC(year,month-1,day));
}
