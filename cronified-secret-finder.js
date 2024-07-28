const fs = require('fs');
const path = require('path');

async function collectBranchInfo(branchDir) {
    const branchInfo = {
        totalAmountOfFiles: 0,
        totalSize: 0,
        amountOfYmlFiles: 0,
        ymlFiles: []
    };

    async function traverseDir(directory) {
        const items = await fs.promises.readdir(directory, { withFileTypes: true });

        for (const item of items) {
            const fullPath = path.join(directory, item.name);

            if (item.isDirectory()) {
                await traverseDir(fullPath);
            } else if (item.isFile()) {
                branchInfo.totalAmountOfFiles++;
                const stats = await fs.promises.stat(fullPath);
                branchInfo.totalSize += stats.size;

                if (item.name.endsWith('.yml') || item.name.endsWith('.yaml')) {
                    branchInfo.amountOfYmlFiles++;

                    const ymlContent = await fs.promises.readFile(fullPath, 'utf8');
                    branchInfo.ymlFiles.push({
                        ymlFileName: item.name,
                        ymlFileRelativePath: path.relative(branchDir, fullPath),
                        ymlFileContent: ymlContent
                    });
                }
            }
        }
    }

    await traverseDir(branchDir);

    return branchInfo;
}

async function collectRepoInfo(reposDir) {
    const reposInfo = [];
    const repos = await fs.promises.readdir(reposDir, { withFileTypes: true });

    for (const repo of repos) {
        if (repo.isDirectory()) {
            const repoInfo = {
                reponame: repo.name,
                id: repo.name,
                branches: {}
            };

            const branchesDir = path.join(reposDir, repo.name);
            const branches = await fs.promises.readdir(branchesDir, { withFileTypes: true });

            for (const branch of branches) {
                if (branch.isDirectory()) {
                    const branchInfo = await collectBranchInfo(path.join(branchesDir, branch.name));
                    repoInfo.branches[branch.name] = branchInfo;
                }
            }

            reposInfo.push(repoInfo);
        }
    }

    return reposInfo;
}

async function createReposJson(outputFile) {
    const reposDir = path.join(__dirname, 'tmp');
    const reposInfo = await collectRepoInfo(reposDir);

    await fs.promises.writeFile(outputFile, JSON.stringify(reposInfo, null, 2));
    console.log(`JSON file created at ${outputFile}`);
}



module.exports = {
    createReposJson
};
