const cron = require("node-cron");
const axios = require("axios");

class CronManager {
  constructor() {
    if (!this.validateEnvironment()) return;

    this.jobs = new Map();
    this.endpoints = this.getSafeEndpoints();
    this.interval = process.env.KEEPALIVE_INTERVAL || "*/5 * * * *";
    this.timeout = 3000;
  }

  validateEnvironment() {
    if (!process.env.APP_URL) {
      console.warn("❌ Cron system disabled - Missing APP_URL");
      return false;
    }
    return true;
  }

  getSafeEndpoints() {
    const endpoints = [];

    // Only use Render URL in production
    if (
      process.env.NODE_ENV === "production" &&
      process.env.RENDER_EXTERNAL_URL
    ) {
      endpoints.push(process.env.RENDER_EXTERNAL_URL);
    }

    // Always use APP_URL if specified
    if (process.env.APP_URL) {
      endpoints.push(process.env.APP_URL);
    }

    return endpoints.filter(
      (url) => url && !url.includes("localhost") && !url.includes("127.0.0.1")
    );
  }

  init() {
    if (!this.endpoints?.length) return;

    this.setupKeepAlive();
    console.log(
      `✅ Cron system active (Pinging ${this.endpoints.length} endpoints)`
    );
  }

  setupKeepAlive() {
    const job = cron.schedule(
      this.interval,
      async () => {
        await this.pingEndpoints();
      },
      { timezone: "UTC" }
    );

    this.jobs.set("keepalive", job);
    this.pingEndpoints(); // Initial ping
  }

  async pingEndpoints() {
    for (const url of this.endpoints) {
      const healthUrl = `${url.replace(/\/$/, "")}/health`;

      try {
        await axios.get(healthUrl, {
          timeout: this.timeout,
          params: { t: Date.now() },
        });
        console.log(`🟢 [${new Date().toISOString()}] ${healthUrl} OK`);
      } catch (err) {
        console.warn(
          `🔴 [${new Date().toISOString()}] ${healthUrl} FAILED: ${
            err.code || err.message
          }`
        );
      }
    }
  }

  shutdown() {
    this.jobs.forEach((job) => job.stop());
  }
}

module.exports = new CronManager();
