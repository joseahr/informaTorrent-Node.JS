/*
======================================
===              I18N              ===
======================================
*/
var i18n = require('i18n-2');
module.exports = function(app){

i18n.expressBind(app, {
  locales: ['es', 'val', 'en'],
  defaultLocale: 'es',
  cookieName: 'locale',
  directory : './locales'
});
};