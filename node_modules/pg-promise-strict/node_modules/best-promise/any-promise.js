"use strict";
var PROMISE_IMPL = process.env.PROMISE_IMPL,
    undef;

var PROMISE_RANDOM = process.env.PROMISE_RANDOM || process.env.TRAVIS; 
    
module.exports = (function(){
  var libs;
  if(PROMISE_IMPL !== undef && PROMISE_IMPL !== 'best-promise'){
    libs = [process.env.PROMISE_IMPL];
  } else {
    libs = [
      "es6-promise",
      "promise",
      "native-promise-only",
      "bluebird",
      "rsvp",
      "when",
      "q"];
  }
  if(PROMISE_RANDOM !== undef){
      var cut=Math.floor(Math.random()*libs.length);
      libs = libs.slice(cut,libs.length).concat(libs.slice(0,cut));
      console.log('=-=-=-=-=-=-=-=-= SELECTED RANDOM Promise LIBRARY',cut);
  }
  var i = 0, len = libs.length, lib;
  for(; i < len; i++){
    if(PROMISE_RANDOM !== undef){
      console.log('=-=-=-=-=-=-=-=-= try',libs[i]);
    }
    try {
      lib = require(libs[i]);
      if(lib.Promise !== undef){
        return lib.Promise;
      }
      return lib;
    } catch(e){}
  }
  if(typeof Promise !== 'undefined'){
    return Promise;
  }
  throw new Error('Must install one of: '+libs.join());
})();
