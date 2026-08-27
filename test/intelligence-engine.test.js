'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { buildKnowledgeProfile, rankNextQuestions, buildDynamicPath } = require('../src/adaptive-engine');
const { hybridRetrieve, groundedPrompt } = require('../src/hybrid-retrieval');
const { normalizeBlueprint, buildExam, gradeExam } = require('../src/exam-blueprint');

test('student intelligence builds mastery profile and dynamic path', () => {
  const profile=buildKnowledgeProfile([{skill:'fractions',score:35,difficulty:.7},{skill:'fractions',score:45,difficulty:.6},{skill:'algebra',score:88,difficulty:.5}]);
  assert.equal(profile.find(x=>x.skill==='fractions').weak,true);
  assert.equal(buildDynamicPath(profile)[0].skill,'fractions');
});

test('adaptive selector prefers questions appropriate to weak skills', () => {
  const profile=[{skill:'fractions',mastery:35}];
  const ranked=rankNextQuestions([{id:'a',skill:'fractions',difficulty:50},{id:'b',skill:'fractions',difficulty:95},{id:'c',skill:'algebra',difficulty:50}],profile);
  assert.equal(ranked[0].id,'a');
});

test('hybrid retrieval filters metadata and preserves citations', () => {
  const chunks=[{id:'1',text:'Photosynthesis uses light energy.',metadata:{tenant_id:'t1',page:4,title:'Biology'}},{id:'2',text:'Photosynthesis occurs in chloroplasts.',metadata:{tenant_id:'t2',page:8,title:'Biology'}}];
  const r=hybridRetrieve('photosynthesis light',chunks,{filters:{tenant_id:'t1'},vectorScores:{'1':.9}});
  assert.equal(r.length,1); assert.match(r[0].citation,/p\. 4/); assert.match(groundedPrompt('What is photosynthesis?',r),/\[1\]/);
});

test('exam blueprint validates types, randomizes and grades objective items', () => {
  const b=normalizeBlueprint({totalQuestions:2,types:['mcq','essay','bad'],difficulty:'easy'}); assert.deepEqual(b.types,['mcq','essay']);
  const exam=buildExam([{id:'1',type:'mcq',difficulty:'easy',skill:'a',answer:'A'},{id:'2',type:'essay',difficulty:'easy',skill:'a'}],b,42); assert.equal(exam.length,2);
  const result=gradeExam(exam,['A','long answer']); assert.equal(result.earned,1); assert.equal(result.manual,1);
});
