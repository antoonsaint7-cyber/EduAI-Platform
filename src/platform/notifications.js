const { query } = require('./db');
const crypto = require('node:crypto');

async function createNotification({ userId, type, title, body }) {
  const id = crypto.randomUUID();
  await query('INSERT INTO notifications (id,user_id,type,title,body) VALUES ($1,$2,$3,$4,$5)', [id,userId,type,title,body]);
  return { id, userId, type, title, body };
}
async function listNotifications(userId, limit = 50) {
  const result = await query('SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT $2',[userId,Math.min(100,Math.max(1,Number(limit)||50))]);
  return result.rows;
}
async function markRead(userId, id) { await query('UPDATE notifications SET read_at=now() WHERE id=$1 AND user_id=$2',[id,userId]); }
module.exports = { createNotification, listNotifications, markRead };
