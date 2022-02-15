const PENDING = "pending";
const FULFILLED = "fulfilled";
const REJECTED = "rejected";

class MyPromise {
  constructor(executor) {
      try {
        executor(this.resolve, this.reject);
      } catch (e) {
        this.reject(e);
      }
  }

  PromiseState = PENDING;
  PromiseResult = null;
  onFulfilledCallbacks = [];
  onRejectedCallbacks = [];

  resolve = (result) => {
    if (this.PromiseState === PENDING) {

      /**
       * new Promise((resolve, reject) => {
       *  resolve();
       *  console.log(1) // 异步作用是让这里先执行
       * })
       */
      setTimeout(() => {
        this.PromiseState = FULFILLED;
        this.PromiseResult = result;
        this.onFulfilledCallbacks.forEach(callback => {
          callback(result);
        });
      })
    };
  }

  reject = (reason) => {
    if (this.PromiseState === PENDING) {
      setTimeout(() => {
        this.PromiseState = REJECTED;
        this.PromiseResult = reason;
        this.onRejectedCallbacks.forEach(callback => {
          callback(reason);
        });
      })
    };
  }

  then (onFulfilled, onRejected) {
    onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : value => value;
    onRejected = typeof onRejected === 'function' ? onRejected : value => {
      throw value
    };

    let promise2 = new MyPromise((resolve, reject) => {
      // 这里写 FULFILLED 不要写 this.FULFILLED 否则测试可能不通过
      if (this.PromiseState === FULFILLED) {
        /**
         *  new Promise((resolve, reject) => {
         *    resolve();
         *  }).then(() => {
         *    console.log(2)
         *  })
         *  console.log(1) // 异步作用是让这里先执行
         */
        setTimeout(() => {
          try {
            const x = onFulfilled(this.PromiseResult);
            resolvePromise(promise2, x, resolve, reject);
          } catch (e) {
            reject(e);
          }
        });
      } else if (this.PromiseState === REJECTED) {
        setTimeout(() => {
          try {
            const x = onRejected(this.PromiseResult);
            resolvePromise(promise2, x, resolve, reject);
          } catch (e) {
            reject(e);
          }
        });
      } else if (this.PromiseState === PENDING) {
        this.onFulfilledCallbacks.push(() => {
          try {
            const x = onFulfilled(this.PromiseResult);
            resolvePromise(promise2, x, resolve, reject);
          } catch (e) {
            reject(e);
          }
        });
        this.onRejectedCallbacks.push(() => {
          try {
            const x = onRejected(this.PromiseResult);
            resolvePromise(promise2, x, resolve, reject);
          } catch (e) {
            reject(e);
          }
        });
      }
    })

    return promise2
  }

  catch (onRejected) {
    return this.then(undefined, onRejected);
  }

  finally (callback) {
    // 无论 resolve 还是 reject 都会执行
    return this.then(callback, callback);
  }
}

function resolvePromise(promise2, x, resolve, reject) {
  if (x === promise2) {
    return reject(new TypeError("Chaining cycle detected for promise"));
  }

  if (x instanceof MyPromise) {
    if (x.PromiseState === PENDING) {
      x.then(y => {
        resolvePromise(promise2, y, resolve, reject);
      }, reject);
    } else if (x.PromiseState === FULFILLED) {
      resolve(x.PromiseResult);
    } else if (x.PromiseState === REJECTED) {
      reject(x.PromiseResult);
    }
  } else if (x !== null && (typeof x === 'object' || typeof x === 'function')) {
    try {
      var then = x.then;
    } catch (e) {
      return reject(e);
    }

    if (typeof then === 'function') {
      let called = false;
      try {
        then.call(
          x,
          y => {
            if (called) return;
            called = true;
            resolvePromise(promise2, y, resolve, reject);
          },
          r => {
            if (called) return;
            called = true;
            reject(r);
          }
        )
      } catch (e) {
        if (called) return;
        called = true;
        reject(e);
      }
    } else {
      resolve(x);
    }
  } else {
    resolve(x);
  }
}


MyPromise.resolve = function(value) {
  // 如果这个值是一个 promise ，那么将返回这个 promise 
  if (value instanceof MyPromise) {
    return value
  } else if (value instanceof Object && 'then' in value) {
    // 如果这个值是thenable（即带有`"then" `方法），返回的promise会“跟随”这个thenable的对象，采用它的最终状态；
    return new MyPromise((resolve, reject) => {
      value.then(resolve, reject);
    })
  } else {
    // 否则返回的promise将以此值完成，即以此值执行`resolve()`方法 (状态为fulfilled)
    return new MyPromise((resolve) => {
      resolve(value)
    })
  }
}

MyPromise.reject = function(value) {
  return new MyPromise((resolve, reject) => {
    reject(value)
  })
}

MyPromise.all = function(promises) {
  return new MyPromise((resolve, reject) => {
    // 参数校验
    if (Array.isArray(promises)) {

      let result = []; // 储存结果
      let count = 0; // 计数器

       // 如果传入的参数是一个空的可迭代对象，则返回一个已完成（already resolved）状态的 Promise
      if (promises.length === 0) {
        return resolve(result);
      }

      promises.forEach((item, index) => {
        // 判断是否为 promise, 甚至下面 if 都可以去掉，因为调用 MyPromise.resolve 也已经做过相关判断了
        if (item instanceof MyPromise || (item instanceof Object && 'then' in item)) {
          MyPromise.resolve(item).then(
            value => {
              count++;
              result[index] = value;
              count === promises.length && resolve(result);
            },
            reason => {
               /**
                * 如果传入的 promise 中有一个失败（rejected），
                * Promise.all 异步地将失败的那个结果给失败状态的回调函数，而不管其它 promise 是否完成
                */
              reject(reason);
            }
          )
        } else {
          // 参数非 promise 的原样返回
          count++;
          result[index] = item;
          count === promises.length && resolve(result);
        }
      })
    } else {
      return reject(new TypeError('Argument is not iterable'))
    }
  })
}

// 数组中所有的 promise 状态为 resolve 或 reject 才返回， all 是只要有一个 reject 就返回了
// 而且将不是 promise 类型的值转化为 promise
MyPromise.allSettled = function (promises) {
  return new MyPromise((resolve, reject) => {
    if (Array.isArray(promises)) {
      let result = [];
      let count = 0;

      if (promises.length === 0) return resolve(result);
      promises.forEach((item, index) => {
        MyPromise.resolve(item).then(
          value => {
            count++;
            result[index] = {
              status: 'fulfilled',
              value
            };
            count === promises.length && resolve(result);
          },
          reason => {
            count++;
            result[index] = {
              status: 'rejected',
              reason
            };
            count === promises.length && resolve(result);
          }
        )

      })

    } else {
      return reject(new TypeError('Argument is not iterable'));
    }
  })
}

MyPromise.any = function(promises) {
  return new MyPromise((resolve, reject) => {
    if (Array.isArray(promises)) {
      let errors = [];
      let count = 0;

      // 如果传入的参数是一个空的可迭代对象，则返回一个 已失败（already rejected） 状态的 Promise。
      if (promises.length === 0) return reject(new AggregateError('All promises were rejected'));

      promises.forEach((item, index) => {
        MyPromise.resolve(item).then(
          value => {
            // 只要其中的一个 promise 成功，就返回那个已经成功的 promise 
            resolve(value);
          },
          reason => {
            count++;
            errors.push(reason);
            /**
             * 如果可迭代对象中没有一个 promise 成功，就返回一个失败的 promise 和AggregateError类型的实例，
             * AggregateError是 Error 的一个子类，用于把单一的错误集合在一起。
             */
            count === promises.length && reject(new AggregateError(errors));
          }
        )
      })
    } else {
      return reject(new TypeError('Argument is not iterable'));
    }
  })
}

MyPromise.race = function(promises) {
  return new MyPromise((resolve, reject) => {
    // 参数校验
    if (Array.isArray(promises)) {
      // 如果传入的迭代promises是空的，则返回的 promise 将永远等待。
      if (promises.length > 0) {
        promises.forEach(item => {
          /**
           * 如果迭代包含一个或多个非承诺值和/或已解决/拒绝的承诺，
           * 则 Promise.race 将解析为迭代中找到的第一个值。
           */
          MyPromise.resolve(item).then(resolve, reject);
        })
      }
    } else {
      return reject(new TypeError('Argument is not iterable'))
    }
  })
}

/**
 * 测试用例相关代码
 */
// MyPromise.deferred = function () {
//   let result = {};
//   result.promise = new MyPromise((resolve, reject) => {
//     result.resolve = resolve;
//     result.reject = reject;
//   });
//   return result;
// }


module.exports = MyPromise;
