const { getAllRepositories } = require('./get-all-repositories');
const { getBranches } = require('./get-branches');
const { downloadRepository } = require('./download-repository');

async function downloadAllRepositories(apiToken) {
    const repositories = await getAllRepositories(apiToken);

    if (repositories?.length <= 0) {
        console.log('No repositories found');
        return null;
    }

    const repositoryReport = {};

    for (const repo of repositories) {
        try {
            const branches = await getBranches(repo, apiToken);
            const branchesInfoMessage = branches?.map((branch) => branch.name)?.join(', ');
            console.log(`Fetched branches for repository ${repo.name}:`, branchesInfoMessage);

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
                    console.log(`Downloaded branch ${branch.name}! (${repo.full_name}): ${filePath}`);

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
}

module.exports = {
    downloadAllRepositories
};
