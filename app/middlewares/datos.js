var db = require('../../config/database.js').db;
var locales = require('../controllers/locales.js');
var queries = require('../controllers/queries.js');

/*console.log('db', db);
db.one(queries.obtener_datos_app)
.then(function(datos){
	console.log(datos);
});*/

module.exports = function (req, res, next){
	console.log('middle_datossssssss');
	var traducciones = locales.getTranslations(req, res);
	console.log('dedkhbke');
	var id_usuario = req.user ? req.user._id : 'undefined';
	console.log('deds,am.mns.an.khbke');
	var variables_locales = {
		contenido : traducciones,
		message: {
			error: req.flash('error'),
			success: req.flash('success'),
			info : req.flash('info'),
		},
		user: req.user, 
		id_usuario: id_usuario
	};
	console.log('111111111111');
	db.one(queries.obtener_datos_app) // consultamos los datos de la app
		.then (function(datos_app){
			console.log(datos_app);
			variables_locales.datos_app = datos_app; // obtenemos datos app
			
			if (! req.user) throw new Error('no estás loggeado'); // Si no hay usuario conectado --> Continuamos adelante
											   // ya que no consultamos notificaciones ni acciones	
			
			return db.query(queries.obtener_notificaciones, req.user._id); // consultamos notificaciones
			
		})
		.then(function(notificaciones){
			// obtenemos notificaciones
			
			notificaciones.forEach(function(n){
				n.denuncia = n.denuncia[0];
				n.denuncia.geometria = n.denuncia.geometria_pu || n.denuncia.geometria_li || n.denuncia.geometria_po;
				//console.log(n.denuncia, 'tipossss');
			});
			
			variables_locales.mis_notificaciones = notificaciones; // ls pasamos al objeto res.locals
			
			return db.query(queries.obtener_acciones, req.user._id); // consultamos acciones
			
		})
		.then (function(acciones){
			// obtenemos acciones
			acciones.forEach(function(n){
				n.denuncia = n.denuncia[0];
				n.denuncia.geometria = n.denuncia.geometria_pu || n.denuncia.geometria_li || n.denuncia.geometria_po;				
				//console.log(n.denuncia, 'tipossss');
			});
			
			variables_locales.mis_acciones = acciones;
			res.locals = variables_locales;
			console.log(variables_locales);
			next(); // siguiente ruta o middleware
		})
		.catch(function (error) {
			console.log('Error middleware ' + error); 
			res.locals = variables_locales;
			next(); // siguiente ruta o middleware
		});
	
};