const crypto = require('node:crypto');

function registerPlatformV2(app, { query, getCurrentUser, client }) {
  const auth = async (req, res, next) => {
    try {
      req.user = await getCurrentUser(req);
      if (!req.user) return res.status(401).json({ error: 'تسجيل الدخول مطلوب.' });
      next();
    } catch (e) { next(e); }
  };
  const role = (...roles) => async (req, res, next) => {
    await auth(req, res, async () => roles.includes(req.user.role) ? next() : res.status(403).json({ error: 'ليس لديك صلاحية.' }));
  };
  const audit = async (req, action, entityType = null, entityId = null, metadata = {}) => {
    await query('INSERT INTO audit_logs(tenant_id,actor_id,action,entity_type,entity_id,metadata) VALUES($1,$2,$3,$4,$5,$6)', [req.user.tenant_id, req.user.id, action, entityType, entityId, JSON.stringify(metadata)]);
  };
  const chunk = (text, size = 6000) => { const out=[]; for(let i=0;i<text.length;i+=size) out.push(text.slice(i,i+size)); return out; };
  const tokenize = text => [...new Set(String(text).toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(x => x.length > 2))].slice(0,80);

  app.get('/api/learning/recommendations', role('student'), async (req,res,next) => {
    try {
      const rows = await query(`SELECT id,title,subject,level,content FROM lessons WHERE tenant_id=$1 AND status='published' ORDER BY updated_at DESC`, [req.user.tenant_id]);
      const mastery = await query('SELECT subject,topic,mastery FROM topic_mastery WHERE tenant_id=$1 AND student_id=$2 ORDER BY mastery ASC', [req.user.tenant_id, req.user.id]);
      const weak = mastery.rows.filter(x => Number(x.mastery) < 70).slice(0,5);
      const recommendations = rows.rows.map(l => ({ lesson:l, priority: weak.some(w => l.subject === w.subject && l.content.toLowerCase().includes(String(w.topic).toLowerCase())) ? 'high' : 'normal' })).sort((a,b) => a.priority === 'high' ? -1 : b.priority === 'high' ? 1 : 0).slice(0,10);
      res.json({ weak_topics: weak, recommendations });
    } catch(e){next(e);}
  });

  app.post('/api/learning/topic-evidence', role('student'), async (req,res,next) => {
    try {
      const subject=String(req.body?.subject||'').trim(), topic=String(req.body?.topic||'').trim(), score=Number(req.body?.score);
      if(!subject||!topic||!Number.isFinite(score)||score<0||score>100||subject.length>160||topic.length>200) return res.status(400).json({error:'بيانات الإتقان غير صحيحة.'});
      const r=await query(`INSERT INTO topic_mastery(tenant_id,student_id,subject,topic,mastery,evidence_count) VALUES($1,$2,$3,$4,$5,1) ON CONFLICT(student_id,subject,topic) DO UPDATE SET mastery=ROUND((topic_mastery.mastery*0.7+EXCLUDED.mastery*0.3)::numeric,2),evidence_count=topic_mastery.evidence_count+1,updated_at=now() RETURNING *`,[req.user.tenant_id,req.user.id,subject,topic,score]);
      await audit(req,'learning.topic_evidence','topic_mastery',r.rows[0].id,{score}); res.json({topic_mastery:r.rows[0]});
    }catch(e){next(e);}
  });

  app.post('/api/rag/documents', role('teacher','admin'), async (req,res,next) => {
    try {
      const name=String(req.body?.name||'').trim(), mime=String(req.body?.mimeType||'text/plain'), text=String(req.body?.text||'').trim();
      if(!name||name.length>255||!text||text.length>20000000) return res.status(400).json({error:'اسم المستند والنص المستخرج مطلوبان.'});
      const d=await query('INSERT INTO documents(tenant_id,uploaded_by,name,mime_type,size_bytes) VALUES($1,$2,$3,$4,$5) RETURNING *',[req.user.tenant_id,req.user.id,name,mime,Buffer.byteLength(text)]);
      const chunks=chunk(text).slice(0,3334);
      for(let i=0;i<chunks.length;i++) await query('INSERT INTO document_chunks(document_id,tenant_id,chunk_index,content) VALUES($1,$2,$3,$4)',[d.rows[0].id,req.user.tenant_id,i,chunks[i]]);
      await audit(req,'rag.document_ingested','documents',d.rows[0].id,{chunks:chunks.length}); res.status(201).json({document:d.rows[0],chunks:chunks.length});
    }catch(e){next(e);}
  });

  app.post('/api/rag/search', auth, async (req,res,next) => {
    try {
      const q=String(req.body?.query||'').trim(); if(!q||q.length>2000) return res.status(400).json({error:'Query غير صحيح.'});
      const terms=tokenize(q); if(!terms.length) return res.json({matches:[]});
      const r=await query('SELECT dc.id,dc.document_id,dc.chunk_index,dc.content,d.name FROM document_chunks dc JOIN documents d ON d.id=dc.document_id WHERE dc.tenant_id=$1 ORDER BY dc.created_at DESC LIMIT 500',[req.user.tenant_id]);
      const scored=r.rows.map(x=>{const words=new Set(tokenize(x.content)); const score=terms.reduce((n,t)=>n+(words.has(t)?1:0),0); return {...x,score};}).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,8);
      res.json({matches:scored});
    }catch(e){next(e);}
  });

  app.get('/api/billing/plans', async (_req,res,next)=>{ try { const r=await query('SELECT id,name,monthly_ai_limit,max_students,max_teachers,stripe_price_id FROM subscription_plans ORDER BY CASE id WHEN \'free\' THEN 0 WHEN \'teacher\' THEN 1 WHEN \'school\' THEN 2 ELSE 3 END'); res.json({plans:r.rows}); } catch(e){next(e);} });
  app.get('/api/billing/subscription', auth, async (req,res,next)=>{ try { const r=await query('SELECT s.*,p.name,p.monthly_ai_limit,p.max_students,p.max_teachers FROM subscriptions s JOIN subscription_plans p ON p.id=s.plan_id WHERE s.tenant_id=$1 ORDER BY s.updated_at DESC LIMIT 1',[req.user.tenant_id]); res.json({subscription:r.rows[0]||null}); }catch(e){next(e);} });
  app.post('/api/billing/checkout', role('admin','teacher'), async (req,res,next)=>{
    try {
      const planId=String(req.body?.planId||''); const p=await query('SELECT * FROM subscription_plans WHERE id=$1',[planId]); if(!p.rows[0]||planId==='free') return res.status(400).json({error:'خطة مدفوعة مطلوبة.'});
      const secret=process.env.STRIPE_SECRET_KEY; if(!secret||!p.rows[0].stripe_price_id) return res.status(503).json({error:'Stripe Checkout يحتاج STRIPE_SECRET_KEY وstripe_price_id للخطة.'});
      const params=new URLSearchParams(); params.set('mode','subscription'); params.set('line_items[0][price]',p.rows[0].stripe_price_id); params.set('line_items[0][quantity]','1'); params.set('success_url',process.env.STRIPE_SUCCESS_URL||'http://localhost:3000/dashboard.html?billing=success'); params.set('cancel_url',process.env.STRIPE_CANCEL_URL||'http://localhost:3000/dashboard.html?billing=cancel'); params.set('metadata[tenant_id]',req.user.tenant_id); params.set('metadata[plan_id]',planId);
      const response=await fetch('https://api.stripe.com/v1/checkout/sessions',{method:'POST',headers:{Authorization:`Bearer ${secret}`,'Content-Type':'application/x-www-form-urlencoded'},body:params}); const data=await response.json(); if(!response.ok) return res.status(502).json({error:'تعذر إنشاء جلسة الدفع.'}); await audit(req,'billing.checkout_created',null,null,{planId}); res.json({url:data.url,id:data.id});
    }catch(e){next(e);}
  });

  app.get('/api/billing/entitlements', auth, async (req,res,next)=>{ try { const r=await query(`SELECT COALESCE(p.name,'Free') name,COALESCE(p.monthly_ai_limit,50) monthly_ai_limit,COALESCE(p.max_students,25) max_students,COALESCE(p.max_teachers,2) max_teachers,COALESCE(s.status,'trialing') status FROM tenants t LEFT JOIN subscriptions s ON s.tenant_id=t.id AND s.status IN ('trialing','active','past_due') LEFT JOIN subscription_plans p ON p.id=s.plan_id WHERE t.id=$1 LIMIT 1`,[req.user.tenant_id]); res.json({entitlements:r.rows[0]||null}); }catch(e){next(e);} });

  app.get('/api/admin/overview', role('admin'), async (req,res,next)=>{ try { const [users,lessons,audit]=await Promise.all([query('SELECT role,COUNT(*)::int count FROM users WHERE tenant_id=$1 GROUP BY role',[req.user.tenant_id]),query('SELECT status,COUNT(*)::int count FROM lessons WHERE tenant_id=$1 GROUP BY status',[req.user.tenant_id]),query('SELECT action,created_at,actor_id,metadata FROM audit_logs WHERE tenant_id=$1 ORDER BY created_at DESC LIMIT 25',[req.user.tenant_id])]); res.json({users:users.rows,lessons:lessons.rows,audit:audit.rows}); }catch(e){next(e);} });
  app.get('/api/admin/users', role('admin'), async (req,res,next)=>{ try { const r=await query('SELECT id,name,email,role,email_verified_at,created_at FROM users WHERE tenant_id=$1 ORDER BY created_at DESC',[req.user.tenant_id]); res.json({users:r.rows}); }catch(e){next(e);} });

  app.post('/api/billing/webhook', async (req,res,next)=>{ try { const secret=process.env.STRIPE_WEBHOOK_SECRET; const signature=req.headers['stripe-signature']; if(!secret||typeof signature!=='string') return res.status(503).json({error:'Stripe webhook غير مضبوط.'}); const raw=Buffer.isBuffer(req.body)?req.body:Buffer.from(JSON.stringify(req.body)); const t=signature.match(/(?:^|,)t=(\d+)/)?.[1], v=signature.match(/(?:^|,)v1=([a-f0-9]+)/)?.[1]; if(!t||!v||Math.abs(Date.now()/1000-Number(t))>300)return res.status(400).json({error:'توقيع Stripe غير صالح.'}); const expected=crypto.createHmac('sha256',secret).update(`${t}.${raw.toString('utf8')}`).digest('hex'); if(!crypto.timingSafeEqual(Buffer.from(expected,'hex'),Buffer.from(v,'hex')))return res.status(400).json({error:'توقيع Stripe غير صالح.'}); const event=JSON.parse(raw.toString('utf8')); if(event.id) await query('INSERT INTO webhook_events(id,provider) VALUES($1,\'stripe\') ON CONFLICT DO NOTHING',[event.id]); res.json({received:true}); }catch(e){next(e);} });
}
module.exports = { registerPlatformV2 };
