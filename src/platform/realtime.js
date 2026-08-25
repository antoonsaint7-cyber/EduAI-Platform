async function createRealtimeClientSecret({model=process.env.REALTIME_MODEL||'gpt-realtime-2.1'}={}){
  if(!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is required');
  const r=await fetch('https://api.openai.com/v1/realtime/client_secrets',{method:'POST',headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({session:{type:'realtime',model}})});
  if(!r.ok) throw new Error(`Realtime session error: ${r.status}`); return r.json();
}
module.exports={createRealtimeClientSecret};
