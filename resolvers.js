const path = require('path');
const fs = require('fs');
const https = require('https');
const { downloadAllRepositories } = require('./github');
const { createReposJson } = require('./cronified-secret-finder');
const { recursivelyUnzip } = require('./unzipper');

async function fetchWebhooks(repoFullName, apiToken) {
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

async function getRepoInfoFromJson(outputFile) {
    const data = await fs.promises.readFile(outputFile, 'utf8');
    return JSON.parse(data);
}

const RepositoryResolvers = {
    repository: async ({ apiToken }) => {
        const outputFile = path.join(__dirname, 'repos_info.json');

        try {
            await downloadAllRepositories(apiToken);

            const startDir = path.join(__dirname, 'tmp');
            await recursivelyUnzip(startDir);
            await createReposJson(outputFile);

            const reposInfo = await getRepoInfoFromJson(outputFile);

            for (const repo of reposInfo) {
                try {
                    const webhooks = await fetchWebhooks(repo.id, apiToken);
                    repo.webhooks = Array.isArray(webhooks) ? webhooks : [];
                } catch (error) {
                    console.error(`Error fetching webhooks for repo ${repo.reponame}:`, error);
                    repo.webhooks = [];
                }
            }

            return reposInfo.map(repo => ({
                reponame: repo.reponame,
                size: repo.branches && Object.values(repo.branches).reduce((acc, branch) => acc + branch.totalSize, 0),
                owner: repo.owner, 
                isPrivate: repo.private,
                totalFiles: repo.branches && Object.values(repo.branches).reduce((acc, branch) => acc + branch.totalAmountOfFiles, 0),
                branches: repo.branches ? Object.keys(repo.branches).map(branchName => ({
                    branchName,
                    ...repo.branches[branchName]
                })) : [],
                webhooks: repo.webhooks
            }));
        } catch (error) {
            console.error('Error:', error);
            throw new Error('Error processing repository information');
        }
    }
};

module.exports = RepositoryResolvers;
