const buckets = new Map();

function rateLimit({ windowMs = 60_000, max = 60, key = req => req.ip || 'unknown' } = {}) {
  return (req, res, next) => {
    const now = Date.now();
    const id = key(req);
    let bucket = buckets.get(id);
    if (!bucket || now >= bucket.reset) bucket = { count: 0, reset: now + windowMs };
    bucket.count += 1;
    buckets.set(id, bucket);
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - bucket.count));
    if (bucket.count > max) {
      res.setHeader('Retry-After', Math.ceil((bucket.reset - now) / 1000));
      return res.status(429).json({ error: 'طلبات كثيرة جدًا، حاول لاحقًا.' });
    }
    return next();
  };
}

setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) if (now >= bucket.reset) buckets.delete(key);
}, 60_000).unref();

module.exports = { rateLimit };
