const https = require('node:https');

async function getAllRepositories(apiToken) {
    const options = {
        hostname: 'api.github.com',
        path: '/user/repos',
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
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        }).on("error", (err) => {
            reject(err);
        });
    });
}

module.exports = {
    getAllRepositories
}