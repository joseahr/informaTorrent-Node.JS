var Promises = {};

Promises.Promise = require('./any-promise.js');
process.env.PROMISE_IMPL = 'best-promise';

Promises.start = function then(f){
    if(!f){
        return Promises.Promise.resolve();
    }
    return Promises.Promise.resolve().then(f);
};

Promises.reject = function reject(err){
    return Promises.Promise.reject(err);
};

Promises.all = function all(promises){
    return Promises.Promise.all(promises);
};

Promises.make = function make(functionResolveReject){
    return new Promises.Promise(functionResolveReject);
}

Promises.wrapErrRes = function wrapErrRes(functionWithCallbackErrRes){
    return function(){
        var This=this;
        var newArguments=Array.prototype.slice.call(arguments,0);
        return new Promises.Promise(function(resolve, reject){
            newArguments.push(function(err,ok){
                if(err){
                    reject(err);
                }else{
                    resolve(ok);
                }
            });
            functionWithCallbackErrRes.apply(This,newArguments);
        });
    }
}

Promises.sleep = function sleep(milliseconds){
    return Promises.make(function(resolve){
        setTimeout(resolve,milliseconds);
    });
}

module.exports = Promises;