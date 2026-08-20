function datePartsForZone(date:Date,timeZone:string){
  const fmt=new Intl.DateTimeFormat("en-US",{timeZone,year:"numeric",month:"2-digit",day:"2-digit",weekday:"short",hour:"2-digit",minute:"2-digit",hourCycle:"h23"});
  return Object.fromEntries(fmt.formatToParts(date).filter(x=>x.type!=="literal").map(x=>[x.type,x.value]));
}

export function zonedLocalToUtc(localDate:string,localTime:string,timeZone:string){
  const [year,month,day]=localDate.split("-").map(Number);
  const [hour,minute]=localTime.split(":").map(Number);
  const calendarProbe=new Date(Date.UTC(year,month-1,day));
  if(!year||!month||!day||Number.isNaN(hour)||Number.isNaN(minute)||hour<0||hour>23||minute<0||minute>59||calendarProbe.getUTCFullYear()!==year||calendarProbe.getUTCMonth()!==month-1||calendarProbe.getUTCDate()!==day) throw new Error("INVALID_LOCAL_DATETIME");
  const target=Date.UTC(year,month-1,day,hour,minute,0);
  let guess=target;
  for(let i=0;i<4;i++){
    const parts=datePartsForZone(new Date(guess),timeZone);
    const represented=Date.UTC(Number(parts.year),Number(parts.month)-1,Number(parts.day),Number(parts.hour),Number(parts.minute),0);
    const diff=target-represented;
    if(diff===0) break;
    guess+=diff;
  }
  const result=new Date(guess);
  const roundTrip=datePartsForZone(result,timeZone);
  if(Number(roundTrip.year)!==year||Number(roundTrip.month)!==month||Number(roundTrip.day)!==day||Number(roundTrip.hour)!==hour||Number(roundTrip.minute)!==minute) throw new Error("INVALID_LOCAL_DATETIME");
  return result;
}

export function zonedParts(date:Date,timeZone:string){
  const p=datePartsForZone(date,timeZone);
  const weekdays:{[k:string]:number}={Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6};
  return {date:`${p.year}-${p.month}-${p.day}`,dayOfWeek:weekdays[p.weekday],minuteOfDay:Number(p.hour)*60+Number(p.minute)};
}
