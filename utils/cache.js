const Redis = require('ioredis');

let redis = null;

// Only create Redis connection if Redis config is provided
if (process.env.REDIS_HOST) {
  redis = new Redis({
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD,
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    connectTimeout: 10000,
    commandTimeout: 5000,
  });
} else {
  console.log('Redis not configured, using in-memory cache fallback');
}

// In-memory fallback cache
const memoryCache = new Map();

if (redis) {
  redis.on('error', (err) => {
    console.error('Redis connection error:', err);
  });

  redis.on('connect', () => {
    console.log('Connected to Redis');
  });
}

const cache = {
  async get(key) {
    try {
      if (redis) {
        const data = await redis.get(key);
        return data ? JSON.parse(data) : null;
      } else {
        const data = memoryCache.get(key);
        return data ? JSON.parse(data.value) : null;
      }
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  },

  async set(key, data, ttl = 60) {
    try {
      if (redis) {
        await redis.setex(key, ttl, JSON.stringify(data));
      } else {
        memoryCache.set(key, {
          value: JSON.stringify(data),
          expires: Date.now() + (ttl * 1000)
        });
      }
    } catch (error) {
      console.error('Cache set error:', error);
    }
  },

  async del(key) {
    try {
      if (redis) {
        await redis.del(key);
      } else {
        memoryCache.delete(key);
      }
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  },

  async delPattern(pattern) {
    try {
      if (redis) {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      } else {
        // Simple pattern matching for memory cache
        const regex = new RegExp(pattern.replace('*', '.*'));
        for (const key of memoryCache.keys()) {
          if (regex.test(key)) {
            memoryCache.delete(key);
          }
        }
      }
    } catch (error) {
      console.error('Cache delete pattern error:', error);
    }
  }
};

// Clean up expired memory cache entries
if (!redis) {
  setInterval(() => {
    const now = Date.now();
    for (const [key, data] of memoryCache.entries()) {
      if (data.expires && data.expires < now) {
        memoryCache.delete(key);
      }
    }
  }, 60000); // Clean every minute
}

module.exports = cache;