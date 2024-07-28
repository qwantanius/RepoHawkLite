const https = require('node:https');
const path = require('node:path');
const fs = require('node:fs');

async function downloadRepository(repo, branch, apiToken) {
    const url = `https://api.github.com/repos/${repo.full_name}/zipball/${branch}`;

    const options = {
        path: url.replace('https://api.github.com', ''),
        host: 'api.github.com',
        headers: {
            'Authorization': `token ${apiToken}`,
            'User-Agent': 'node.js'
        }
    };

    return new Promise((resolve, reject) => {
        https.get(options, (res) => {
            if (res.statusCode === 302 && res.headers.location) {
                https.get(res.headers.location, (res) => {
                    if (res.statusCode !== 200) {
                        reject(new Error(`Failed to get repository: ${res.statusCode}`));
                        return;
                    }

                    const dir = path.join(__dirname, '../tmp', repo.name, branch);
                    if (!fs.existsSync(dir)) {
                        fs.mkdirSync(dir, { recursive: true });
                    }

                    const filePath = path.join(dir, `${path.basename(branch)}.zip`);
                    const fileStream = fs.createWriteStream(filePath);

                    res.pipe(fileStream);

                    fileStream.on('finish', () => {
                        fileStream.close(err => {
                            if (err) {
                                reject(err);
                            } else {
                                resolve(filePath);
                            }
                        });
                    });

                    fileStream.on('error', (err) => {
                        fs.unlink(filePath, () => reject(err));
                    });
                }).on('error', (err) => {
                    reject(err);
                });
            } else if (res.statusCode !== 200) {
                reject(new Error(`Failed to get repository: ${res.statusCode}`));
            } else {
                const dir = path.join(__dirname, '../tmp', repo.name, branch);
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }

                const filePath = path.join(dir, `${path.basename(branch)}.zip`);
                const fileStream = fs.createWriteStream(filePath);

                res.pipe(fileStream);

                fileStream.on('finish', () => {
                    fileStream.close(err => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(filePath);
                        }
                    });
                });

                fileStream.on('error', (err) => {
                    fs.unlink(filePath, () => reject(err));
                });
            }
        }).on('error', (err) => {
            reject(err);
        });
    });
}

module.exports = {
    downloadRepository
}
