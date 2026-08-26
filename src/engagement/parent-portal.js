const PARENT_PERMISSIONS = Object.freeze({ viewChildProgress: 'parent:child:progress', viewChildAssessments: 'parent:child:assessments', receiveAlerts: 'parent:alerts:read', manageSubscription: 'parent:subscription:manage' });
function buildParentSnapshot({ student, progress = [], alerts = [], subscription = null } = {}) { if (!student || !student.id) throw new Error('student is required'); return { student: { id: student.id, name: student.name || null }, progress, alerts, subscription }; }
module.exports = { PARENT_PERMISSIONS, buildParentSnapshot };
