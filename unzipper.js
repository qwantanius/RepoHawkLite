const fs = require('fs');
const path = require('path');
const unzipper = require('unzipper');

async function unzipFile(filePath, destination) {
    return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(unzipper.Extract({ path: destination }))
            .on('close', resolve)
            .on('error', reject);
    });
}

async function recursivelyUnzip(directory) {
    const items = await fs.promises.readdir(directory, { withFileTypes: true });

    for (const item of items) {
        const fullPath = path.join(directory, item.name);
        
        if (item.isDirectory()) {
            await recursivelyUnzip(fullPath);
        } else if (item.isFile() && item.name.endsWith('.zip')) {
            const destination = path.join(directory, path.basename(item.name, '.zip'));
            
            if (!fs.existsSync(destination)) {
                fs.mkdirSync(destination, { recursive: true });
            }

            console.log(`Unzipping ${fullPath} to ${destination}`);
            await unzipFile(fullPath, destination);
        }
    }
}

module.exports = {
    recursivelyUnzip
};
