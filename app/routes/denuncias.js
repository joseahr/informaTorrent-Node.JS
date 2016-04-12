var router = require('express').Router();

var multer = require('../../config/multer.js');
var multer_temp_denuncia = multer.crear_multer('./public/files/temp', multer.filename_temp_img).single('file');

var validator = require('validator');
var path = require('path');

var denunciaModel = require('../models/denuncia.js');
	denunciaModel = new denunciaModel();

router.use(require('../middlewares/datos.js'));

// Página denuncias ordenadas por página
router.get('/', function(req, res, next){
	// Página a la que queremos acceder
	var page = req.query.page;
	// Comprobamos que la página es numérica
	if (!page){
		var error = new Error(req.i18n.__('faltan_parametros') + ': page');
		error.status = 500;
		return next(error);
	}
	if (!validator.isNumeric(page.toString())){
		// Si no es numérica error
		var error = new Error(req.i18n.__('parametro_no_valido'));
		error.status = 500;
		return next(error);
	}
	// Si la página es menor o igual a 0 error
	if(page <= 0){
		var error = new Error(req.i18n.__('parametro_no_valido'));
		error.status = 500;
		return next(error);
	}
	denunciaModel.find_by_pagina(page, function(error, result){
		if(error) 
			return next(error);
		res.render('denuncias', result);
	});

});

// Visor
router.get('/visor', function(req, res, next){
	denunciaModel.denuncias_visor(function(error, result){
		if(error)
			return next(error);
		res.render('visor', result);
	});
});

router.use(require('../middlewares/logged.js'));

router.route('/nueva')
// Página nueva denuncia
.get(function(req, res, next){
	console.log('nueva');
	denunciaModel.crear_temp_dir(function(error, token){
		if(error)
			return next(error);
		res.render('nueva', {random : token});
	});
})
// Petición añadir denuncia
.post(function(req, res){
	var errormsg = ''; // String para mensajes de error
	// comprobando datos de la denuncia
	if(!req.body.tempDirID) errormsg += 'No hay tempdir';
	if(!req.body.tags || req.body.tags.length < 2) errormsg += req.i18n.__('denuncia_tags') + '\n';
	if(!validator.isLength(req.body.titulo, 5, 50)) errormsg += req.i18n.__('denuncia_titulo') + '\n';
	if(!validator.isLength(req.body.contenido, 50, 10000)) errormsg += req.i18n.__('denuncia_contenido') + '\n';
	if(req.body.wkt == undefined) errormsg += req.i18n.__('denuncia_geometria') + '\n';	
	// Si hay algún error en los datos devolvemos los errores
	if(errormsg.length > 0)
		return res.status(500).send({type: 'error', msg: errormsg});

	denunciaModel.comprobar_geometria(wkt, function(error){
		if(error)
			return res.status(500).json({type : 'error', msg : req.i18n.__(error.msg)});
		// Asignamos id usuario al body
		req.body.id_usuario = req.user._id;
		// Guardamos la denuncia
		denunciaModel.guardar(req.body, function(error, result){
			if(error)
				return res.status(500).json({type : 'error', msg : error.toString()})
			res.json(result);
		});
	});
});

// Subir imagen a la carpeta temporal
router.post('/imagen/temporal', function(req, res, next){
	multer_temp_denuncia(req, res, function(error){
		// Enviamos un mensaje de error
		if(error)
			return res.status(500).json({type : 'error', msg : error.toString()});
		// obetenemos la imagen subida
		var file = req.file;
		// obtenemos su extension
		var extension = path.extname(file.path);
		// Si la extensión no está dentro de nuestros formatos soportados
		if(!extension.match(formatsAllowed)){
			// Eliminamos la imagen subida si no es de uno de los formatos permitidos
			var to = path.join('./public/files/temp', path.basename(file.path));
			// Eliminamos la imagen del directorio temporal
			fs.unlink(to, function(error_){
				if(error_) console.log('error unlink ' + error_);
				// Enviamos error
				var error = new Error(req.i18n.__('formato_no_permitido'));
				return res.status(413).json({type : 'error', msg : error.toString()});
			});
		}
		else {
			// La imagen se ha subido correctamente y es de un formato soportado
			return res.json({
				type: 'success', 
				msg: 'Archivo subido correctamente a ' + to + ' (' + (file.size.toFixed(2)) + ' kb)'
			});
		}
		
	});
});

// Eliminar imagen de la carpeta temporal
router.post('/imagen/temporal/eliminar', function(req, res, next){
	// Comprobamos parámetros
	if(!(req.query.tempdir && req.query.filename))
		return res.status(500).json({type : 'error', msg : req.i18n.__('error_borrando_imagen') + req.i18n.__('error_borrando_imagen_params')})
	denunciaModel.eliminar_imagen_temporal(req.query.tempdir, req.query.filename, function(error){
		if(error)
			return res.status(500).json({type : 'error', msg : req.i18n.__('error_borrando_imagen') + error});
		res.json({type : 'success', msg : req.i18n.__('imagen_eliminada')})
	});
});

router.param('id_denuncia', function(req, res, next, id_denuncia){
	console.log('param id_denuncia');
	denunciaModel.find_by_id(id_denuncia, function(error, denuncia){
		req.denuncia = denuncia;
		next();
	});
});

router.route('/:id_denuncia/actualizar')
// Página para actualizar la denuncia
.get(function(req, res, next){
	if(req.denuncia.id_usuario != req.user._id) 
		return next({type : 'error', msg : req.i18n.__('no_tiene_permiso')});
	denunciaModel.crear_temp_dir(function(error, token){
		if(error)
			return next(error);
		res.render('editar', {denuncia: req.denuncia, random : token});
	});
})
.post(function(req, res, next){
	if(req.denuncia.id_usuario != req.user._id) 
		return res.status(500).json({type : 'error', msg : req.i18n.__('no_tiene_permiso')});
	var errormsg = ''; // String para mensajes de error
	// comprobando datos de la denuncia
	if(!req.body.tempDirID) errormsg += 'No hay tempdir';
	if(!req.body.tags || req.body.tags.length < 2) errormsg += req.i18n.__('denuncia_tags') + '\n';
	if(!validator.isLength(req.body.titulo, 5, 50)) errormsg += req.i18n.__('denuncia_titulo') + '\n';
	if(!validator.isLength(req.body.contenido, 50, 10000)) errormsg += req.i18n.__('denuncia_contenido') + '\n';
	if(req.body.wkt == undefined) errormsg += req.i18n.__('denuncia_geometria') + '\n';	
	// Si hay algún error en los datos devolvemos los errores
	if(errormsg.length > 0)
		return res.status(500).send({type: 'error', msg: errormsg});
	// Comprobamos geometría
	denunciaModel.comprobar_geometria(wkt, function(error){
		if(error)
			return res.status(500).json({type : 'error', msg : req.i18n.__(error.msg)});
		// Asignamos al body la id del usuario
		req.body.id_denuncia = req.user._id;
		// Asignamos al body la denuncia original
		req.body.denuncia_original = req.denuncia;
		// Guardamos los cambios
		denunciaModel.editar(req.body, function(error, result){
			if(error)
				return res.status(500).json({type : 'error', msg : error.toString()})
			res.json(result);
		});
	});
});

// Eliminar denuncia
router.post('/:id_denuncia/eliminar', function(req, res){
	if(req.user._id != req.denuncia.id_usuario) 
		return res.status(500).json({type : 'error', msg : req.i18n.__('no_tiene_permiso')});
	denunciaModel.eliminar(req.denuncia.gid, function(error){
		if(error)
			return res.status(500).json({type : 'error', msg : error.toString()});
		res.json({
			type : 'success', 
			msg : req.i18n.__('denuncia_con_id') + ': ' + req.denuncia.gid + req.i18n.__('eliminada_correctamente')
		});
	});
});

// Eliminar imagen de la carpeta final de denuncias
router.post('/:id_denuncia/imagen/eliminar', function(req, res, next){
	if(!req.query.path)
		return res.status(500).json(req.i18n.__('parametro_no_valido'));
	else {
		// path de la imagen a eliminar
		var path = req.query.path;
		// buscamos la denuncia que contiene esta imagen
		denunciaModel.find_by_path_img(path, function(error, denuncia){
			if(denuncia.id_usuario != req.user._id)
				// Si es un usuario distinto al propietario el que quiere 
				// eliminar la denuncia --> error
				return res.status(500).json({type : 'error', msg : req.i18n.__('no_tiene_permiso')});
			denunciaModel.eliminar_imagen(path, function(error){
				if(error)
					return res.status(500).json({type : 'error', msg : error.toString()});
				res.json({type : 'success', msg : req.i18n.__('imagen') + '"' + path + '"' + req.i18n.__('eliminada_correctamente')});
			});
		});
	}
});

// Añadir un comentario
router.post('/:id_denuncia/comentar', function(req, res, next){
	// Comprobamos parámetros
	if (!req.body.contenido || !req.denuncia.gid) 
		return res.status(500).json({type : 'error', msg : req.i18n.__('error_comentario')});
	if (!validator.isLength(req.body.contenido, 10, 1000))
		return res.status(500).json({type : 'error', msg : req.i18n.__('error_comentario') +  req.i18n.__('error_comentario_params')});
	
	denunciaModel.añadir_comentario({
		contenido : req.body.contenido,
		id_denuncia : req.denuncia.gid,
		usuario_from : req.user
	}, function(error){
		if(error)
			return res.status(500).json({type : 'error', msg : error.toString()});
		res.json({type : 'success', contenido : req.body.contenido })
	});
});

router.get('/:id_denuncia/:titulo', function(req, res){
	console.log(req.params.titulo, req.denuncia.titulo);
	if(req.params.titulo != req.denuncia.titulo.replace(' ', '-'))
		return res.redirect('/app/denuncias/' + req.denuncia.gid + '/' + req.denuncia.titulo.replace(' ', '-'));
	res.render('denuncia', {denuncia: req.denuncia});
});
// Página denuncia
router.get('/:id_denuncia', function(req, res, next){
	res.redirect('/app/denuncias/' + req.denuncia.gid + '/' + req.denuncia.titulo.replace(' ', '-'));
	/*console.log('La denuncia está en el request: ' + req.denuncia);
	res.location(path.join(req.url, req.denuncia.titulo.replace(' ', '-')))
	res.render('denuncia', {denuncia: req.denuncia});*/
});

module.exports = router;