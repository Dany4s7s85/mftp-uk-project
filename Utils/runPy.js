const util = require('util');
const exec = util.promisify(require('child_process').exec);
const fs = require("fs")


// spawn new child process to call the python script

exports.runBash = async function () {
return new Promise(async (resolve, reject)=> {
await exec('./Utils/python-instagram-scraper/run.sh');
// const {stdout, stderr} = await exec('ls $PWD');
// console.log('stdout:', stdout);
// console.log('stderr:', stderr);

var file = fs.readFileSync('./followers.txt','utf-8')

resolve(file.split("\n"))

})
}

// runBash()