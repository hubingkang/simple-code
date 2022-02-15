const MyPromise = require('./promise');

const myPromise = MyPromise;

/**
 * 验证Promise.resolve()方法
 */
const promise1 = myPromise.resolve(123);

promise1.then((value) => {
  console.log(value);
  // expected output: 123
});

// Resolve一个thenable对象
var p1 = myPromise.resolve({
    then: function (onFulfill) {
        onFulfill("Resolving");
    }
});
console.log(p1 instanceof myPromise) // true, 这是一个Promise对象

setTimeout(() => {
    console.log('p1 :>> ', p1);
}, 1000);

p1.then(function (v) {
    console.log(v); // 输出"fulfilled!"
}, function (e) {
    // 不会被调用
});

// Thenable在callback之前抛出异常
// myPromise rejects
var thenable = {
    then: function (resolve) {
        throw new TypeError("Throwing");
    }
};

var p2 = myPromise.resolve(thenable);
p2.then(function (v) {
    // 不会被调用
}, function (e) {
    console.log(e); // TypeError: Throwing
});

// 结果
// true
// 123
// Resolving
// TypeError: Throwing
// p1 :>> myPromise {PromiseState: 'fulfilled', PromiseResult: 'Resolving', onFulfilledCallbacks: Array(1), onRejectedCallbacks: Array(1)}


/**
 * 验证Promise.reject()方法
 */
 myPromise.reject(new Error('fail')).then(function () {
  // not called
}, function (error) {
  console.error(error); // Error: fail
});
// Error: fail

/**
 * 验证Promise.prototype.catch方法
 */
var p1 = new myPromise(function (resolve, reject) {
    resolve('Success');
});

p1.then(function (value) {
    console.log(value); // "Success!"
    throw 'oh, no!';
}).catch(function (e) {
    console.log(e); // "oh, no!"
}).then(function () {
    console.log('after a catch the chain is restored');
}, function () {
    console.log('Not fired due to the catch');
});

// 以下行为与上述相同
p1.then(function (value) {
    console.log(value); // "Success!"
    return Promise.reject('oh, no!');
}).catch(function (e) {
    console.log(e); // "oh, no!"
}).then(function () {
    console.log('after a catch the chain is restored');
}, function () {
    console.log('Not fired due to the catch');
});

// 捕获异常
const p2 = new myPromise(function (resolve, reject) {
    throw new Error('test');
});
p2.catch(function (error) {
    console.log(error);
});
// Error: test

// 输出
// Success
// Success
// Error: test
// oh, no!
// oh, no!
// after a catch the chain is restored
// after a catch the chain is restored


/**
 * 验证Promise.prototype.finally方法
 */
let p1 = new Promise(function (resolve, reject) {
    resolve(1)
}).then(function (value) {
    console.log(value);
}).catch(function (e) {
    console.log(e);
}).finally(function () {
    console.log('finally');
});

// 输出
// 1
// finally

/**
 * 验证Promise.all()方法
 */
const promise1 = myPromise.resolve(3);
const promise2 = 42;
const promise3 = new myPromise((resolve, reject) => {
    setTimeout(resolve, 100, 'foo');
});

myPromise.all([promise1, promise2, promise3]).then((values) => {
    console.log(values);
});
// expected output: Array (3) [3, 42, 'foo']

// 失败的测试
var p1 = new Promise((resolve, reject) => {
  setTimeout(resolve, 1000, 'one');
});
var p2 = new Promise((resolve, reject) => {
  setTimeout(resolve, 2000, 'two');
});
var p3 = new Promise((resolve, reject) => {
  setTimeout(resolve, 3000, 'three');
});
var p4 = new Promise((resolve, reject) => {
  setTimeout(resolve, 4000, 'four');
});
var p5 = new Promise((resolve, reject) => {
  reject('reject');
});

Promise.all([p1, p2, p3, p4, p5]).then(values => {
  console.log(values);
}, reason => {
  console.log(reason)
});
//From console:
//"reject"

/**
 * 验证Promise.allSettled()方法
 */
const promise1 = myPromise.resolve(3);
const promise2 = 1;
const promises = [promise1, promise2];

myPromise.allSettled(promises).
then((results) => results.forEach((result) => console.log(result)));

setTimeout(() => {
    const p1 = myPromise.resolve(3);
    const p2 = new myPromise((resolve, reject) => setTimeout(reject, 100, 'foo'));
    const ps = [p1, p2];

    myPromise.allSettled(ps).
    then((results) => results.forEach((result) => console.log(result)));
}, 1000);

myPromise.allSettled([]).then((results) => console.log(results))

// (0) []
// {status: 'fulfilled', value: 3}
// {status: 'fulfilled', value: 1}
// {status: 'fulfilled', value: 3}
// {status: 'rejected', reason: 'foo'}

/**
 * 验证Promise.any()方法
 */

// console.log(new AggregateError('All promises were rejected'));

myPromise.any([]).catch(e => {
    console.log(e);
});

const pErr = new Promise((resolve, reject) => {
    reject("总是失败");
});

const pSlow = new Promise((resolve, reject) => {
    setTimeout(resolve, 500, "最终完成");
});

const pFast = new Promise((resolve, reject) => {
    setTimeout(resolve, 100, "很快完成");
});

Promise.any([pErr, pSlow, pFast]).then((value) => {
    console.log(value);
    // 期望输出: "很快完成"
})


const pErr1 = new myPromise((resolve, reject) => {
    reject("总是失败");
});

const pErr2 = new myPromise((resolve, reject) => {
    reject("总是失败");
});

const pErr3 = new myPromise((resolve, reject) => {
    reject("总是失败");
});

myPromise.any([pErr1, pErr2, pErr3]).catch(e => {
    console.log(e);
})

// AggregateError: All promises were rejected
// AggregateError: All promises were rejected
// 很快完成

/**
 * 验证Promise.race()方法
 */
// 数组全是非Promise值，测试通过
let p1 = myPromise.race([1, 3, 4]);
setTimeout(() => {
    console.log('p1 :>> ', p1);
});

// 空数组，测试通过
let p2 = myPromise.race([]);
setTimeout(() => {
    console.log('p2 :>> ', p2);
});

const p11 = new myPromise((resolve, reject) => {
    setTimeout(resolve, 500, 'one');
});

const p22 = new myPromise((resolve, reject) => {
    setTimeout(resolve, 100, 'two');
});

// // 数组里有非Promise值，测试通过
myPromise.race([p11, p22, 10]).then((value) => {
    console.log('p3 :>> ', value);
    // Both resolve, but p22 is faster
});
// expected output: 10

// 数组里有'已解决的Promise' 和 非Promise值 测试通过
let p12 = myPromise.resolve('已解决的Promise')
setTimeout(() => {
    myPromise.race([p12, p22, 10]).then((value) => {
        console.log('p4 :>> ', value);
    });
    // expected output:已解决的Promise
});

// Promise.race的一般情况 测试通过
const p13 = new myPromise((resolve, reject) => {
    setTimeout(resolve, 500, 'one');
});

const p14 = new myPromise((resolve, reject) => {
    setTimeout(resolve, 100, 'two');
});

myPromise.race([p13, p14]).then((value) => {
    console.log('p5 :>> ', value);
    // Both resolve, but promise2 is faster
});
