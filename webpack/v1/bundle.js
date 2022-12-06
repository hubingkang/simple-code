
(function (modules) {
  //创建require函数， 它接受一个模块ID（这个模块id是数字0，1，2） ，它会在我们上面定义 modules 中找到对应是模块.
  function require(id) {
    const [fn, mapping] = modules[id];
    function localRequire(relativePath) {
      //根据模块的路径在mapping中找到对应的模块id
      return require(mapping[relativePath]);
    }
    const module = { exports: {} };
    //执行每个模块的代码。
    fn(localRequire, module, module.exports);
    return module.exports;
  }
  //执行入口文件，
  require(0);
})({
  0: [
    function (require, module, exports) {
      "use strict";

      var _message = require("./message.js");

      var _message2 = _interopRequireDefault(_message);

      function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

      console.log(_message2.default); // entry.js
    },
    { "./message.js": 1 },
  ], 1: [
    function (require, module, exports) {
      "use strict";

      Object.defineProperty(exports, "__esModule", {
        value: true
      });

      var _name = require("./name.js");

      exports.default = "hello " + _name.name + "!"; // message.js
    },
    { "./name.js": 2 },
  ], 2: [
    function (require, module, exports) {
      "use strict";

      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      // name.js

      var name = exports.name = 'world';
    },
    {},
  ],
})
