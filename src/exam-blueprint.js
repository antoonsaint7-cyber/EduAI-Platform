'use strict';

const TYPES = new Set(['mcq','true_false','short_answer','essay','matching']);
function normalizeBlueprint(input = {}) {
  const total = Math.max(1, Math.min(200, Number(input.totalQuestions) || 10));
  const difficulty = ['easy','medium','hard'].includes(input.difficulty) ? input.difficulty : 'medium';
  const types = Array.isArray(input.types) ? input.types.filter(x=>TYPES.has(x)) : ['mcq'];
  const distribution = Array.isArray(input.distribution) ? input.distribution.filter(x=>x && TYPES.has(x.type) && Number(x.count)>0).map(x=>({type:x.type,count:Math.floor(Number(x.count))})) : [];
  return { totalQuestions: total, difficulty, types: [...new Set(types)], skills: Array.isArray(input.skills) ? input.skills.filter(Boolean).slice(0,50) : [], distribution };
}
function selectQuestionBank(bank = [], blueprint = {}) {
  const b=normalizeBlueprint(blueprint);
  return bank.filter(q => q && TYPES.has(q.type) && (!b.skills.length || b.skills.includes(q.skill)) && (!q.difficulty || q.difficulty === b.difficulty));
}
function deterministicShuffle(items, seed = 1) { const a=[...items]; let s=Math.abs(Number(seed)||1); for(let i=a.length-1;i>0;i--){s=(s*1664525+1013904223)>>>0; const j=s%(i+1); [a[i],a[j]]=[a[j],a[i]];} return a; }
function buildExam(bank, blueprint, seed=1) { const b=normalizeBlueprint(blueprint); const selected=deterministicShuffle(selectQuestionBank(bank,b),seed); return selected.slice(0,b.totalQuestions).map((q,i)=>({...q,order:i+1})); }
function gradeAnswer(question, answer) {
  if (!question) return {score:0, correct:false};
  if (question.type==='mcq'||question.type==='true_false') { const correct=String(answer)===String(question.answer); return {score:correct?1:0,correct}; }
  if (question.type==='matching') { const a=JSON.stringify(answer); const b=JSON.stringify(question.answer); const correct=a===b; return {score:correct?1:0,correct}; }
  if (question.type==='short_answer') { const accepted=Array.isArray(question.accepted_answers)?question.accepted_answers:[]; const normalized=String(answer||'').trim().toLowerCase(); const correct=accepted.some(x=>String(x).trim().toLowerCase()===normalized); return {score:correct?1:0,correct}; }
  return {score:null,correct:null,manual:true};
}
function gradeExam(questions, answers) { let earned=0, possible=0, manual=0; const review=questions.map((q,i)=>{possible+=1; const r=gradeAnswer(q,answers?.[i]); if(r.manual){manual++;return {...r,questionId:q.id,order:q.order};} earned+=r.score; return {...r,questionId:q.id,order:q.order};}); return {earned,possible,manual,autoScore:possible?Math.round(earned/possible*10000)/100:0,review}; }
module.exports = { TYPES, normalizeBlueprint, selectQuestionBank, deterministicShuffle, buildExam, gradeAnswer, gradeExam };
