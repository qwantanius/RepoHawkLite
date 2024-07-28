const path = require('path');
const fs = require('fs');
const { downloadAllRepositories } = require('./requests/download-all-repositories');
const { createReposJson } = require('./cronified-secret-finder');
const { recursivelyUnzip } = require('./unzipper');
const { fetchWebhooks } = require('./requests/fetch-webhooks');
const { promisify } = require('node:util');
const { rimraf } = require('rimraf');

async function getRepoInfoFromJson(outputFile) {
    const data = await fs.promises.readFile(outputFile, 'utf8');
    return JSON.parse(data);
}

async function refreshCachedRepos(apiToken) {
    const startDir = path.join(__dirname, 'tmp');
    const outputFile = path.join(__dirname, 'repos_info.json');

    await rimraf(startDir);
    if (fs.existsSync(outputFile)) {
        fs.unlinkSync(outputFile);
    }

    const results = await downloadAllRepositories(apiToken);
    await recursivelyUnzip(startDir);
    await createReposJson(outputFile);

    const reposInfo = await getRepoInfoFromJson(outputFile);
    console.log(results?.['smoky']);

    return { results, reposInfo };
}

const RepositoryResolvers = {
    repository: async ({ apiToken }) => {
        try {
            const { results, reposInfo } = await refreshCachedRepos(apiToken);
            const reposData = await Promise.all(reposInfo.map(async (repo) => {
                const webhooks = await fetchWebhooks(results?.[repo.reponame]?.full_name, apiToken);

                return {
                    reponame: repo.reponame,
                    size: repo.branches && Object.values(repo.branches).reduce((acc, branch) => acc + branch.totalSize, 0),
                    owner: repo.owner,
                    isPrivate: repo.private,
                    totalFiles: repo.branches && Object.values(repo.branches).reduce((acc, branch) => acc + branch.totalAmountOfFiles, 0),
                    branches: repo.branches ? Object.keys(repo.branches).map(branchName => ({
                        branchName,
                        ...repo.branches[branchName]
                    })) : [],
                    webhooks: webhooks?.length ? webhooks : []
                };
            }));

            return reposData;
        } catch (error) {
            console.error('Error:', error.message);
            throw new Error('Error processing repository information');
        }
    }
};

module.exports = RepositoryResolvers;
