const { program } = require('commander');
const inquirer = require('inquirer');
const packageJson = require('../package.json');
const initProject = require('./commands/initProject');
const meow = require('meow');
const yargs = require('yargs');

const questions = [
    {
        type: 'list',
        name: 'type',
        message: '请选择功能: (Use arrow Keys)',
        choices: [
            'init-project  : 初始化项目',
            'add-page      : 添加页面',
            'add-mod       : 添加模块',
            'modify-config : 修改/新增配置文件'
        ],
        filter: function (val) {
            return val.match(/(\w+-\w+)/g)[0]
            // return val.toLowerCase();
        },
    },
]

function unExceptInput(cmd, env) {
    // console.log(cmd, env)
    console.log('unExceptInput')
    inquirer
        .prompt(questions)
        .then(answers => {
            // Use user feedback for... whatever!!
            console.log('\nOrder receipt:');
            console.log(JSON.stringify(answers, null, '  '));
        })
        .catch(error => {
            if (error.isTtyError) {
                // Prompt couldn't be rendered in the current environment
            } else {
                // Something else when wrong
            }
        });
}

function programConfig() {
    // program
    //     .version(packageJson.version, 'version')
    //     .description('描述？？')
    //     .option('-i, --info', '命令info')
    //     // .allowUnknownOption()
    //     // .action(unExceptInput) // 没有输入任何命令的兜底函数
    //     .on('-h, --help', () => {
    //         console.log('--help')
    //     })
    // // .parse(process.argv)

    // // 创建工程
    // program
    //     .usage("[command]")
    //     .command("init")
    //     .option("-f,--force", "overwrite current directory")
    //     .description("initialize your project")
    //     .action(initProject);

    // var argv = yargs.argv

    // const argv = yargs
    //     .usage('Usage: $0 <command> [options]')
    //     .command('count', 'Count the lines in a file')
    //     .example('$0 count -f foo.js', 'count the lines in the given file')
    //     .alias('f', 'file')
    //     .nargs('f', 1)
    //     .describe('f', 'Load a file')
    //     .demandOption(['f'])
    //     .help('h')
    //     .alias('h', 'help')
    //     // .epilog('copyright 2019')
    //     .argv;

    const argv = yargs
        .usage('Usage: $0 <command> [options]')
        .command("create", "Add a new note", function (yargs) {
            console.log(1111, yargs.argv)
        })
        .command("lint", "List all notes", function (yargs) {
            console.log(2222, yargs.argv)
        })
        .command('*', 'default command', {}, ({ $0 }) => {
            console.log(`Usage: ${$0} <command> [options]`)
        })
        .option("find")
        // .demand(['create'])
        // .demandOption(['create'])
        .alias("h", "help")
        .alias("v", "version")
        .help()
        .epilog("copyright 2019")
        .argv;

    // .usage('Usage: $0 <command> [options]')
    // .command('count', 'Count the lines in a file')
    // .example('$0 count -f foo.js', 'count the lines in the given file')
    // .alias('f', 'file')
    // .nargs('f', 1)
    // .describe('f', 'Load a file')
    // .demandOption(['f'])
    // .help('h')
    // .alias('h', 'help')
    // .epilog('copyright 2019')
    // .argv;

    console.log('argv11', argv)
    // var fs = require('fs');
    // var s = fs.createReadStream(argv.file);

    // var lines = 0;
    // s.on('data', function (buf) {
    //     lines += buf.toString().match(/\n/g).length;
    // });

    // s.on('end', function () {
    //     console.log(lines);
    // });

    // const cli = meow(`
    //     Usage
    //     $ foo <input>

    //     Options
    //     --rainbow, -r  Include a rainbow

    //     Examples
    //     $ foo unicorns --rainbow
    //     🌈 unicorns 🌈
    // `, {
    //     flags: {
    //         rainbow: {
    //             type: 'boolean',
    //             alias: 'r'
    //         }
    //     }
    // });

    // console.log('cli', cli)
    // // 新增页面
    // program
    //     .command("add-page <page-name>")
    //     .description("add new page")
    //     .action(addPage);

    // // 新增模块
    // program
    //     .command("add-mod [mod-name]")
    //     .description("add new mod")
    //     .action(addMod);

    // // 添加/修改 .pmConfig.json
    // program
    //     .command("modify-config")
    //     .description("modify/add config file (.pmCli.config)")
    //     .action(modifyCon);

    // program.parse(process.argv);

}

module.exports = programConfig;

// const questions = [
//     {
//         type: 'confirm',
//         name: 'toBeDelivered',
//         message: 'Is this for delivery?',
//         default: false,
//     },
//     {
//         type: 'input',
//         name: 'phone',
//         message: "What's your phone number?",
//         validate: function (value) {
//             var pass = value.match(
//                 /^([01]{1})?[-.\s]?\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})\s?((?:#|ext\.?\s?|x\.?\s?){1}(?:\d+)?)?$/i
//             );
//             if (pass) {
//                 return true;
//             }

//             return 'Please enter a valid phone number';
//         },
//     },
//     {
//         type: 'list',
//         name: 'size',
//         message: 'What size do you need?',
//         choices: ['Large', 'Medium', 'Small'],
//         filter: function (val) {
//             return val.toLowerCase();
//         },
//     },
//     {
//         type: 'input',
//         name: 'quantity',
//         message: 'How many do you need?',
//         validate: function (value) {
//             var valid = !isNaN(parseFloat(value));
//             return valid || 'Please enter a number';
//         },
//         filter: Number,
//     },
//     {
//         type: 'expand',
//         name: 'toppings',
//         message: 'What about the toppings?',
//         choices: [
//             {
//                 key: 'p',
//                 name: 'Pepperoni and cheese',
//                 value: 'PepperoniCheese',
//             },
//             {
//                 key: 'a',
//                 name: 'All dressed',
//                 value: 'alldressed',
//             },
//             {
//                 key: 'w',
//                 name: 'Hawaiian',
//                 value: 'hawaiian',
//             },
//         ],
//     },
//     {
//         type: 'rawlist',
//         name: 'beverage',
//         message: 'You also get a free 2L beverage',
//         choices: ['Pepsi', '7up', 'Coke'],
//     },
//     {
//         type: 'input',
//         name: 'comments',
//         message: 'Any comments on your purchase experience?',
//         default: 'Nope, all good!',
//     },
//     {
//         type: 'list',
//         name: 'prize',
//         message: 'For leaving a comment, you get a freebie',
//         choices: ['cake', 'fries'],
//         when: function (answers) {
//             return answers.comments !== 'Nope, all good!';
//         },
//     },
// ];