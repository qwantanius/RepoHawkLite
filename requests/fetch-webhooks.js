const https = require('node:https');

async function fetchWebhooks(repoFullName, apiToken) {
    if (!repoFullName) {
        return [];
    }

    const options = {
        hostname: 'api.github.com',
        path: `/repos/${repoFullName}/hooks`,
        headers: {
            'Authorization': `token ${apiToken}`,
            'User-Agent': 'node.js'
        }
    };

    return new Promise((resolve, reject) => {
        https.get(options, (resp) => {
            let data = '';

            resp.on('data', (chunk) => data += chunk);

            resp.on('end', () => {
                try {
                    const webhooks = JSON.parse(data);
                    resolve(webhooks);
                } catch (e) {
                    reject(new Error(`Failed to parse webhook response for ${repoFullName}: ${e.message}`));
                }
            });
        }).on("error", (err) => {
            reject(new Error(`Failed to fetch webhooks for ${repoFullName}: ${err.message}`));
        });
    });
}

module.exports = {
    fetchWebhooks
};