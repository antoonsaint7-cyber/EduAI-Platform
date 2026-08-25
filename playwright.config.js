const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({ testDir:'tests/e2e', timeout:30000, use:{baseURL:process.env.BASE_URL||'http://127.0.0.1:3000',headless:true}, webServer:{command:'node server.js',url:'http://127.0.0.1:3000/health',reuseExistingServer:true,timeout:30000} });
