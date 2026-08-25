const crypto=require('node:crypto');

function signPayload(payload,secret,timestamp=Math.floor(Date.now()/1000)){
  const signed=`${timestamp}.${payload}`;
  return `${timestamp}.${crypto.createHmac('sha256',secret).update(signed).digest('hex')}`;
}
function verifySignedWebhook(payload,signature,secret,tolerance=300,now=Math.floor(Date.now()/1000)){
  if(!payload||!signature||!secret) return false;
  const [timestamp,sig]=String(signature).split('.',2); const ts=Number(timestamp);
  if(!Number.isFinite(ts)||Math.abs(now-ts)>tolerance||!sig) return false;
  const expected=crypto.createHmac('sha256',secret).update(`${timestamp}.${payload}`).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(sig),Buffer.from(expected));
}
async function createCheckout({provider='stripe',amount,currency,customerId,successUrl,cancelUrl,metadata={}}){
  if(provider!=='stripe') throw new Error('Unsupported payment provider');
  if(!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY is required');
  const body=new URLSearchParams({mode:'subscription','line_items[0][price]':metadata.priceId||'',success_url:successUrl,cancel_url:cancelUrl,customer:customerId||'',metadata_plan:metadata.plan||''});
  const r=await fetch('https://api.stripe.com/v1/checkout/sessions',{method:'POST',headers:{Authorization:`Bearer ${process.env.STRIPE_SECRET_KEY}`,'Content-Type':'application/x-www-form-urlencoded'},body});
  if(!r.ok) throw new Error(`Payment provider error: ${r.status}`); return r.json();
}
module.exports={signPayload,verifySignedWebhook,createCheckout};
