var router = require('express').Router();

var multer = require('../../config/multer.js');
var multer_temp_denuncia = multer.crear_multer('./public/files/temp', multer.filename_temp_img).single('file');

var validator = require('validator');
var path = require('path');

var denunciaModel = require('../models/denuncia.js');
var usuarioModel = require('../models/usuario.js');
	denunciaModel = new denunciaModel();
	usuarioModel = new usuarioModel();

router.get('/tags', function(req, res){
	denunciaModel.getAllTags(function(error, tags){
		if(error) return res.status(500).json(error);
		return res.json(tags);
	});
})
// api json para consultas
router.get('/api', function(req, res){
	console.log(req.query);
	var aux = false;
	var filtro = {};
	filtro.titulo = req.query.titulo;
	console.log(filtro.titulo);
	filtro.id = req.query.id;

	var formato = req.query.outputFormat && (req.query.outputFormat.toLowerCase() == 'gml' || req.query.outputFormat.toLowerCase() == 'geojson') ?
		req.query.outputFormat.toLowerCase() : 'geojson';

	filtro.consulta = formato == 'gml' ? 'denuncias_sin_where_gml' : 'denuncias_sin_where'; 

	filtro.tags = req.query.tags ? req.query.tags.split(',') : undefined;
	filtro.usuario_nombre = req.query.username;
	filtro.fecha_desde = req.query.fecha_desde ? req.query.fecha_desde.split('/') : undefined;
	filtro.fecha_hasta = req.query.fecha_hasta ? req.query.fecha_hasta.split('/') : undefined;
	filtro.lat = req.query.lat;
	filtro.lon = req.query.lon;
	filtro.buffer_radio = req.query.buffer_radio;
	filtro.bbox = (filtro.lat && filtro.lon && filtro.buffer_radio) ? undefined : (req.query.bbox ? req.query.bbox : undefined);
	// Comprobamos que haya metido algún parámetro de búsqueda
	for(var key in filtro) {
		if (filtro[key] != undefined && key != 'consulta') {
			aux = true;
			console.log('keeeeey' + key);
		}				
	}
	// Si no ha añadido ningún parámetro de búsqueda emitimos un evento de error
	if(!aux) 
		return res.status(500).json({type : 'error', msg: 'Debe introducir algún parámetro de búsqueda'});
	// Validamos los parámetros que envía el usuario
	if(req.query.lat && req.query.lon && req.query.buffer_radio){
		if(!validator.isDecimal(req.query.lon.replace(',', '.')) && !validator.isNumeric(req.query.lon))
			return res.status(500).json({type : 'error', msg: 'La longitud del centro del buffer debe ser numérica'});

		if(!validator.isDecimal(req.query.lat.replace(',', '.')) && !validator.isNumeric(req.query.lat))
			return res.status(500).json({type : 'error', msg: 'La latitud del centro del buffer debe ser numérica'});
		
		if(!validator.isDecimal(req.query.buffer_radio) && !validator.isNumeric(req.query.buffer_radio))
			return res.status(500).json({type : 'error', msg: 'El radio del centro del buffer debe ser numérico'});
	}
	else if((req.query.lat || req.query.lon) && !req.query.buffer_radio) 
		return res.status(500).json({type : 'error', msg: 'Debes introducir el centro del buffer y el radio. Ambos parámetros'});
	else if(!(req.query.lat || req.query.lon) && req.query.buffer_radio) 
		return res.status(500).json({type : 'error', msg: 'Debes introducir el centro del buffer y el radio. Ambos parámetros'});

	denunciaModel.find(filtro, true, function(error, denuncias){
		res.json({type : 'success', count : denuncias.query.length || 0, denuncias : denuncias.query});
	});
});

// Middleware datos app
router.use(require('../middlewares/datos.js'));
// Middleware datos usuario
router.use(require('../middlewares/usuario.js'));

// Página denuncias ordenadas por página -- OK
router.get('/', function(req, res, next){
	// Página a la que queremos acceder
	var page = req.query.page;
	// Comprobamos que la página es numérica
	if (!page || !validator.isNumeric(page.toString()) || page <= 0)
		return res.redirect('/app/denuncias?page=1');
	denunciaModel.get_size(function(error, total_denuncias){
		if(error)
			return next(error);
		var max_pages = Math.ceil(total_denuncias/10);
		// Si la página solicitada es mayor que el número de páginas que puede haber
		// Asignamos la máxima página
		if (page > max_pages)
			return res.redirect('/app/denuncias?page=' + max_pages);
		denunciaModel.find_by_pagina(page, function(error, result){
			if(error) 
				return next(error);
			result.maxPages = max_pages;
			res.render('denuncias/lista', result);
		});
	});
});

// Visor -- OK
router.get('/visor', function(req, res, next){
	denunciaModel.denuncias_visor(function(error, result){
		if(error)
			return next(error);
		res.render('denuncias/visor', result);
	});
});

// Middleware autentificación
router.use(require('../middlewares/logged.js'));

router.route('/nueva')
// Página nueva denuncia -- OK
.get(function(req, res, next){
	console.log('nueva');
	denunciaModel.crear_temp_dir(function(error, token){
		if(error)
			return next(error);
		res.render('denuncias/nueva', {random : token});
	});
})
// Petición añadir denuncia -- OK
.post(function(req, res){
	var errormsg = ''; // String para mensajes de error
	// comprobando datos de la denuncia
	if(!req.body.tempDir) errormsg += 'No hay tempdir';
	if(!req.body.tags || req.body.tags.length < 2) errormsg += req.i18n.__('denuncia_tags') + '\n';
	if(!validator.isLength(req.body.titulo, 5, 50)) errormsg += req.i18n.__('denuncia_titulo') + '\n';
	if(!validator.isLength(req.body.contenido, 50, 10000)) errormsg += req.i18n.__('denuncia_contenido') + '\n';
	if(req.body.wkt == undefined) errormsg += req.i18n.__('denuncia_geometria') + '\n';	
	// Si hay algún error en los datos devolvemos los errores
	if(errormsg.length > 0)
		return res.status(500).send({type: 'error', msg: errormsg});
	var wkt = req.body.wkt;
	denunciaModel.comprobar_geometria(req.body.wkt, function(error, geom_check){
		if(error)
			return res.status(500).json(error);
		if (geom_check.st_contains == false)
			return res.status(500).json({type : 'error', msg : req.i18n.__('denuncia_geometria_dentro')});
		// Si la geometría lineal supera los 200 metros
		else if(wkt.match(/LINESTRING/g) && geom_check.st_length > 200)
			return res.status(500).json({type : 'error', msg : req.i18n.__('denuncia_geometria_lineal')});
		// Si la geometría poligonal supera los 5000 metros cuadrados
		else if(wkt.match(/POLYGON/g) && geom_check.st_area > 5000)
			return res.status(500).json({type : 'error', msg : req.i18n.__('denuncia_geometria_poligonal')});
		// Asignamos id usuario al body
		req.body.id_usuario = req.user._id;
		// Guardamos la denuncia
		denunciaModel.guardar(req.body, function(error, result){
			if(error)
				return res.status(500).json(error);
			result.type = 'success';
			result.msg = req.i18n.__('denuncia_añadida_ok') + '.\n' + 
				result.num_usuarios_afectados + ' ' + req.i18n.__('usuarios_afectados');
			res.json(result);
		});
	});
});

router.route('/imagen/temporal')
// Subir imagen a la carpeta temporal -- OK
.post(function(req, res, next){
	multer_temp_denuncia(req, res, function(error){
		// Enviamos un mensaje de error
		if(error)
			return res.status(500).json(error);
		// obetenemos la imagen subida
		denunciaModel.subir_imagen_temporal(req.file, function(error, to){
			if(error)
				return res.status(413).json({type : 'error', msg : req.i18n.__('formato_no_permitido')});
					// La imagen se ha subido correctamente y es de un formato soportado
			return res.json({
				type: 'success', 
				msg: 'Archivo subido correctamente a ' + to + ' (' + (req.file.size.toFixed(2)) + ' kb)'
			});
		});
	});
})
// Eliminar imagen de la carpeta temporal -- OK
.delete(function(req, res, next){
	// Comprobamos parámetros
	if(!(req.query.tempdir && req.query.filename))
		return res.status(500).json({type : 'error', msg : req.i18n.__('error_borrando_imagen') + req.i18n.__('error_borrando_imagen_params')})
	denunciaModel.eliminar_imagen_temporal(req.query.tempdir, req.query.filename, function(error){
		if(error)
			return res.status(500).json({type : 'error', msg : req.i18n.__('error_borrando_imagen') + error});
		res.json({type : 'success', msg : req.i18n.__('imagen_eliminada')})
	});
});

// Eliminar imagen de la carpeta final de denuncias -- OK
router.delete('/imagen', function(req, res, next){
	if(!req.query.path)
		return res.status(500).json(req.i18n.__('parametro_no_valido'));
	else {
		// path de la imagen a eliminar
		var path = req.query.path;
		// buscamos la denuncia que contiene esta imagen
		denunciaModel.find_by_path_image(path, function(error, denuncia){
			if(error)
				return res.status(500).json('no existe imagen en la denuncia');
			if(denuncia.id_usuario != req.user._id)
				// Si es un usuario distinto al propietario el que quiere 
				// eliminar la denuncia --> error
				return res.status(500).json({type : 'error', msg : req.i18n.__('no_tiene_permiso')});
			denunciaModel.eliminar_imagen(path, function(error){
				if(error)
					return res.status(500).json(error);
				res.json({type : 'success', msg : req.i18n.__('imagen') + '"' + path + '"' + req.i18n.__('eliminada_correctamente')});
			});
		});
	}
});

// Middleware que se ejecuta para todas las rutas que contengan 'id_denuncia'
// como parámetro
router.param('id_denuncia', function(req, res, next, id_denuncia){
	console.log('param id_denuncia');
	denunciaModel.find_by_id(id_denuncia, function(error, denuncia){
		if(error && req.method.toLowerCase() == 'get')
			return next(error);
		else if(error)
			return res.status(500).json(error);
		req.denuncia = denuncia;
		next();
	});
});

router.route('/:id_denuncia')
// Pagina denuncia -- Redirecciona a app/denuncias/{id_denuncia}/{titulo} -- OK
.get(function(req, res){
	var id_noti = req.query.id_noti ? '?id_noti=' + req.query.id_noti : '';
	res.redirect('/app/denuncias/' + req.denuncia.gid + '/' + req.denuncia.titulo.replace(/ /g, '-').replace(/\?/g,'') + id_noti);
})
// Actualizar denuncia -- OK
.put(function(req, res){
	if(req.denuncia.id_usuario != req.user._id) 
		return res.status(500).json({type : 'error', msg : req.i18n.__('no_tiene_permiso')});
	var errormsg = ''; // String para mensajes de error
	// comprobando datos de la denuncia
	if(!req.body.tempDir) errormsg += 'No hay tempdir';
	if(!req.body.tags || req.body.tags.length < 2) errormsg += req.i18n.__('denuncia_tags') + '\n';
	if(!validator.isLength(req.body.titulo, 5, 50)) errormsg += req.i18n.__('denuncia_titulo') + '\n';
	if(!validator.isLength(req.body.contenido, 50, 10000)) errormsg += req.i18n.__('denuncia_contenido') + '\n';
	//if(req.body.wkt == undefined) errormsg += req.i18n.__('denuncia_geometria') + '\n';	
	// Si hay algún error en los datos devolvemos los errores
	if(errormsg.length > 0)
		return res.status(500).send({type: 'error', msg: errormsg});
	// Comprobamos geometría
	console.log(req.body);
	var wkt = req.body.wkt;
	// Asignamos al body la id del usuario
	req.body.id_denuncia = req.params.id_denuncia;
	// Asignamos al body la denuncia original
	req.body.denuncia_original = req.denuncia;

	if(wkt)
		denunciaModel.comprobar_geometria(req.body.wkt, function(error, geom_check){
			if(error)
				return res.status(500).json(error);
			// Si la geometría no está en torrent 
			if (geom_check.st_contains == false)
				return res.status(500).json({type : 'error', msg : req.i18n.__('denuncia_geometria_dentro')});
			// Si la geometría lineal supera los 200 metros
			else if(wkt.match(/LINESTRING/g) && geom_check.st_length > 200)
				return res.status(500).json({type : 'error', msg : req.i18n.__('denuncia_geometria_lineal')});
			// Si la geometría poligonal supera los 5000 metros cuadrados
			else if(wkt.match(/POLYGON/g) && geom_check.st_area > 5000)
				return res.status(500).json({type : 'error', msg : req.i18n.__('denuncia_geometria_poligonal')});
			// Guardamos los cambios
			denunciaModel.editar(req.body, function(error, result){
				if(error)
					return res.status(500).json(error);
				res.json(result);
			});
		});
	else
		// Guardamos los cambios
		denunciaModel.editar(req.body, function(error, result){
			if(error)
				return res.status(500).json(error);
			res.json(result);
		});

})
// Eliminar denuncia -- OK
.delete(function(req, res){
	if(req.user._id != req.denuncia.id_usuario) 
		return res.status(500).json({type : 'error', msg : req.i18n.__('no_tiene_permiso')});
	denunciaModel.eliminar(req.denuncia.gid, function(error){
		if(error)
			return res.status(500).json(error);

		res.json({
			type : 'success', 
			msg : req.i18n.__('denuncia_con_id') + ': ' + req.denuncia.gid + ' ' + req.i18n.__('eliminada_correctamente')
		});
	});
});

// Página para actualizar la denuncia -- OK
router.get('/:id_denuncia/actualizar', function(req, res, next){
	if(req.denuncia.id_usuario != req.user._id) 
		return next({type : 'error', msg : req.i18n.__('no_tiene_permiso')});
	denunciaModel.crear_temp_dir(function(error, token){
		if(error)
			return next(error);
		res.render('denuncias/editar', {denuncia: req.denuncia, random : token});
	});
});

// Replicar un comentario 
router.post('/:id_denuncia/comentario/:id_comentario/replicar', function(req, res, next){
	denunciaModel.añadir_replica({
		contenido : req.body.contenido,
		id_comentario : req.params.id_comentario,
		usuario_from : req.user,
		id_denuncia : req.params.id_denuncia,
	}, function(error, id_noti){
		if(error) return res.status(500).json(error);
		return res.json({ type : 'success', contenido : req.body.contenido, id_noti : id_noti });
	});
});

// Añadir un comentario -- OK
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
	}, function(error, id_noti){
		if(error)
			return res.status(500).json(error);
		res.json({ type : 'success', contenido : req.body.contenido, id_noti : id_noti })
	});
});

// Página denuncia final --> Todas redireccionan aquí -- OK
router.get('/:id_denuncia/:titulo', function(req, res){
	console.log(req.params.titulo, req.denuncia.titulo);
	if(req.params.titulo.replace(/\?/g, '') != req.denuncia.titulo.replace(/ /g, '-').replace(/\?/g, ''))
		return res.redirect('/app/denuncias/' + req.denuncia.gid + '/' + req.denuncia.titulo.replace(/ /g, '-').replace(/\?/g));

	var id_usuario = req.user ? req.user._id : undefined;

	if(req.denuncia.id_usuario != id_usuario)
		denunciaModel.sumar_visita(req.denuncia.gid, function(error){
			console.log('noti', req.query.noti);
		});
	if(req.query.id_noti){
		usuarioModel.get_accion_by_id(req.query.id_noti, function(error, noti){
			console.log(error, noti);
			if(noti.id_usuario_to != req.user._id && noti.id_usuario_from != req.user._id)
				return res.render('denuncias/denuncia', {denuncia: req.denuncia});
			else if(noti.id_denuncia != req.denuncia.gid)
				return res.render('denuncias/denuncia', {denuncia: req.denuncia});
			else if(noti.tipo == 'DENUNCIA_CERCA' || noti.tipo == 'COMENTARIO_DENUNCIA' || noti.tipo == 'REPLICA')
				return res.render('denuncias/denuncia', {
					denuncia: req.denuncia,
					notificacion : noti
				});
			else return res.render('denuncias/denuncia', {denuncia: req.denuncia});
		});
	}
	else return res.render('denuncias/denuncia', {denuncia: req.denuncia});
});

module.exports = router;