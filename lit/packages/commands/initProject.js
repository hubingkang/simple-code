const inquirer = require('inquirer');
const fs = require('fs');
const path = require('path');
const root = process.cwd();

const questions = [
    {
        type: 'input',
        name: 'name',
        message: '请输入项目名称',
    },
    {
        type: 'list',
        name: 'type',
        message: "What's your project type? (Use arrow Keys)",
        choices: [
            'App (Build universal app)',
            'Component (Build universal component)',
            'API (Build universal API library)',
            'Plugin (Build plugin for miniApp)'
        ],
    },
]

module.exports = function initProject(cmd) {

    try {
        if (fs.existsSync(path.resolve(root, './package.json'))) {
            // cli init -y
            console.log("force", cmd.force);
            run()
        } else {
            const dirList = fs.readFileSync(root)

            inquirer
                .prompt([
                    {
                        type: 'input',
                        name: 'projectName',
                        message: '请输入项目名称',
                    }
                ])
                .then(({ projectName }) => {
                    // Use user feedback for... whatever!!
                    console.log('\nOrder receipt:');
                    console.log(projectName);
                    console.log('dirList', dirList);
                    checkNameValidate(projectName, dirList);
                    // console.log(JSON.stringify(answers, null, '  '));
                    // let data = {
                    //     name: "cli-project",
                    //     type: "App (Build universal app)"
                    // };

                    // console.log(data);
                    // console.log(process.cwd())
                })
                .catch(error => {
                    if (error.isTtyError) {
                        // Prompt couldn't be rendered in the current environment
                    } else {
                        // Something else when wrong
                    }
                });
        }
    } catch (error) {
        console.log(`请确认当前目录是否正确：${root}`, error)
    }
}

/**
 * 校验名称合法性
 * @param {string} name 传入的名称 modName/pageName
 * @param {Array}} validateNameList 非法名数组
 */
const checkNameValidate = (name, validateNameList = []) => {
    const validationResult = validatePageName(name);
    if (!validationResult.validForNewPackages) {
        console.error(
            chalk.red(
                `Cannot create a mod or page named ${chalk.green(
                    `"${name}"`
                )} because of npm naming restrictions:\n`
            )
        );
        [
            ...(validationResult.errors || []),
            ...(validationResult.warnings || []),
        ].forEach((error) => {
            console.error(chalk.red(`  * ${error}`));
        });
        console.error(chalk.red("\nPlease choose a different project name."));
        process.exit(1);
    }
    const dependencies = [
        "rax",
        "rax-view",
        "rax-text",
        "rax-app",
        "rax-document",
        "rax-picture",
    ].sort();
    validateNameList = validateNameList.concat(dependencies);

    if (validateNameList.includes(name)) {
        console.error(
            chalk.red(
                `Cannot create a project named ${chalk.green(
                    `"${name}"`
                )} because a page with the same name exists.\n`
            ) +
            chalk.cyan(
                validateNameList.map((depName) => `  ${depName}`).join("\n")
            ) +
            chalk.red("\n\nPlease choose a different name.")
        );
        process.exit(1);
    }
};


function run() {
    const packageObj = fs.readJSONSync(path.resolve(root, "./package.json"));

    // 判断是 rax 项目s
    if (
        !packageObj.dependencies ||
        !packageObj.dependencies.rax ||
        !packageObj.name
    ) {
        handleError("必须在 rax 1.0 项目中初始化");
    }
    // 判断 rax 版本
    let raxVersion = packageObj.dependencies.rax.match(/\d+/) || [];
    if (raxVersion[0] != 1) {
        handleError("必须在 rax 1.0 项目中初始化");
    }

    if (!isMpaApp(CURR_DIR)) {
        handleError(`不支持非 ${chalk.cyan('MPA')} 应用使用 pmCli`);
    }
}

/**
 * 判断目标项目是否为 ts，并创建配置文件
 */
function addTsconfig() {
    let distExist, srcExist;
    let disPath = path.resolve("./tsconfig.json");
    let srcPath = path.resolve(__dirname, "../../ts.json");

    try {
        distExist = fs.existsSync(disPath);
    } catch (error) {
        handleError("路径解析发生错误 code:0024，请联系@一凨");
    }
    if (distExist) return;
    try {
        srcExist = fs.existsSync(srcPath);
    } catch (error) {
        handleError("路径解析发生错误 code:1233，请联系@一凨");
    }
    if (srcExist) {
        // 本地存在
        console.log(
            chalk.red(`编码语言请采用 ${chalk.underline.red("Typescript")}`)
        );
        spinner.start("正在为您创建配置文件：tsconfig.json");
        fs.copy(srcPath, disPath)
            .then(() => {
                console.log();
                spinner.succeed("已为您创建 tsconfig.json 配置文件");
            })
            .catch((err) => {
                handleError("tsconfig 创建失败，请联系@一凨");
            });
    } else {
        handleError("路径解析发生错误 code:2144，请联系@一凨");
    }
}


// const templateProjectPath = path.resolve(__dirname, `../temps/project`);
// // 下载模板
// await downloadTempFromRep(projectTempRepo, templateProjectPath);


/**
 *从远程仓库下载模板
 * @param {string} repo 远程仓库地址
 * @param {string} path 路径
 */
const downloadTempFromRep = async (repo, srcPath) => {
    if (fs.pathExistsSync(srcPath)) fs.removeSync(`${srcPath}`);

    await seriesAsync([`git clone ${repo} ${srcPath}`]).catch((err) => {
        if (err) handleError(`下载模板出错：errorCode:${err},请联系@一凨`);
    });
    if (fs.existsSync(path.resolve(srcPath, './.git'))) {
        spinner.succeed(chalk.cyan('模板目录下 .git 移除'));
        fs.remove(path.resolve(srcPath, './.git'));
    }
};
