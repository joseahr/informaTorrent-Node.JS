var db = require('../../config/database.js').db;
var locales = require('../controllers/locales.js');
var queries = require('../controllers/queries.js');

module.exports = function (req, res, next){
	console.log('middle_datossssssss');
	res.locals['contenido'] = locales.getTranslations(req, res);
	res.locals['message'] = {
		error: req.flash('error'),
		success: req.flash('success'),
		info : req.flash('info'),
	};
	res.locals['user'] = req.user;
	res.locals['id_usuario'] = req.user ? req.user._id : 'undefined';
	// Consultamos los datos de la app
	db.one(queries.obtener_datos_app)
	.then (function(datos_app){
		//console.log(datos_app);
		res.locals['datos_app'] = datos_app;
		next();
	})
	.catch(function (error) {
		console.log('Error middleware ' + error); 
		next(); // siguiente ruta o middleware
	});
	
};