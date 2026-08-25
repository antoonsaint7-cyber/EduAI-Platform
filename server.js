const express = require('express');
const crypto = require('crypto');
const OpenAI = require('openai');
const { query } = require('./src/db');
const { hashPassword, verifyPassword, sign, requireAuth, requireRole } = require('./src/auth');
const { enrollMfa, verifyMfa } = require('./src/mfa');
const { createCurriculum, analyzeCurriculum, generateLesson, reviewLesson } = require('./src/curriculum');
const { createCheckout, verifyWebhook } = require('./src/payments');
const { uploadObject } = require('./src/storage');
const { createEphemeralToken, recordUsage } = require('./src/realtime');

const app = express();
const port = Number(process.env.PORT || 3000);
const client = process.env.OPENAI_API_KEY ? new OpenAI({apiKey:process.env.OPENAI_API_KEY}) : null;
const MAX_MESSAGE_LENGTH = 4000;
const buckets = new Map();

function rateLimit(req,res,next){
  const key = req.ip || 'unknown'; const now=Date.now(); const windowMs=60_000; const limit=Number(process.env.RATE_LIMIT_PER_MINUTE||60); const b=buckets.get(key)||{start:now,count:0};
  if(now-b.start>=windowMs){b.start=now;b.count=0;} b.count++; buckets.set(key,b); if(b.count>limit) return res.status(429).json({error:'Too many requests.'}); next();
}
function asyncRoute(fn){return (req,res,next)=>Promise.resolve(fn(req,res,next)).catch(next)}
function validatePassword(p){return typeof p==='string' && p.length>=10 && p.length<=200;}

app.disable('x-powered-by');
app.use((req,res,next)=>{res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-Frame-Options','DENY');res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');next();});
app.post('/api/billing/webhook', express.raw({type:'application/json'}), asyncRoute(async(req,res)=>{
  const event=verifyWebhook(req.body,req.headers['stripe-signature']);
  if(['customer.subscription.created','customer.subscription.updated','customer.subscription.deleted'].includes(event.type)){
    const s=event.data.object; await query('INSERT INTO subscriptions(tenant_id,stripe_customer_id,stripe_subscription_id,status,current_period_end) VALUES($1,$2,$3,$4,to_timestamp($5)) ON CONFLICT(stripe_subscription_id) DO UPDATE SET status=EXCLUDED.status,current_period_end=EXCLUDED.current_period_end',[s.metadata?.tenantId||s.metadata?.tenant_id,s.customer,s.id,s.status,s.current_period_end||Math.floor(Date.now()/1000)]);
  }
  res.json({received:true});
}));
app.use(express.json({limit:'2mb'})); app.use(rateLimit); app.use(express.static('public'));

app.get('/health',asyncRoute(async(req,res)=>{let db='not_configured'; if(process.env.DATABASE_URL){await query('SELECT 1');db='ok';} res.json({status:'ok',service:'EduAI Platform',database:db,version:'2.0.0'});}));

app.post('/api/auth/register',asyncRoute(async(req,res)=>{
  const {email,password,name,organization}=req.body||{}; if(!email||!validatePassword(password)||!name) return res.status(400).json({error:'name, email and password (10+ chars) are required.'});
  const slug=(organization||name).toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,50)||`tenant-${crypto.randomUUID().slice(0,8)}`;
  const passwordHash=hashPassword(password);
  const result=await require('./src/db').withTransaction(async c=>{const t=await c.query('INSERT INTO tenants(name,slug) VALUES($1,$2) RETURNING id,name,slug',[organization||name,slug]); const u=await c.query('INSERT INTO users(tenant_id,email,password_hash,role) VALUES($1,$2,$3,\'owner\') RETURNING id,email,role,tenant_id',[t.rows[0].id,email.toLowerCase(),passwordHash]); return {tenant:t.rows[0],user:u.rows[0]};});
  res.status(201).json({user:result.user,tenant:result.tenant,token:sign({userId:result.user.id,tenantId:result.tenant.id,role:result.user.role})});
}));
app.post('/api/auth/login',asyncRoute(async(req,res)=>{const {email,password,mfaCode}=req.body||{}; const {rows}=await query('SELECT * FROM users WHERE email=$1 AND status=\'active\' ORDER BY created_at DESC LIMIT 1',[String(email||'').toLowerCase()]); const u=rows[0]; if(!u||!verifyPassword(password||'',u.password_hash)) return res.status(401).json({error:'Invalid credentials.'}); if(u.mfa_secret&&!verifyMfa) return res.status(401).json({error:'MFA required.'}); if(u.mfa_secret){const ok=await verifyMfa(u.id,mfaCode);if(!ok)return res.status(401).json({error:'Invalid MFA code.'});} res.json({user:{id:u.id,email:u.email,role:u.role,tenantId:u.tenant_id},token:sign({userId:u.id,tenantId:u.tenant_id,role:u.role})});}));
app.post('/api/auth/mfa/enroll',requireAuth,asyncRoute(async(req,res)=>{const secret=await enrollMfa(req.user.id);res.json({secret,otpauth:`otpauth://totp/EduAI:${encodeURIComponent(req.user.email)}?secret=${secret}&issuer=EduAI`});}));

app.get('/api/me',requireAuth,(req,res)=>res.json({user:req.user}));

app.post('/api/curricula',requireAuth,requireRole('owner','admin','teacher'),asyncRoute(async(req,res)=>{const {title,sourceText}=req.body||{};if(!title||typeof sourceText!=='string'||!sourceText.trim())return res.status(400).json({error:'title and sourceText are required.'});const c=await createCurriculum({tenantId:req.user.tenantId,teacherId:req.user.id,title,sourceText:sourceText.slice(0,500000)});res.status(201).json(c);}));
app.post('/api/curricula/:id/analyze',requireAuth,requireRole('owner','admin','teacher'),asyncRoute(async(req,res)=>{const {rows}=await query('SELECT * FROM curricula WHERE id=$1 AND tenant_id=$2',[req.params.id,req.user.tenantId]);if(!rows[0])return res.status(404).json({error:'Curriculum not found.'});res.json(await analyzeCurriculum(rows[0]));}));
app.post('/api/curricula/:id/lessons',requireAuth,requireRole('owner','admin','teacher'),asyncRoute(async(req,res)=>{const {rows}=await query('SELECT * FROM curricula WHERE id=$1 AND tenant_id=$2',[req.params.id,req.user.tenantId]);if(!rows[0])return res.status(404).json({error:'Curriculum not found.'});const lesson=await generateLesson({tenantId:req.user.tenantId,curriculumId:req.params.id,teacherId:req.user.id,title:req.body?.title||'AI Generated Lesson',sourceText:rows[0].source_text});res.status(201).json(lesson);}));
app.post('/api/lessons/:id/review',requireAuth,requireRole('owner','admin','teacher'),asyncRoute(async(req,res)=>{const lesson=await reviewLesson({tenantId:req.user.tenantId,lessonId:req.params.id,teacherId:req.user.id,status:req.body?.status});if(!lesson)return res.status(404).json({error:'Lesson not found.'});res.json(lesson);}));
app.get('/api/lessons',requireAuth,asyncRoute(async(req,res)=>{const {rows}=await query('SELECT id,title,status,created_at,updated_at FROM lessons WHERE tenant_id=$1 ORDER BY created_at DESC',[req.user.tenantId]);res.json(rows);}));

app.post('/api/assessments',requireAuth,requireRole('owner','admin','teacher'),asyncRoute(async(req,res)=>{const {title,lessonId,questions}=req.body||{};if(!title||!Array.isArray(questions))return res.status(400).json({error:'title and questions are required.'});const {rows}=await query('INSERT INTO assessments(tenant_id,lesson_id,teacher_id,title,questions) VALUES($1,$2,$3,$4,$5) RETURNING *',[req.user.tenantId,lessonId||null,req.user.id,title,JSON.stringify(questions)]);res.status(201).json(rows[0]);}));
app.get('/api/assessments',requireAuth,asyncRoute(async(req,res)=>{const {rows}=await query('SELECT id,title,lesson_id,questions,created_at FROM assessments WHERE tenant_id=$1 ORDER BY created_at DESC',[req.user.tenantId]);res.json(rows);}));
app.post('/api/assessments/:id/attempts',requireAuth,requireRole('student'),asyncRoute(async(req,res)=>{const {answers}=req.body||{};const {rows}=await query('SELECT * FROM assessments WHERE id=$1 AND tenant_id=$2',[req.params.id,req.user.tenantId]);if(!rows[0])return res.status(404).json({error:'Assessment not found.'});const questions=Array.isArray(rows[0].questions)?rows[0].questions:[];let correct=0;for(let i=0;i<questions.length;i++)if(answers?.[i]!==undefined&&String(answers[i])===String(questions[i].answer))correct++;const score=questions.length?Math.round(correct/questions.length*100):0;const r=await query('INSERT INTO assessment_attempts(tenant_id,assessment_id,student_id,answers,score,submitted_at) VALUES($1,$2,$3,$4,$5,NOW()) RETURNING *',[req.user.tenantId,req.params.id,req.user.id,JSON.stringify(answers||[]),score]);res.status(201).json(r.rows[0]);}));
app.get('/api/progress',requireAuth,asyncRoute(async(req,res)=>{const {rows}=await query('SELECT assessment_id,score,submitted_at FROM assessment_attempts WHERE tenant_id=$1 AND student_id=$2 ORDER BY submitted_at DESC',[req.user.tenantId,req.user.id]);res.json({attempts:rows});}));

app.post('/api/ai/chat',requireAuth,asyncRoute(async(req,res)=>{const message=typeof req.body?.message==='string'?req.body.message.trim():'';if(!message||message.length>MAX_MESSAGE_LENGTH)return res.status(400).json({error:'A valid message is required.'});if(!client)return res.status(503).json({error:'OPENAI_API_KEY is not configured.'});const response=await client.responses.create({model:process.env.OPENAI_MODEL||'gpt-5.6-luna',instructions:req.user.role==='student'?'You are an educational tutor. Give hints and explanations, not just final answers. Ground claims in supplied curriculum when available.':'You are an educational assistant for teachers. Be accurate and practical.',input:message});await recordUsage({tenantId:req.user.tenantId,userId:req.user.id,kind:'ai_chat',units:1});res.json({answer:response.output_text||''});}));
app.post('/api/realtime/token',requireAuth,asyncRoute(async(req,res)=>{const token=await createEphemeralToken();await recordUsage({tenantId:req.user.tenantId,userId:req.user.id,kind:'realtime_session',units:1});res.json(token);}));
app.post('/api/storage/upload',requireAuth,requireRole('owner','admin','teacher'),asyncRoute(async(req,res)=>{const {filename,contentBase64,contentType}=req.body||{};if(!filename||!contentBase64)return res.status(400).json({error:'filename and contentBase64 are required.'});const result=await uploadObject({tenantId:req.user.tenantId,filename,content:Buffer.from(contentBase64,'base64'),contentType});res.status(201).json(result);}));
app.post('/api/billing/checkout',requireAuth,requireRole('owner','admin'),asyncRoute(async(req,res)=>{const session=await createCheckout({customerEmail:req.user.email,priceId:req.body?.priceId,successUrl:req.body?.successUrl||'http://localhost:3000/?billing=success',cancelUrl:req.body?.cancelUrl||'http://localhost:3000/?billing=cancelled',metadata:{tenantId:req.user.tenantId}});res.json({url:session.url,id:session.id});}));

app.use((err,req,res,next)=>{console.error(err);res.status(500).json({error:process.env.NODE_ENV==='production'?'Internal server error':err.message});});
if(require.main===module) app.listen(port,()=>console.log(`EduAI Platform listening on ${port}`));
module.exports={app};
