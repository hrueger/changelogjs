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
        logoUrl: "https://raw.githubusercontent.com/hrueger/AGM-Tools/master/AGM-Tools/src/assets/logo/AGM-Tools.png",
        logoAlt: "AGM-Tools Logo",
        title: "Changelog for AGM-Tools",
    };

    const configJsonPath = await findUp("changelogjs.json");
    if (configJsonPath) {
        console.log(chalk.green("A \"changelogjs.json\" file was found and is used as the configuration.\n"));
        const jsonContent = JSON.parse(fs.readFileSync(configJsonPath).toString());
        if (jsonContent) {
            Object.keys(jsonContent).forEach((key) => {
                if (jsonContent[key] || jsonContent[key] === false) {
                    config[key] = jsonContent[key];
                }
            });
        }
    } else {
        console.log(chalk.yellow("No \"changelogjs.json\" file was found, the default configuration is used.\n"));
    }
    build(config);
}

async function build(config, mode="html-gh") {
    const types = [
        {
            name: "fix",
            color: "primary",
            values: ["fix", "fixes", "fixed"],
        },
        {
            name: "upgrade",
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
    } else if (mode == "html-gh") {
        content = startHTML(config);
    }
    const simpleGit = require("simple-git/promise")(".");
    const commits = (await simpleGit.log(["HEAD"])).all;
    let lastDate = undefined;
    let isFirst = true;
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
                } else if (mode == "html-gh") {
                    if (isFirst) {
                        isFirst = false;
                    } else {
                        content += endSection();
                    }
                    content += startSection("1.0.5", commitDate);
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
            } else if (mode == "html-gh") {
                content += change(commit.message, commitType);
            }
        }
    }
    if (mode == "html-gh") {
        content += endSection();
        content += endHTML();
    }
    if (mode == "json") {
        fs.writeFileSync("./CHANGELOG.json", JSON.stringify(content));
    } else if (mode == "html-gh") {
        fs.writeFileSync(`./CHANGELOG.html`, content);
    } else {
        fs.writeFileSync(`./CHANGELOG.${mode}`, content);
    }
}

function startHTML(config) {
    return `<!DOCTYPE html>
    <html lang="en" class="bg-dark text-light">
    <head>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
        <meta http-equiv="content-language" content="en-gb">
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
        <link href="https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-Vkoo8x4CGsO3+Hhxv8T/Q5PaXtkKtu6ug5TOeNV6gBiFeWPGFN9MuhOf23Q9Ifjh" crossorigin="anonymous">
        <title>${config.title}</title>
        <style>
            .badge {
                height: min-content;
            }
            .type-badge {
                flex: 0 0 65px;
                font-size: 10px;
            }
            .date-badge {
                width: 65px;
                font-size: 1.1em;
            }
            html {
                font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol" !important;
                font-size: 14px;
                line-height: 1.5;
            }
            .bg-dark {
                background-color: #24292e !important;
            }
            #changelog {
                color: rgba(255,255,255,0.65);
            }
            * {
                z-index: 1;
            }
            .timeline::before {
                content: "";
                background-color: rgb(154, 154, 154);;
                width: 3px;
                position: absolute;
                top: 10rem;
                bottom: 0;
                left: calc((65px / 2) + 16px);
                z-index: 0;
            }
            .timeline {
                margin-left: -13px;
            }
            .active {
                text-decoration: underline;
            }
        </style>
    </head>
    <body class="bg-dark text-light">
        <div>
        <header class="p-5">
            <div class="py-6 px-3 text-center">
                <a href="/">
                    ${config.logoUrl && config.logoAlt ? `<img height="96" src="${config.logoUrl}" alt="${config.logoAlt}">` : ""}
                </a>
                <ul class="nav list-style-none d-flex justify-content-center f4">
                    <li>
                        <a class="d-inline-block m-2 text-light" href="/">Overview</a>
                    </li>
                    <li>
                        <a class="d-inline-block m-2 active text-light" href="/release-notes/">Release Notes</a>
                    </li>
                    <li>
                        <a class="d-inline-block m-2 text-light" href="https://help.github.com/desktop/">Help</a>
                    </li>
                </ul>
            </div>
        </header>
            <div class="col-md-8 mx-auto">
                <div class="p-3 mb-4 border-bottom border-dark">
                    <h1 class="">
                        ${config.title}
                    </h1>
                </div>
                <div id="changelog">
    `;
}
function startSection(version, date) {
    return `<section class="py-6 px-3 text-left mt-5 day">
    <header class="d-flex flex-items-center timeline">
        <span class="badge d-inline-block bg-info p-1 rounded-1 mr-2 text-bold text-white mt-2 date-badge">${version}</span>
        <h2 class="">${date}</h2>
    </header>
    <ul class="list-style-none change-log">`;
}

function change(message, type) {
    return `<li class="d-flex flex-items-start mb-1">
        <div class="badge badge-${type.color} type-badge mt-1 mr-3 text-white font-weight-normal text-uppercase">${type.name}</div>
        <div class="change-description">${message.charAt(0).toUpperCase()}${message.substring(1)}</div>
    </li>`;
}

function endSection() {
    return `
    </ul>
    </section>
    `
}

function endHTML() {
    return `</div></div></div>
    <hr class="my-6 my-md-10 mx-auto col-md-1">
    <div class="col-md-6 mx-auto text-center text-gray-lighter">
        <p>
            <a href="#" class="mr-4">Link #1</a>
            <a href="#" class="mr-4">Link #1</a>
            <a href="#" class="mr-4">Link #1</a>
            <a href="#">Link #1</a>
        </p>
    </div>
    <footer class="mb-6 px-3 text-gray text-center alt-text-small">
        <p class="copyright">© 2020 ChangelogJS</p>
    </footer>
    </body>
    </html>`;
}