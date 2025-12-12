const cron = require('node-cron');
const axios = require('axios');
const emailCronService = require('../services/emailCronService');

class CronManager {
    constructor() {
        this.jobs = new Map();
        this.endpoint = this.getActiveEndpoint();
        this.interval = process.env.KEEPALIVE_INTERVAL || '*/5 * * * *';
        this.timeout = 3000;
    }

    getActiveEndpoint() {
        // Prefer RENDER_EXTERNAL_URL in production
        if (process.env.NODE_ENV === 'production' && process.env.RENDER_EXTERNAL_URL) {
            return process.env.RENDER_EXTERNAL_URL;
        }
        return process.env.APP_URL;
    }

    init() {
        if (!this.endpoint) {
            console.warn('❌ Cron disabled - No valid endpoint');
            return;
        }

        this.setupKeepAlive();
        emailCronService.init();
        console.log(`✅ Cron active - Pinging ${this.endpoint}/health`);
    }

    setupKeepAlive() {
        const healthUrl = `${this.endpoint.replace(/\/$/, '')}/health`;
        
        const job = cron.schedule(this.interval, async () => {
            try {
                await axios.get(healthUrl, {
                    timeout: this.timeout,
                    params: { t: Date.now() }
                });
                console.log(`🟢 ${new Date().toISOString()} - Health check OK`);
            } catch (err) {
                console.warn(`🔴 ${new Date().toISOString()} - Health check failed: ${err.code || err.message}`);
            }
        }, { timezone: 'UTC' });

        this.jobs.set('keepalive', job);
    }

    shutdown() {
        this.jobs.forEach(job => job.stop());
    }
}

module.exports = new CronManager();