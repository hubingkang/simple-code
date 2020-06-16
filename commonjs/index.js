function require(p) {
    var path = require.resolve(p);

    // 从 modules 中读取到回调函数内容
    var module = require.modules[path];
    if (!module) throw new Error('failed to require "' + p + '"');
    if (!module.exports) {
        module.exports = {};

        // 执行回调函数, 给 module.exports 绑定上回调函数中 module.exports 的函数
        module.call(module.exports, module, module.exports, require.relative(path));
    }
    return module.exports;
}

require.modules = {};

// 正确返回目标路径
require.resolve = function (path) {
    var orig = path;
    var reg = path + '.js';
    var index = path + '/index.js';
    return require.modules[reg] && reg
        || require.modules[index] && index
        || orig;
};

require.register = function (path, fn) {
    require.modules[path] = fn;
};

require.relative = function (parent) {
    return function (p) {
        if ('.' != p.charAt(0)) return require(p);
        var path = parent.split('/');
        var segs = p.split('/');
        path.pop();

        for (var i = 0; i < segs.length; i++) {
            var seg = segs[i];
            if ('..' == seg) path.pop();
            else if ('.' != seg) path.push(seg);
        }

        return require(path.join('/'));
    };
};

// 将 foo.js 注册到 modules 上
require.register("./foo.js", function (module, exports, require) {
    module.exports = function (x) {
        console.log("hello", x);
    };
});

var foo = require("./foo.js");
foo("Hi");