export function intervalsOverlap(aStart:Date,aEnd:Date,bStart:Date,bEnd:Date){
  return aStart < bEnd && aEnd > bStart;
}
export function addMinutes(date:Date,minutes:number){ return new Date(date.getTime()+minutes*60_000); }
