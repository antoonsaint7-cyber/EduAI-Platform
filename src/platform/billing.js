const PLANS = Object.freeze({
  free: { messages: 50, generationJobs: 2, voiceSeconds: 300, storageBytes: 50 * 1024 * 1024 },
  student: { messages: 500, generationJobs: 10, voiceSeconds: 3600, storageBytes: 500 * 1024 * 1024 },
  teacher: { messages: 2000, generationJobs: 100, voiceSeconds: 7200, storageBytes: 5 * 1024 * 1024 * 1024 },
  school: { messages: 10000, generationJobs: 1000, voiceSeconds: 36000, storageBytes: 100 * 1024 * 1024 * 1024 }
});

function limitFor(plan, metric) { return PLANS[plan]?.[metric] ?? PLANS.free[metric]; }
function withinLimit(plan, metric, used) { return Number(used || 0) < limitFor(plan, metric); }
module.exports = { PLANS, limitFor, withinLimit };
