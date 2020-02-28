const chalk = require("chalk");
const findUp = require("find-up");

function getVersion() {
    return JSON.parse(fs.readFileSync(path.join(__dirname, "../package.json"))).version;
}

export async function cli(args) {
    console.log(chalk.cyan("Welcome to ChangelogJS"));
    console.log("\n");
    console.log(chalk.blue("Thanks for using this tool. Feel free to contribute by creating pull requests or reporting issues on GitHub!"));
    console.log("\n");
    
    if (args[2] == "help" || args[2] == "--help") {
        console.log(chalk.green("Help:\nPlease see https://github.com/hrueger/changelogjs/blob/master/README.md"));
        process.exit();
    }
    if (args[2] == "version" || args[2] == "--version") {
        console.log(chalk.green(`v${getVersion()}`));
        process.exit();
    }
    
    let config = {
        ignoreCommiters: [],
    }

    const configJsonPath = await findUp("changelogjs.json");
    if (configJsonPath) {
        console.log(chalk.green("A \"changelogjs.json\" file was found and is used for autocomplete.\n"));
        const jsonContent = JSON.parse(fs.readFileSync(configJsonPath).toString());
        if (jsonContent) {
            Object.keys(jsonContent).forEach((key) => {
                if (jsonContent[key] || jsonContent[key] === false) {
                    config[key] = jsonContent[key];
                }
            });
        }
    } else {
        console.log(chalk.yellow("No \"changelogjs.json\" file was found.\n"));
    }
    build(config);
}

async function build(config) {
    const simpleGit = require('simple-git')(".");
    simpleGit.log({}, (commits) => {
        console.log(commits);
    });
}

function execShellCommand(cmd, options) {
    return new Promise((resolve, reject) => {
        exec(cmd, options, (error, stdout, stderr) => {
            if (error) {
                console.log("\n");
                console.warn(error);
                console.log(chalk.red("Executing shell command failed. This is not an error by changelogjs and there is likely some logging above."));
                process.exit(1);
            }
            resolve(stdout? stdout : stderr);
        });
    });
}
