const crypto=require('node:crypto');
function traceId(){return crypto.randomBytes(16).toString('hex');}
function spanId(){return crypto.randomBytes(8).toString('hex');}
async function exportSpan(span){if(!process.env.OTEL_EXPORTER_OTLP_ENDPOINT)return;const url=`${process.env.OTEL_EXPORTER_OTLP_ENDPOINT.replace(/\/$/,'')}/v1/traces`;await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({resourceSpans:[{resource:{attributes:[{key:'service.name',value:{stringValue:process.env.OTEL_SERVICE_NAME||'educational-platform'}}]},scopeSpans:[{scope:{name:'educational-platform'},spans:[{traceId:span.traceId,spanId:span.spanId,name:span.name,startTimeUnixNano:String(span.startNs),endTimeUnixNano:String(span.endNs),attributes:Object.entries(span.attributes||{}).map(([key,value])=>({key,value:{stringValue:String(value)}}))}]}]}]})}).catch(()=>{});}
async function withSpan(name,fn,attributes={}){const s={traceId:traceId(),spanId:spanId(),name,startNs=process.hrtime.bigint(),attributes};try{return await fn({traceId:s.traceId,spanId:s.spanId});}finally{s.endNs=process.hrtime.bigint();await exportSpan(s);}}
module.exports={withSpan};
