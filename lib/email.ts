import "server-only";

type EmailInput={to:string;subject:string;html:string;idempotencyKey?:string};

export async function sendBookingEmail(input:EmailInput){
  const provider=(process.env.EMAIL_PROVIDER||"console").toLowerCase();
  if(provider==="console"){
    console.log("[email]",input.to,input.subject);
    return {id:`console-${Date.now()}`};
  }
  if(provider!=="resend") throw new Error("UNSUPPORTED_EMAIL_PROVIDER");

  const apiKey=process.env.EMAIL_API_KEY;
  const from=process.env.EMAIL_FROM;
  if(!apiKey||!from) throw new Error("EMAIL_PROVIDER_NOT_CONFIGURED");

  const response=await fetch("https://api.resend.com/emails",{
    method:"POST",
    headers:{
      "authorization":`Bearer ${apiKey}`,
      "content-type":"application/json",
      "user-agent":"apex-exotic-rentals/1.0",
      ...(input.idempotencyKey?{"idempotency-key":input.idempotencyKey}:{})
    },
    body:JSON.stringify({from,to:[input.to],subject:input.subject,html:input.html})
  });
  const data=await response.json().catch(()=>({}));
  if(!response.ok) throw new Error(`EMAIL_SEND_FAILED_${response.status}`);
  return {id:typeof data.id==="string"?data.id:`resend-${Date.now()}`};
}
