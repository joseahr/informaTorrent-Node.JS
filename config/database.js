// config/database.js
var promiseLib = require('bluebird'); // Librería de Promises - Especificación ES6

// Opciones de la bdd - Recibe la librería de Promises
var pg_options = {
	promiseLib : promiseLib
};

var pgp = require('pg-promise')(pg_options); // Objeto pg-promise

// Hace logs en la consola de la consultas, errores, conexiones...
require('pg-monitor').attach(pg_options, ['query', 'error', 'connect', 'disconnect', 'task', 'transact']);

exports.db = pgp('postgres://jose:jose@localhost/denuncias'); // Objeto bdd - denuncias
exports.dbCarto = pgp('postgres://jose:jose@localhost/carto_torrent'); // Objeto bbd - cartografía

exports.pgp = pgp;