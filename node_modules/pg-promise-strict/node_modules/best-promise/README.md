# best-promise
select the best promise available at certain moment or leave the choice to the end user

<!--multilang v0 en:README.md es:LEEME.md -->

![extending](https://img.shields.io/badge/stability-extending-yellow.svg)
[![version](https://img.shields.io/npm/v/best-promise.svg)](https://npmjs.org/package/best-promise)
[![downloads](https://img.shields.io/npm/dm/best-promise.svg)](https://npmjs.org/package/best-promise)
[![Build Status](https://secure.travis-ci.org/emilioplatzer/best-promise.svg)](http://travis-ci.org/emilioplatzer/best-promise)

<!--multilang buttons-->

language: ![English](https://raw.githubusercontent.com/codenautas/multilang/master/img/lang-en.png)
also available in:
[![Spanish](https://raw.githubusercontent.com/codenautas/multilang/master/img/lang-es.png)](LEEME.md) - 

<!--lang:en-->

***Based on [any-promise](npmjs.org/package/any-promise)***

When testing with Travis-CI ***best-promise*** selects a promise library randomly.

In the rest of cases it will work identically to [any-promise](npmjs.org/package/any-promise).

When normal use attempts to load libraries in the following order:

<!--lang:es--]

***Basado en [any-promise](npmjs.org/package/any-promise)***

Cuando se usa con Travis-CI ***best-promise*** seleccionará al azar una librería Promise. 

En el resto de los casos funciona igual que [any-promise](npmjs.org/package/any-promise).

La lista de módulos Promise es:

[!--lang:*-->

  - [es6-promise](https://github.com/jakearchibald/es6-promise)
  - [promise](https://github.com/then/promise)
  - [native-promise-only](https://github.com/getify/native-promise-only)
  - [bluebird](https://github.com/petkaantonov/bluebird)
  - [rsvp](https://github.com/tildeio/rsvp.js)
  - [when](https://github.com/cujojs/when)
  - [q](https://github.com/kriskowal/q)

<!--lang:en-->
  
If no library is installed, attempts to export the global `Promise` (native or polyfill). 

You can specify the `PROMISE_IMPL` env variable or the `PROMISE_RANDOM` variable to **yes**

<!--lang:es--]
  
Si no hay ninguna librearía instalada ***any-promise*** intenta exportar el módulo global `Promise` (ya sea nativo o el polyfill). 

Se puede especificar la librería elegida en cada momento usando la variable de ambiente `PROMISE_IMPL` 
o también se puede usar la variable de ambiente `PROMISE_RANDOM` para que sortee aunque no esté en Travis-CI.

[!--lang:*-->

```javascript
var Promise = require('best-promise').Promise;

return Promise
  .all([xf, f, init, coll])
  .then(fn);

return new Promise(function(resolve, reject){
  try {
    resolve(item);
  } catch(e){
    reject(e);
  }
});

```

<!--lang:en-->
  
## improvements

<!--lang:es--]

## mejoras

[!--lang:en-->
  
You can abrevite the common tasks

<!--lang:es--]
  
Una forma común de las promesas es empezar la primera función dentro de un then,
de ese modo si la expresión que arma los parámetros lanza un error 
se captura dentro de la cadena de promesas

[!--lang:*-->

```js

var Promises = require('best-promise');
var fs = require('fs-promise');

Promises.start(function(){
    return fs.stat(path+path.sep+fileName);
}).then(function(stat){
    // ...
});

```
