const fs = require('fs').promises;
const path = require('path');

// Pass a commit message into the function
async function commitRepo(message = '') {
  const repoPath = path.resolve(process.cwd(), '.apnaGit');
  const commitsPath = path.join(repoPath, 'commits');
  const stagedPath = path.join(repoPath, 'staging');

  try {
    // Dynamically import ESM-only uuid in CommonJS
    const { v4: uuidv4 } = await import('uuid'); // ESM dynamic import in CJS [4][1]

    const commitId = uuidv4();
    const commitDir = path.join(commitsPath, commitId);

    await fs.mkdir(commitDir, { recursive: true });

    // Read staged files
    const files = await fs.readdir(stagedPath);

    // Copy each staged file into the new commit directory
    for (const file of files) {
      await fs.copyFile(
        path.join(stagedPath, file),
        path.join(commitDir, file)
      );
    }

    // Write commit metadata
    await fs.writeFile(
      path.join(commitDir, 'commit.json'),
      JSON.stringify({ id: commitId, message, date: new Date().toISOString() }, null, 2)
    );

    console.log(`Commit ${commitId} created with message: ${message}`);
  } catch (err) {
    console.log('error committing the files:', err);
  }
}

module.exports = { commitRepo };
