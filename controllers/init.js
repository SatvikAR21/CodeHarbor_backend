const fs = require("fs").promises;//fs - is the file system which comes witht the node
const path = require("path");//we have to keep the track of the current working directory


async function initRepo() {
  const repoPath= path.resolve(process.cwd(), ".apnaGit");
  const commitsPath = path.join(repoPath, "commits");

  try{
    await fs.mkdir(repoPath, {recursive: true});
    await fs.mkdir(commitsPath, {recursive: true});
    await fs.writeFile(
      path.join(repoPath, "config.json"),
      JSON.stringify({bucket:process.env.S3_BUCKET})
    );
    console.log("Repository initialised!");
  }catch(err){
    console.error("Error initialising the repo",err);
  }
}

module.exports = { initRepo };