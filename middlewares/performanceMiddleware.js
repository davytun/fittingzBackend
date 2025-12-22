const performanceMonitor = (req, res, next) => {
  const start = Date.now();
  
  // Override res.json to capture response time
  const originalJson = res.json;
  res.json = function(data) {
    const duration = Date.now() - start;
    
    // Log slow requests (> 1 second)
    if (duration > 1000) {
      console.warn(`SLOW REQUEST: ${req.method} ${req.originalUrl} took ${duration}ms`);
    }
    
    // Add performance headers
    res.set('X-Response-Time', `${duration}ms`);
    res.set('X-Cache-Status', res.locals.cacheHit ? 'HIT' : 'MISS');
    
    return originalJson.call(this, data);
  };
  
  next();
};

module.exports = { performanceMonitor };