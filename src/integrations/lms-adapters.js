const LMS_PROVIDERS = Object.freeze(['moodle', 'canvas', 'google-classroom']);
function createLmsAdapter(provider, config = {}) { if (!LMS_PROVIDERS.includes(provider)) throw new Error(`Unsupported LMS provider: ${provider}`); return { provider, baseUrl: config.baseUrl || null, clientId: config.clientId || null, scopes: config.scopes || [], async healthCheck() { return { provider: this.provider, configured: Boolean(this.baseUrl && this.clientId) }; } }; }
module.exports = { LMS_PROVIDERS, createLmsAdapter };
