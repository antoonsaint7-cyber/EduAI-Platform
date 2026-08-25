const crypto = require('node:crypto');
const OpenAI = require('openai');
const { migrate, query } = require('./src/platform/db');
const jobs = require('./src/platform/queue');
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const workerId = `${process.pid}-${crypto.randomUUID()}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const threshold = Number(process.env.GROUNDING_THRESHOLD || 0.9);

async function waitForVectorFile(vectorStoreId, vectorFileId) {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    const item = await client.vectorStores.files.retrieve(vectorFileId, { vector_store_id: vectorStoreId });
    if (item.status === 'completed') return item;
    if (['failed', 'cancelled'].includes(item.status)) throw new Error('Vector ingestion failed');
    await sleep(2000);
  }
  throw new Error('Vector ingestion timed out');
}

const analysisSchema = { type:'object', additionalProperties:false, properties:{ units:{type:'array',items:{type:'object',additionalProperties:false,properties:{title:{type:'string'},lessons:{type:'array',items:{type:'object',additionalProperties:false,properties:{title:{type:'string'},objectives:{type:'array',items:{type:'string'}},concepts:{type:'array',items:{type:'string'}}},required:['title','objectives','concepts']}}},required:['title','lessons']}}},required:['units'] };
const generationSchema = { type:'object', additionalProperties:false, properties:{ lessons:{type:'array',items:{type:'object',additionalProperties:false,properties:{title:{type:'string'},summary:{type:'string'},explanation:{type:'string'},examples:{type:'array',items:{type:'string'}},questions:{type:'array',items:{type:'object',additionalProperties:false,properties:{question:{type:'string'},answer:{type:'string'},difficulty:{type:'string',enum:['easy','medium','hard']}},required:['question','answer','difficulty']}}},required:['title','summary','explanation','examples','questions']}}},required:['lessons'] };
const evalSchema = { type:'object', additionalProperties:false, properties:{score:{type:'number'},grounded:{type:'boolean'},unsupportedClaims:{type:'array',items:{type:'string'}},contradictions:{type:'array',items:{type:'string'}},missingObjectives:{type:'array',items:{type:'string'}},educationalQuality:{type:'number'},issues:{type:'array',items:{type:'string'}}},required:['score','grounded','unsupportedClaims','contradictions','missingObjectives','educationalQuality','issues'] };

async function analyze(payload) {
  const response = await client.responses.create({ model:process.env.OPENAI_MODEL||'gpt-5-mini', instructions:'أنت محلل مناهج. استخدم فقط محتوى ملف المنهج المسترجع. لا تخترع معلومات. أعد JSON مطابقًا للمخطط.', input:`حلل منهج ${payload.subject} للصف ${payload.grade} بعنوان ${payload.title}. استخرج الوحدات والدروس وأهداف التعلم والمفاهيم.`, tools:[{type:'file_search',vector_store_ids:[payload.vectorStoreId],max_num_results:50}], include:['file_search_call.results'], text:{format:{type:'json_schema',name:'curriculum_analysis',strict:true,schema:analysisSchema}} });
  return { analysis:JSON.parse(response.output_text||'{"units":[]}'), evidence:response.output?.filter(x=>x.type==='file_search_call')||[] };
}
async function generate(payload,analysis) {
  const response = await client.responses.create({ model:process.env.OPENAI_MODEL||'gpt-5-mini', instructions:'أنت مؤلف محتوى تعليمي. استخدم فقط المادة المسترجعة من المنهج. أنشئ شرحًا وملخصًا وأمثلة وأسئلة، ولا تختلق حقائق.', input:`أنشئ محتوى للوحدات التالية: ${JSON.stringify(analysis)}`, tools:[{type:'file_search',vector_store_ids:[payload.vectorStoreId],max_num_results:50}], include:['file_search_call.results'], text:{format:{type:'json_schema',name:'lesson_generation',strict:true,schema:generationSchema}} });
  return { generated:JSON.parse(response.output_text||'{"lessons":[]}'), evidence:response.output?.filter(x=>x.type==='file_search_call')||[] };
}
async function evaluate(payload, analysis, generated) {
  const structuralIssues=[]; const lessons=generated.lessons||[];
  if(!lessons.length)structuralIssues.push('No lessons generated');
  for(const lesson of lessons){if(!lesson.title||!lesson.summary||!lesson.explanation)structuralIssues.push(`Incomplete lesson: ${lesson.title||'untitled'}`);if((lesson.questions||[]).length<5)structuralIssues.push(`Too few questions: ${lesson.title||'untitled'}`);}
  if(structuralIssues.length)return {status:'needs-review',score:0,grounded:false,issues:structuralIssues,unsupportedClaims:[],contradictions:[],missingObjectives:[],educationalQuality:0};
  const response=await client.responses.create({model:process.env.OPENAI_MODEL||'gpt-5-mini',instructions:`أنت مراجع جودة صارم للمحتوى التعليمي. استخدم فقط المصدر المسترجع من Vector Store. قارن المسودة بالمصدر. اعتبر الادعاء غير مدعوم إذا لم تجد له سندًا واضحًا. احسب score بين 0 و1 بناءً على نسبة المحتوى المدعوم، واكشف التناقضات والأهداف الناقصة وجودة المستوى. لا تمنح درجة كاملة لمجرد أن النص يبدو صحيحًا.`,input:`تحليل المنهج:\n${JSON.stringify(analysis)}\n\nالمحتوى المولد:\n${JSON.stringify(generated)}`,tools:[{type:'file_search',vector_store_ids:[payload.vectorStoreId],max_num_results:100}],include:['file_search_call.results'],text:{format:{type:'json_schema',name:'grounding_evaluation',strict:true,schema:evalSchema}}});
  const result=JSON.parse(response.output_text||'{"score":0,"grounded":false,"unsupportedClaims":[],"contradictions":[],"missingObjectives":[],"educationalQuality":0,"issues":["Evaluator returned no result"]}');
  const issues=[...(result.issues||[])]; if(result.unsupportedClaims?.length)issues.push(`${result.unsupportedClaims.length} unsupported claims`); if(result.contradictions?.length)issues.push(`${result.contradictions.length} contradictions`); if(result.missingObjectives?.length)issues.push(`${result.missingObjectives.length} missing objectives`); if(Number(result.educationalQuality)<0.7)issues.push('Educational quality below threshold');
  const passed=Boolean(result.grounded)&&Number(result.score)>=threshold&&issues.length===0;
  return {...result,status:passed?'passed':'needs-review',threshold};
}
async function processJob(job){const p=job.payload;if(job.type!=='ingest_curriculum')throw new Error(`Unknown job type: ${job.type}`);await waitForVectorFile(p.vectorStoreId,p.vectorFileId);const {analysis,evidence}=await analyze(p);await query(`UPDATE curriculum_versions SET status='evaluating', curriculum=jsonb_set(curriculum,'{analysis}',$1::jsonb), updated_at=now() WHERE id=$2`,[JSON.stringify(analysis),p.versionId]);const {generated,evidence:generationEvidence}=await generate(p,analysis);const evaluation=await evaluate(p,analysis,generated);const allEvidence=[...evidence,...generationEvidence];const status=evaluation.status==='passed'?'awaiting-review':'needs-review';await query(`UPDATE curriculum_versions SET status=$1, curriculum=jsonb_set(jsonb_set(jsonb_set(curriculum,'{generated}',$2::jsonb),'{evidence}',$3::jsonb),'{pipeline}','"completed"'::jsonb), evaluation=$4::jsonb, updated_at=now() WHERE id=$5`,[status,JSON.stringify(generated),JSON.stringify(allEvidence),JSON.stringify(evaluation),p.versionId]);return {status,evaluation};}
async function loop(){await migrate();await jobs.recoverStaleJobs();for(;;){try{const job=await jobs.claim(workerId);if(!job){await sleep(1000);continue;}try{const result=await processJob(job);await jobs.complete(job.id,result);}catch(error){await jobs.fail(job.id,error.message,job.attempts<3);}}catch(error){console.error('worker error',error);await sleep(3000);}}}
loop().catch(error=>{console.error(error);process.exit(1);});
