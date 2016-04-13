var usuarioModel = require('../models/usuario.js');
	usuarioModel = new usuarioModel();

module.exports = function(req, res, next){
	if(!req.user)
		return next();
	console.log('middle_usuario');
	// Obtenemos las notificaciones
	usuarioModel.get_notificaciones(req.user._id, function(error, notificaciones){
		console.log('middle_usuario');
		if(!notificaciones)
			res.locals['mis_notificaciones'] = [];
		else
			res.locals['mis_notificaciones'] = notificaciones;
		// Obtenemos las acciones
		usuarioModel.get_acciones(req.user._id, function(error, acciones){
			if(!acciones)
				res.locals['mis_acciones'] = [];
			else
				res.locals['mis_acciones'] = acciones;
			console.log('middle_usuario');
			return next();
		});
	});
};