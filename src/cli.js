const chalk = require("chalk");
const findUp = require("find-up");
const fs = require("fs");

function getVersion() {
    return JSON.parse(fs.readFileSync(path.join(__dirname, "../package.json"))).version;
}

export async function cli(args) {
    console.log(chalk.cyan("\nWelcome to ChangelogJS"));
    console.log(chalk.blue("Thanks for using this tool. Feel free to contribute by creating pull requests or reporting issues on GitHub!"));
    
    if (args[2] == "help" || args[2] == "--help") {
        console.log(chalk.green("Help:\nPlease see https://github.com/hrueger/changelogjs/blob/master/README.md"));
        process.exit();
    }
    if (args[2] == "version" || args[2] == "--version") {
        console.log(chalk.green(`v${getVersion()}`));
        process.exit();
    }
    
    let config = {
        ignoreAuthors: [
            "greenkeeper[bot]"
        ],
        hideMergeBranch: true,
    };

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

async function build(config, mode="json") {
    const types = [
        {
            name: "fix",
            color: "warning",
            values: ["fix", "fixes", "fixed"],
        },
        {
            name: "improvement",
            color: "primary",
            values: ["better", "update"],
        },
        {
            name: "feature",
            color: "success",
            values: ["add", "added", "new", "feat", "feature"],
        },
        {
            name: "version",
            color: "dark",
            values: ["bumped version"]
        }
    ];
    const defaultCommitType = {
        name: "change",
        color: "secondary"
    };

    let content;
    if (mode == "json") {
        content = {};
    } else if (mode == "md") {
        content = "# Changelog\n\n";
    }
    const simpleGit = require("simple-git/promise")(".");
    const commits = (await simpleGit.log(["HEAD"])).all;
    let lastDate = undefined;
    for (const commit of commits) {
        if (!config.ignoreAuthors.includes(commit.author_name) && (!config.hideMergeBranch || !commit.message.startsWith("Merge branch"))) {
            const commitDate = (new Date(Date.parse(commit.date))).toDateString();
            let commitType;
            for (const t of types) {
                for (const v of t.values) {
                    if (commit.message.startsWith(v)) {
                        commitType = t;
                    }
                }
            }
            if (!commitType) {
                commitType = defaultCommitType;
            }
            if (lastDate != commitDate) {
                lastDate = commitDate;
                if (mode == "md") {
                    content += `\n### ${commitDate}\n`
                }
            }
            if (mode == "json") {
                const datestamp = Date.parse((new Date(Date.parse(commit.date))).toDateString());
                if (!content[datestamp]) {
                    content[datestamp] = {
                        date: commitDate,
                        changes: []
                    };
                }
                content[datestamp].changes.push({
                    type: commitType.name,
                    message: commit.message,
                });
            } else if (mode == "md") {
                content += `- (${commitType.name}) ${commit.message}\n`;
            }
        }
    }
    if (mode == "json") {
        fs.writeFileSync("./CHANGELOG.json", JSON.stringify(content));
    } else {
        fs.writeFileSync(`./CHANGELOG.${mode}`, content);
    }
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
