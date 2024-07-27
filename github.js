const https = require('https');
const path = require('path');
const fs = require('fs');

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

async function getBranches(repo, apiToken) {
    const options = {
        hostname: 'api.github.com',
        path: `/repos/${repo.full_name}/branches`,
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
        const request = https.get(options, (res) => {
            if (res.statusCode === 302 && res.headers.location) {
                https.get(res.headers.location, (res) => {
                    if (res.statusCode !== 200) {
                        reject(new Error(`Failed to get repository: ${res.statusCode}`));
                        return;
                    }

                    const dir = path.join(__dirname, 'tmp', repo.name, branch);
                    if (!fs.existsSync(dir)) {
                        fs.mkdirSync(dir, { recursive: true });
                    }

                    const filePath = path.join(dir, `${branch}.zip`);
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
                const dir = path.join(__dirname, 'tmp', repo.name, branch);
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }

                const filePath = path.join(dir, `${branch}.zip`);
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

async function downloadAllRepositories(apiToken) {
    try {
        const repositories = await getAllRepositories(apiToken);
        console.log('Fetched repositories:', repositories);

        if (repositories.length > 0) {
            const results = [];
            for (const repo of repositories) {
                try {
                    const branches = await getBranches(repo, apiToken);
                    console.log(`Fetched branches for repository ${repo.name}:`, branches);
                    for (const branch of branches) {
                        try {
                            console.log(`Downloading branch ${branch.name} of repository ${repo.name}`);
                            const filePath = await downloadRepository(repo, branch.name, apiToken);
                            results.push({
                                id: repo.id,
                                name: repo.name,
                                branch: branch.name,
                                description: `Repository branch downloaded to ${filePath}`
                            });
                        } catch (error) {
                            console.error(`Error downloading branch ${branch.name} of repository ${repo.name}:`, error);
                        }
                    }
                } catch (error) {
                    console.error(`Error fetching branches for repository ${repo.name}:`, error);
                }
            }
            return results;
        } else {
            console.log('No repositories found');
        }
        return null;
    } catch (error) {
        console.error('Error fetching repository data:', error);
        return null;
    }
}

module.exports = {
    downloadAllRepositories
};
