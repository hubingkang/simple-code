const fs = require('fs')
const path = require('path')
const babylon = require('babylon')
// const babylon = require("@babel/parser");
const traverse = require('babel-traverse').default
const { transformFromAst } = require('babel-core')
// const { transformFromAstSync } = require('@babel/core')

let ID = 0;
function createAsset(filePath) {
    console.log("filePath", filePath);
    // 读取文件， 返回值是字符串
    const content = fs.readFileSync(filePath, 'utf-8');

    // 将读取的字符串 生成 AST
    const ast = babylon.parse(content, {
        sourceType: 'module'
    });

    // 存储文件的依赖模块
    const dependencies = [];

    // 遍历语法树，从语法树种过滤自己想要的数据。
    traverse(ast, {
        // 找到声明了 import语法的节点。
        ImportDeclaration: ({ node }) => {
            // 把当前依赖的模块加入到数组中，其实这存的是字符串，
            // 例如 如果当前js文件 有一句 import message from './message.js'， 
            // './message.js' === node.source.value
            dependencies.push(node.source.value)
        }
    })

    // 模块的id 从0开始， 相当一个js文件 可以看成一个模块
    const id = ID++;

    // 通过 AST 将代码转为 ES5
    const { code } = transformFromAst(ast, null, {
        presets: ['env']
    })

    return {
        id,
        filePath,
        dependencies,
        code
    }
}

// 从入口开始分析所有依赖项，形成依赖图，采用广度优先遍历
function createGraph(entry) {
    // 读取入口文件
    const entryObject = createAsset(entry);

    // 广度遍历肯定要有一个队列，第一个元素肯定是 从 "./example/entry.js" 返回的信息
    const queue = [entryObject];

    // 遍历所有文件依赖关系
    for (const asset of queue) {
        // 获得文件目录
        const dirname = path.dirname(asset.filePath);

        // 保存子依赖项的数据的属性, 保存类似 这样的数据结构 --->  {"./message.js" : 1}
        asset.mapping = {};

        // 遍历当前文件依赖关系
        asset.dependencies.forEach(relativePath => {
            // 获得绝对路径
            const absolutePath = path.join(dirname, relativePath);

            // CSS 文件逻辑就是将代码插入到 `style` 标签中
            if (/\.css$/.test(absolutePath)) {
                const content = fs.readFileSync(absolutePath, 'utf-8')
                const code = `
            const style = document.createElement('style')
            style.innerText = ${JSON.stringify(content).replace(/\\r\\n/g, '')}
            document.head.appendChild(style)
          `
                queue.push({
                    filePath: absolutePath,
                    relativePath,
                    dependencies: [],
                    code
                });
            } else {
                // 获得子依赖（子模块）的依赖项、代码、模块id，文件名
                const child = createAsset(absolutePath);

                // 给子依赖项赋值，
                asset.mapping[relativePath] = child.id;

                child.relativePath = relativePath;
                queue.push(child)
            }
        })
    }
    return queue
}

// 根据生成的依赖关系图，生成对应环境能执行的代码，目前是生产浏览器可以执行的
function bundle(graph, entry) {
    let modules = '';

    // 构建函数参数，生成的结构为
    // { './entry.js': function(module, exports, require) { 代码 } }
    graph.forEach(mod => {
        modules += `${mod.id}:[
            function (require, module, exports){
              ${mod.code}
            },
            ${JSON.stringify(mod.mapping)},
          ],`;
    });

    console.log(graph);

    // require, module, exports 是 cjs的标准不能再浏览器中直接使用，所以这里模拟cjs模块加载，执行，导出操作。
    // 构建 require 函数，目的是为了获取模块暴露出来的内容
    const result = `
    (function(modules){
      // 创建require函数， 它接受一个模块ID（这个模块id是数字0，1，2） ，它会在我们上面定义 modules 中找到对应是模块.
      function require(id){
        const [fn, mapping] = modules[id];
        function localRequire(relativePath){
          // 根据模块的路径在mapping中找到对应的模块id
          return require(mapping[relativePath]);
        }
        const module = {exports:{}};
        // 执行每个模块的代码。
        fn(localRequire,module,module.exports);
        return module.exports;
      }
      //执行入口文件，
      require(0);
    })({${modules}})
  `;
    // 当生成的内容写入到文件中
    fs.writeFileSync('./bundle.js', result)
}

const graph = createGraph("./entry.js");
const ret = bundle(graph);