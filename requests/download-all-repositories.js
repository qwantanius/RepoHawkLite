const { getAllRepositories } = require('./get-all-repositories');
const { getBranches } = require('./get-branches');
const { downloadRepository } = require('./download-repository');

async function downloadAllRepositories(apiToken) {
    const repositories = await getAllRepositories(apiToken);

    if (repositories.length > 0) {
        const repositoryReport = {};

        for (const repo of repositories) {
            try {
                const branches = await getBranches(repo, apiToken);
                console.log(`Fetched branches for repository ${repo.name}:`, branches);
                repositoryReport[repo.name] = {
                    id: repo.id,
                    name: repo.name,
                    full_name: repo.full_name,
                    branches: []
                };

                for (const branch of branches) {
                    try {
                        console.log(`Downloading branch ${branch.name} of repository ${repo.name}`);
                        const filePath = await downloadRepository(repo, branch.name, apiToken);
                        console.log(`Downloaded! ${repo.full_name}: ${filePath}`);
                        repositoryReport[repo.name].branches.push(branch);
                        repositoryReport.description = `Repository branch downloaded to ${filePath}`;
                    } catch (error) {
                        console.error(`Error downloading branch ${branch.name} of repository ${repo.name}:`, error);
                    }
                }
            } catch (error) {
                console.error(`Error fetching branches for repository ${repo.name}:`, error);
            }
        }

        return repositoryReport;
    } else {
        console.log('No repositories found');
    }
    return null;
}

module.exports = {
    downloadAllRepositories
};
