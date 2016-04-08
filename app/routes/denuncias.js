'use strict';
var fs, // file System
	path, // util para paths
	dir, // recorrer directorios
	exec, // Ejecutar comandos
	denunciasPorPagina = 10,
	maxPaginas = 0,
	config = require('../../config/upload.js'),
	User, // modelo de usuario
	validator, // validator 
	db, 
	dbCarto, 
	consultas,
	multer_imagen_perfil,
	multer_temp_denuncia,
	crypto = require('crypto'),
	mkdirp = require('mkdirp'),
	formatsAllowed = 'png|jpg|jpeg|gif'; // Podríamos poner más

/*
 * Constructor
 */
function Denuncia(fs_, path_, dir_, exec_, User_, validator_, 
		db_, dbCarto_, consultas_, multer_imagen_perfil_, multer_temp_denuncia_){
	fs = fs_;
	path = path_;
	dir = dir_;
	exec = exec_;
	User = User_;
	validator = validator_;
	db = db_;
	dbCarto = dbCarto_;
	consultas = consultas_;
	multer_imagen_perfil = multer_imagen_perfil_.single('file');
	multer_temp_denuncia = multer_temp_denuncia_.single('file');
}

/*
====================================================
== ALL --> /app/denuncia?id=id&action=action      ==
	
	Controlador para las denuncias
	GET --> denuncia_page, denuncia_edit_page
	POST --> añadir_coment, delete_denuncia, update_denuncia

====================================================
*/
Denuncia.prototype.denuncia = function(req, res, next){
	// Acción a realizar sobre la denuncia
	var action = req.query.action || 'get_denuncia_page';

	//console.log('denuncia action ' + action);

	// Si no se ha añadido la id de la denuncia enviamos error
	if(!req.query.id){
		var err = new Error(req.i18n.__('ruta_no_encontrada') + '.\n' + req.i18n.__('al_menos_id'));
		err.status = 500;
		return next(err);
		//return res.status(500).send('Ruta no encontrada. Debe introducir al menos la id de la denuncia');
	}

	// llamamos a la función conveniente según la acción
	switch (action){
		case 'get_denuncia_page' : pagina_denuncia(req, res, next);break;
		case 'get_edit_page' : pagina_editar(req, res, next);break;
		case 'edit' : editar(req, res, next);break;
		case 'delete' : eliminar(req, res, next);break;
		case 'add_coment' : añadir_comentario(req, res, next);break;
		default : pagina_denuncia(req, res, next);
	}
};

/*
====================================================
== GET --> /app/denuncias/nueva                   ==
	
	Renderizamos la página para añadir una nueva 
	denuncia

====================================================
*/
Denuncia.prototype.pagina_nueva_denuncia = function(req, res, next){
	// Creamos un string hexadecimal aleatorio que servirá de identificador
	// del directorio temporal
	crypto.randomBytes(25, function(ex, buf) {
		// Obtenemos el String
  		var token = buf.toString('hex');
  		// Creamos una carpeta en el directorio temporal
		mkdirp(path.join(config.TEMPDIR, token), function (err){
			if(err) {
				err.status = 500;
				return next(err);
			}
			// renderizamos la página de nueva denuncia pasándole el token
			res.render('nueva', {random : token});
		}); // Crea un directorio si no existe
	});
}

/*
====================================================
== POST -->                                       ==
	
	Eliminar imagen del directorio temporal

====================================================
*/
Denuncia.prototype.eliminar_imagen_temporal = function(req, res, next){
	// Parámetros para eliminar imagen del directorio temporal
	var tempdir = req.query.tempdir; // identificador del directorio temporal
	var filename = req.query.filename; // nombre de la imagen a eliminar

	// Comprobamos parámetros
	if(!(tempdir && filename)){
		var error = new Error(req.i18n.__('error_borrando_imagen') + req.i18n.__('error_borrando_imagen_params'));
		error.status = 500;
		return next(error);
	}
	// Path de la imagen 
	var path_image = path.join(path.join(config.TEMPDIR, tempdir), filename);
	// Eliminamos la imagen
	fs.unlink(path_image, function(error){
		if(error) {
			error = new Error(req.i18n.__('error_borrando_imagen') + error);
			error.status = 500;
			return next(error);
		}
		res.send(req.i18n.__('imagen_eliminada'));
	});
	
}

/*
====================================================
== POST --> /app/fileupload                       ==
	
	Subimos una imagen al directorio temporal

====================================================
*/
Denuncia.prototype.subir_imagen_temporal = function(req, res){
	// Encapsulamos el middleware multer dentro del
	// manejador de rutas
	multer_temp_denuncia(req, res, function(error){
		// Enviamos un mensaje de error
		if(error) {
			console.log(error.toString());
			error = new Error({type: 'error', msg: error.toString()});
			res.status(500).send(error);
		}
		// obetenemos la imagen subida
		var file = req.file;
		// obtenemos su extension
		var extension = path.extname(file.path);
		
		console.log('patttth ' + file.path);
		// Si la extensión no está dentro de nuestros formatos soportados
		if(!extension.match(formatsAllowed)){
			// Eliminamos la imagen subida si no es de uno de los formatos permitidos
			var to = path.join('./public/files/temp', path.basename(file.path));
			// Eliminamos la imagen del directorio temporal
			fs.unlink(to, function(error_){
				if(error_) console.log('error unlink ' + error_);
				// Enviamos error
				var error = new Error(req.i18n.__('formato_no_permitido'));
				return res.status(413).send(error.toString());
			});
		}
		else {
			// La imagen se ha subido correctamente y es de un formato soportado
			return res.send({
				type: 'success', 
				msg: 'Archivo subido correctamente a '+to+' ('+(file.size.toFixed(2)) +' kb)'
			});
		}
		
	});
}

/*
====================================================
== POST --> /app/denuncia?id=id&action=add_coment ==
	
	Añade un comentario a la denuncia

====================================================
*/
var añadir_comentario = function(req, res){
	// Comprobamos que se ha accedido mediante un método POST
	if(req.method.toLowerCase() != 'post'){
		var error = new Error(req.i18n.__('accion_post'));
		return res.status(500).send(error);
	}
	// Parámetros para añadir comentario
	var denuncia, notificacion;
	var contenido = req.body.contenido;
	var user_id = req.user._id;
	var id_denuncia = req.query.id;
	
	// Comprobamos parámetros
	if (!contenido || !user_id || !id_denuncia) {
		var error = new Error(req.i18n.__('error_comentario'));
		return res.status(500).send(error);
	}
	if (!validator.isLength(contenido, 10, 1000)) {
		var error = new Error(req.i18n.__('error_comentario') +  req.i18n.__('error_comentario_params'));
		return res.status(500).send(error);

	}
	//console.log(consultas.añadir_comentario);
	
	// ejecutamos la consulta para añadir comentario
	db.none(consultas.añadir_comentario, [user_id, id_denuncia, contenido])
		.then(function(){
			// ejecutamos consulta para obtener la denuncia comentada
			return db.one(consultas.denuncia_por_id, id_denuncia);
		})
		.then(function(denuncia_){
			// Obtenemos la denuncia comentada
			denuncia = denuncia_;
			// Asignamos geometría
			denuncia.geometria = denuncia.geometria_pt || denuncia.geometria_li || denuncia.geometria_po;
			// Formateamos los datos --> contenido del comentario
			var datos = JSON.stringify({contenido : contenido});
			// Si es el propio usuario el que comenta su denuncia no enviamos la notificación
			if(denuncia.id_usuario == user_id){
				var err = new Error();
				err.mismo_user = true;
				throw err;
			}
			// Si no ejecutmos la consulta para añadir notificación
			else return db.one(consultas.notificar_denuncia_comentada, 
					[id_denuncia, user_id, denuncia.id_usuario, datos]);
		})
		.then(function(notificacion_){
			// Si hay notificación
			notificacion = notificacion_;
			// Y el cliente está conectado
			if(clients[denuncia.id_usuario]){
				// Emitimos la notificación a todos sus sockets abiertos
				for(var socketId in clients[denuncia.id_usuario]){
					clients[denuncia.id_usuario][socketId].emit('denuncia_comentada', 
						{denuncia: denuncia, from: req.user, noti: notificacion});
				}
			}
			else {
				console.log('el usuario de la denuncia comentada está desconectado');
			}
			// Enviamos al usuario que ha comentado un mensaje de success
			res.send({success: true, contenido: contenido});
		})
		.catch(function(error){
			//console.log(error);
			// Si el error es que es el propio usuario enviar mensaje de success
			if(error.mismo_user) res.send({success: true, contenido: contenido});
			else return res.status(500).send(error);
		});

};

/*
====================================================
== POST --> /app/denuncias/nueva/save             ==
	
	Creamos una nueva denuncia

====================================================
*/
Denuncia.prototype.guardar = function(req, res){
	
	
	var errormsg = ''; // String para mensajes de error
	
	var usuarios_cerca = [];
	var usu_from; // Usuario denuncia
	var imagenes = []; // Lista de imágenes a guardar en la base de datos
	var titulo = req.body.titulo.replace(/["' # $ % & + ` -]/g, " "); // titulo de la denuncia
	var contenido = req.body.contenido;  // Contenido de la denucnia
	var wkt = req.body.wkt; // geometría de la denuncia
		
	var user_id = validator.escape(req.user._id); // id_usuario
	var tempDirID = req.body.tempDir; // nombre del directorio temporal donde se guardan las imágenes
	
	var tags_ = req.body.tags.length > 0 ? req.body.tags : [];  // tags introducidos por el usuarios
	//console.log(tags_);
	
	var denuncia_io = req.body; // copia de la denuncia
	denuncia_io.id_usuario = user_id; // asignamos id de usuario
	denuncia_io.wkt = wkt; // Asignamos la geometría a la denuncia

	// comprobando datos de la denuncia
	if(tags_.length < 2) errormsg += req.i18n.__('denuncia_tags') + '\n';
	if(!validator.isLength(titulo, 5, 50)) errormsg += req.i18n.__('denuncia_titulo') + '\n';
	if(!validator.isLength(contenido, 50, 10000)) errormsg += req.i18n.__('denuncia_contenido') + '\n';
	if(wkt == undefined) errormsg += req.i18n.__('denuncia_geometria') + '\n';	
	
	// Si hay algún error en los datos devolvemos los errores
	if(errormsg.length > 0)
		return res.status(500).send({type: 'error', msg: errormsg});
	
	// ejecutamos consulta para comprobar que la geometría es correcta	
	dbCarto.one(consultas.comprobar_geometria(wkt) , wkt)
		.then(function(geom_check){
			// Si la geometría no está en torrent 
			if (geom_check.st_contains == false)
				throw new Error(req.i18n.__('denuncia_geometria_dentro'));
			// Si la geometría lineal supera los 200 metros
			else if(wkt.match(/LINESTRING/g) && geom_check.st_length > 200)
				throw new Error(req.i18n.__('denuncia_geometria_lineal'));
			// Si la geometría poligonal supera los 5000 metros cuadrados
			else if(wkt.match(/POLYGON/g) && geom_check.st_area > 5000)
				throw new Error(req.i18n.__('denuncia_geometria_poligonal') + ' m<sup>2</sup>.');
			// Ejecutamos la tarea para añadir denuncia, tags, imágenes
			return db.task(function * (t){
				// t = this = contexto bdd
				var q = []; // Consultas a ejecutar --> añadir imagenes y tags

				// Ejecutamos la consulta síncrona (ES-6) para añadir una denuncia, asignamos el resultado
				// de la consulta a la variable denuncia 
				let denuncia = yield this.one(consultas.insert_denuncia, [titulo, contenido, user_id]);
				// Asignamos a la variable denuncia_io la denuncia 
				denuncia_io = denuncia;

				// Leemos el directorio temporal asignado a la denuncia
				var files = fs.readdirSync(config.TEMPDIR + "/" + tempDirID);
				// Si hay imágenes
				if (files){
					// Creamos una carpeta dentro del directorio final de denuncia con la id de la denuncia
					fs.mkdirSync(path.join(config.UPLOADDIR, denuncia.gid));
					// Recorremos los archivos para moverlos al directorio final que hemos creado
					files.forEach(function(ruta, index, that) {
					    //console.log('img: ' + path.basename(ruta));
					    // String --> path desde donde tengo que mover el archivo
						var from_ = path.join(config.TEMPDIR, tempDirID + "/" + path.basename(ruta));
						// String --> path final donde se alojará el archivo
						var to = path.join(config.UPLOADDIR, denuncia.gid + "/" + tempDirID + "-" + path.basename(ruta));
						// path relativo para almacenar en la base de datos
						var path_ = "/files/denuncias/" + denuncia.gid + "/" + path.basename(to); 
						// Añadimos la consulta para añadir las imágenes a la base de datos
						q.push(t.none(consultas.añadir_imagen_denuncia, [path_, denuncia.gid]));
						fs.renameSync(from_, to);
					});
				}
				// Añadimos la consulta para añadir la geometría de la denuncia
				q.push(t.none(consultas.añadir_geometria(wkt), [denuncia.gid, wkt]));
				// Recorremos los tags añadidos
				tags_.forEach(function(tag){
					// Añadimos la consulta para añadir tag
					q.push(t.none(consultas.añadir_tag_denuncia, [denuncia.gid, tag]));
				});
				// Ejecutamos las consultas
				return t.batch(q);
				
			});
			
		})
		.then (function(){			
			// La denuncia se ha añadido correctamente
			console.log(denuncia_io + ' new denuncia addedd');
			// Emitimos a todos los usuarios y a mi
			// que hemos añadido una denuncia
			for(var socketId in global.clients[req.user._id]){
				// A todos menos a mi 
				global.clients[req.user._id][socketId].broadcast.emit('new_denuncia', {denuncia: denuncia_io});
				// Me la emito a todos mis sockets abiertos
				for (var sid in global.clients[req.user._id])
					global.clients[req.user._id][sid].emit('new_denuncia', {denuncia: denuncia_io});
				break;
			}
			// Ejecutamos la conulta para buscar usuarios cerca  informarles de que
			// hemos añadido una denuncia cerca de su ubicación
			return db.any(consultas.usuarios_cerca_de_denuncia, [wkt, req.user._id]);
			
		})
		.then(function(usuarios){
			// Si no hay usuarios cerca...
			if(usuarios.length == 0) {

				console.log('////////////');
				console.log('NO HAY USUARIOS AFECTADOS');
				// Enviamos un mensaje de que la denuncia se ha guardado correctamente
				res.send({
					type: 'success', 
					msg: 'Denuncia guardada correctamente',
					denuncia: denuncia_io,
					num_usuarios_afectados : usuarios.length
				});
				// para que no siga haciendo nada y no tengamos problemas
				var err = new Error('No hay usuarios cerca de la denuncia');
				// Lanzamos un error específico
				err.no_users_found = true;
				throw err;
			}
			// Si hay usuarios cerca...
			else {
				// Asignamos a la variable usuarios_cerca los usuarios
				usuarios_cerca = usuarios;
				// Ejecutamos la consulta para obtener la info del usuario que emite l denuncia
				return db.one(consultas.usuario_por_id, req.user._id);
			}
		})
		.then(function(usuario){
			// Asignamos a la variable usu_from el usuario propietario de la denuncia
			usu_from = usuario;
			// Ejecutamos la consulta para obtener la info de la denuncia que hemos añadido
			return db.one(consultas.denuncia_por_id, denuncia_io.gid);
		})
		.then(function(denuncia_){
			// Obetenemos denuncia y asignamos geometría
			denuncia_.geometria = denuncia_.geometria_pt || denuncia_.geometria_li || denuncia_.geometria_po;
			// Asignamos a la variable denuncia_io la denuncia que hemos obtenido
			denuncia_io = denuncia_;
			// Ejecutamos tarea
			return db.tx(function (t){
				var q = []; // Consultas
				// Recorremos los usuarios cerca
				usuarios_cerca.forEach(function(user){
					// Guardamos la distancia buffer del usuario en una variable
					var datos = JSON.stringify({distancia : user.distancia});
					// Añadimos la consulta para añadir notificación en la base de datos
					q.push(db.one(consultas.notificar_denuncia_cerca, 
						[denuncia_io.gid, req.user._id, user._id, datos]));
				});
				// Ejecutamos la conulta
				return t.batch(q);
			});
		})
		.then(function(notificaciones){
			//console.log('notificaciones');
			// Recorremos las notificaciones
			notificaciones.forEach(function(notificacion){
				// Si el usuario a que se notific est´a conectado...
				for(var socketId in global.clients[notificacion.id_usuario_to]){
					//console.log(socketId);
					console.log('El usuario ' + notificacion.id_usuario_from + ' ha publicado una denuncia carca de la ubicación del usuario ' + notificacion.id_usuario_to);
					// Emitimos un evento para notificar al usuario de una denuncia cerca
					clients[notificacion.id_usuario_to][socketId].emit('denuncia_cerca', 
						{denuncia: denuncia_io, from: usu_from, noti: notificacion});	
				}
			});
			// Enviamos la respuesta satisfactoria de denuncia añadida
			res.send({
				type: 'success', 
				msg: 'Denuncia guardada correctamente',
				denuncia: denuncia_io,
				num_usuarios_afectados : usuarios_cerca.length
			});
		})
		.catch(function(error){
			console.log('Error insertando nueva denuncia ' + error);
			//console.log('headeeerSENT', res.headersSent);
			// Si el error es distinto a que no se han encontrado usuarios cerca...
			if(!error.no_users_found) res.status(500).send({type: 'error', msg: error.toString()})
		});
}; // Fin saveDenuncia


/*
====================================================
== GET --> /app/denuncias?page=pagina             ==
	
	Renderizamos la página con las denuncias según
	el número de la página que se pase.
	En cada página hay 10 denuncias.

====================================================
*/
Denuncia.prototype.pagina_denuncias = function(req, res, next){
	// Parámetros por defecto 
	var numDenuncias = 0;
	var maxPages = 1;
	// Página que solicita el usuario
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
	};
	// Lista de denuncias de la página solicitada
	var denuncias = [];
	//Ejecutamos la consulta para obtener el número de denuncias 
	db.one(consultas.numero_denuncias)
		.then(function(num_denuncias){
			// Obtenemos el número de denuncias totales
			//console.log('num_denuncias', num_denuncias);
			// Asignamos el número de denuncis a una variable global
			numDenuncias = num_denuncias.numdenuncias;
			//if (Math.ceil(numDenuncias/10) > 0)
			// Calculamos el número máximo de página
			maxPages = Math.ceil(numDenuncias/10);
			//console.log('numDenuncias', numDenuncias, 'maxPages', maxPages);
			// Si la página solicitada es mayor que el número de páginas que puede haber
			// Asignamos la máxima página
			if (page > maxPages) {
				var error = new Error(req.i18n.__('parametro_no_valido'));
				throw error;
			}
			// Ejecutamos la consulta para obtener las denuncias recientes por página
			return db.query(consultas.obtener_denuncias_recientes_por_pagina, page);
			
		})
		.then (function(denuncias){
			// Obtenemos las denuncias y las recorremos
			denuncias.forEach(function(d){
				// Asignamos la geometría a la denuncia
				d.geometria = d.geometria_pt || d.geometria_li || d.geometria_po;
			});
			//console.log(denuncias);
			// Respondemos renderizando la página con las denuncias
			res.render('denuncias',{
				denuncias : JSON.stringify(denuncias), 
				page: page,
				maxPages: maxPages
			});
		})
		.catch(function(error){
			error.status = 500;
			next(error);
		});

};

/*
==========================================================
== GET --> /app/denuncia?id=id&action=get_denuncia_page ==
	
	Renderiza la pagina de la denuncia seleccionada.
	Si se omite el parámetro action surge el mismo efecto

==========================================================
*/
var pagina_denuncia = function(req,res, next){
	// Id de la denuncia solicitada
	var id_denuncia = req.query.id;
	// Ejecutamos la consulta para obtener la denuncia
	db.one(consultas.denuncia_por_id, id_denuncia)
		.then(function(denuncia){
			// Si la denuncia no existe lanzamos un error
			if (!denuncia) throw new Error(req.i18n.__('denuncia_no_encontrada'));
			// Si existe asignamos la geometría a la denuncia
			denuncia.geometria = denuncia.geometria_pt || denuncia.geometria_li || denuncia.geometria_po;
			// renderizamos la página de la denuncia con la denuncia
			res.render('denuncia', {denuncia: denuncia});
		})
		.catch(function(error){
			error.status = 500;
			next(error);
		});
};

/*
======================================================
==      POST --> /app/deleteImagen?path=path        ==
	
	Elimina la imagen de la denuncia seleccionada

	TODO : Comprobar que el usuario que elimina la imagen 
	es el propietario de la denuncia

======================================================
*/
Denuncia.prototype.eliminar_imagen = function(req, res){
	// El path es un parámetro requerido
	if(!req.query.path){
		return res.status(500).send(req.i18n.__('parametro_no_valido'));
	}
	else {
		// path de la imagen a eliminar
		var path = req.query.path;
		// Ejecutamos la consulta para obtenemos la denuncia a partir del path de la imagen
		db.one(consultas.denuncia_por_path_imagen, path)
			.then(function(denuncia){
				// Obtenemos la denuncia a partir del path de la imagen
				if(denuncia.id_usuario != req.user._id)
					// Si es un usuario distinto al propietario el que quiere 
					// eliminar la denuncia --> error
					throw new Error(req.i18n.__('no_tiene_permiso'));
				// Ejecutamos la consulta para eliminar la imagen de la bdd
				return db.query(consultas.eliminar_imagen_denuncia, path);
			})
			.then(function(result){
				console.log(result);
				// Eliminamos la imagen de la carpeta
				exec('rm -r ' + './public' + req.query.path, function(error){
					if (error) throw error;
					// Enviamos respuesta satisfactoria
					else res.send(req.i18n.__('imagen') + '"' + path + '"' + req.i18n.__('eliminada_correctamente'));
				});
			})
			.catch(function(error){
				res.status(500).send(error);
			});
	}
}

/*
======================================================
== GET --> /app/denuncia?id=id&action=get_edit_page ==
	
	Renderizamos la página para editar una denuncia
	con la denuncia que hemos seleccionado

======================================================
*/
var pagina_editar = function(req, res, next){
	// id de la denuncia
	var id = req.query.id;
	// No se introduce id como parámetro...
	if(!id){
		// Enviamos respuesta de error
		var error = new Error(req.i18n.__('faltan_parametros') + ': id');
		return next(error);
	}
	else{
		console.log('editar');
		// Ejecutamos la consulta para obtener la denuncia
		db.one(consultas.denuncia_por_id, id)
			.then(function(denuncia){
				// Si el usuario propietario de la denuncia es distinto al que intenta editarla --> error
				if(denuncia.id_usuario != req.user._id) throw new Error(req.i18n.__('no_tiene_permiso'))
				//console.log(denuncia[0]);

				denuncia.tags_ = JSON.stringify(denuncia.tags_);
				//console.log(denuncia);

				// Asignamos la geometría a la denuncia
				denuncia.geometria = denuncia.geometria_pt || denuncia.geometria_li || denuncia.geometria_po;

				// Creamos un string random para crear carpeta temporal
				crypto.randomBytes(25, function(ex, buf) {
					// Obtenemos el string random
  					var token = buf.toString('hex');
  					// Creamos el directorio
					mkdirp(path.join(config.TEMPDIR, token), function (err){
						if(err) throw err;
						// Renderizamos la página con la denuncia
						res.render('editar.jade', {denuncia: denuncia, random : token});
					}); // Crea un directorio si no existe
				});
			})
			.catch(function(error){
				error.status = 500;
				next(error);
			});
	}
};


/*
====================================================
== POST --> /app/denuncia?id=id&action=delete     ==
	
	Eliminamos la denuncia seleccionada

====================================================
*/
var eliminar = function(req, res){
	// Comprobamos que se accede mediante POST
	if(req.method.toLowerCase() != 'post')
		return res.status(500).send(req.i18n.__('accion_post'));
	// No se le ha pasado el parámetro id --> error
	if(!req.query.id){
		// Enviamos respuesta de error
		res.status(500).send(req.i18n.__('faltan_parametros') + ': id');
	}
	console.log('delete ' + req.query.id);
	// id de la denuncia a eliminar
	var id = req.query.id;
	// id del usuario que pide eliminar la denuncia
	var id_user = req.user._id;
	// Ejecutamos consulta para obtener denuncia
	db.oneOrNone(consultas.denuncia_por_id, id)
		.then(function(denuncia){
			// Si no existe denuncia --> error
			if(!denuncia) throw new Error('No existe denuncia');
			// Si el usuario que pide eliminarla y el propietario son distintos --> error
			if(id_user != denuncia.id_usuario) 
				throw new Error(req.i18n.__('no_tiene_permiso'));
			// Eliminamos la carpeta de imágenes de la denuncia
			exec('rm -r ' + config.UPLOADDIR + "/" + denuncia.gid, function ( errD, stdout, stderr ){
				// Eliminamos las imágenes de la carpeta FINAL
				if (errD) {
				console.log('error_mensaje --> ' + errD);
				}
				else console.log('imagenes eliminadas ');
			}); 
			// Ejecutamos la consulta para eliminar denuncia
			return db.none(consultas.eliminar_denuncia, [denuncia.gid]);
			
		})
		.then(function(){
			// La denuncia se eliminó correctamente
			res.status(200).send(req.i18n.__('denuncia_con_id') + ': ' + id + ' ' + req.i18n.__('eliminada_correctamente'));
		})
		.catch(function(error){
			console.log(error.toString());
			res.status(500).send(error);
		});
};

/*
=======================================================
== POST --> /app/denuncia?id=id_denuncia&action=edit ==        
	
	Actualizamos la denuncia con los nuevos datos

=======================================================
*/
var editar = function(req, res){

	// Comprobamos que se accede mediante POST
	if(req.method.toLowerCase() != 'post')
		return res.status(500).send(req.i18n.__('accion_post'));
	
	// id de la denuncia
	var id = req.query.id;
	
	var response = {}; // La respuesta que se envía
	var errormsg = ''; // mensaje de errores
	
	var imagenes = []; // Lista de imágenes a guardar en la base de datos
	var titulo = req.body.titulo.replace(/["' # $ % & + ` -]/g, " "); // título
	var contenido = req.body.contenido; // contenido
	var wkt = req.body.wkt; // Geometría
	
	var user_id = validator.escape(req.user._id); // id_usuario
	var tempDirID = req.body.tempDir; // nombre del directorio temporal donde se guardan las imágenes
	
	var tags_ = req.body.tags.length > 0 ? req.body.tags : [];  // tags introducidos por el usuarios
	
	var denuncia_io = req.body; // objeto denuncia
	// Asignamos más valores a la denuncia--> gid, id_usuario
	denuncia_io.id_usuario = user_id;
	denuncia_io.gid = id;

	// comprobando datos de la denuncia
	if(tags_.length < 2) errormsg += req.i18n.__('denuncia_tags') + '\n';
	if(!validator.isLength(titulo, 5, 50)) errormsg += req.i18n.__('denuncia_titulo') + '\n';
	if(!validator.isLength(contenido, 50, 10000)) errormsg += req.i18n.__('denuncia_contenido') + '\n';
	if(wkt == undefined) errormsg += req.i18n.__('denuncia_geometria');	
	
	// Si hay algún error en los datos devolvemos la denuncia
	if(errormsg.length > 0)
		return res.send({type: 'error', msg: errormsg});
	// tipo de geometría introducida
	var tipo = wkt.match(/LINESTRING/g) ? 'LineString' : (wkt.match(/POLYGON/g) ? 'Polygon': 'Point');
	//var denuncia;
	
	// Ejecutamos la consulta para obtener denuncia
	db.one(consultas.denuncia_por_id, id)
		.then(function(d){
			// Asignamos la denuncia a denuncia_io
			denuncia_io = d;
			// Asignamos la geometría de la denuncia
			denuncia_io.geometria = denuncia_io.geometria_pt || denuncia_io.geometria_li || denuncia_io.geometria_po;
			// Ejecutamos la consulta para comprobar geometría
			return dbCarto.one(consultas.comprobar_geometria(wkt), wkt);
		})
		.then(function(geom_check){
			// Si la denuncia no está en torrent --> Error
			if (geom_check.st_contains == false)
				throw new Error(req.i18n.__('denuncia_geometria_dentro'));
			// Si la denuncia lineal supera los 200 metros
			else if(wkt.match(/LINESTRING/g) && geom_check.st_length > 200)
				throw new Error(req.i18n.__('denuncia_geometria_lineal'));
			// Si la geometría poliggonal supera los 5000 metros cuadrados
			else if(wkt.match(/POLYGON/g) && geom_check.st_area > 5000)
				throw new Error(req.i18n.__('denuncia_geometria_poligonal') + ' m<sup>2</sup>.');

			//console.log(wkt, 'wktttt');	

			// Ejecutamos tarea
			return db.task(function * (t){
				// t = this = contexto bdd
				var q = []; // Consultas
				// Leemos el directorio temporal
				var files = fs.readdirSync(config.TEMPDIR + "/" + tempDirID);
				// Si hay imágenes...
				if (files){
					try {
						// Intenyamos crear un directorio temporal por su no lo hubiera
						fs.mkdirSync(path.join(config.UPLOADDIR, denuncia_io.gid));
					}
					catch(e){
						// Si hay error es que stá creado --> Lo que debe pasar siempre
					}
					// Recorremos las imágenes
					files.forEach(function(ruta, index, that) {
					    //console.log('img: ' + path.basename(ruta));
					    // Path desde --> Imagen en carpeta temporal
						var from_ = path.join(config.TEMPDIR, tempDirID + "/" + path.basename(ruta));
						// Path hasta --> Imagen en carpeta final
						var to = path.join(config.UPLOADDIR, denuncia_io.gid + "/" + tempDirID + "-" + path.basename(ruta));
						// PAth para introducir en la base de datos
						var path_ = "/files/denuncias/" + denuncia_io.gid + "/" + path.basename(to); 
						// Añadimos la consulta a la tarea
						q.push(t.none(consultas.añadir_imagen_denuncia, [path_, denuncia_io.gid]));
						// Movemos la imagen
						fs.renameSync(from_, to);
					});
				}

				// Consulta síncrona para borrar todos los tags de la denuncia
				let borrar_tags = yield t.none(consultas.delete_all_tags, id);
				//console.log('borrar ', borrar);
				// tipo de geometría que tenía anteriormente
				var tipo_ant = denuncia_io.geometria.type;
				//var fecha = denuncia.fecha;
				console.log(tipo);
				// Ha cambiado la geometría de la denuncia ¿?
				if (tipo != tipo_ant){
					// Eliminamos la geometría de la tabla en la que esté
					let borrar_geom = yield t.none(consultas.eliminar_geometria_por_id(tipo_ant), id);
					// Insertamos la geometría en la tabla que corresponda
					q.push(t.none(consultas.añadir_geometria(wkt), [id, wkt]));
					// Actualizamos el contenido de la denuncia
					q.push(t.none(consultas.actualizar_denuncia, [titulo, contenido, id]));
				}
				else {
					// Si no ha cambiado actualizamos la geometria dentro de la misma tabla por si a caso
					// aun siendo el mismo tipo de geometría, ha cambiado las coordenadas
					q.push(t.none(consultas.actualizar_geometria(tipo), [wkt, id]));
					// Actualizamos info denuncia
					q.push(t.none(consultas.actualizar_denuncia, [titulo, contenido, id]));
				}
				//console.log('imagenes' + imagenes);
				// Recorremos las imágenes
				imagenes.forEach(function(path){
					//console.log('imagenes--' + path);
					// Añadimos consulta a la tarea para añadir imagen
					q.push(t.none(consultas.añadir_imagen_denuncia, [path, id]));
				});
				// Recorremos los tags
				tags_.forEach(function(tag){
					// Añadimos consulta a la tarea para añadir tag
					q.push(t.none(consultas.añadir_tag_denuncia, [id, tag]));
				});
				// Ejecutamos las consultas
				return t.batch(q);	
			});
		})
		.then (function(){
			// Enviamos respuesta satisfactoria
			res.send({
				type: 'success', 
				msg: 'Denuncia guardada correctamente',
				denuncia: denuncia_io
			});
		})
		.catch(function(error){
			console.log('Error insertando nueva denuncia ' + JSON.stringify(error));
			res.status(500).send({type: 'error', msg: error.toString()})
		});
}; // Fin saveDenuncia


/*
====================================================
==              GET --> /app/visor                ==
	
	Renderizamos la página del visor de denuncias
	con las denuncias de las últimas 24 horas

====================================================
*/
Denuncia.prototype.pagina_visor = function(req, res){
	// Ejecutamos consulta para obtener denuncias del visor
	db.query(consultas.denuncias_visor)
		.then(function(denuncias){
			// Recorremos las denuncias
			denuncias.forEach(function(denuncia){
				// Asignamos geometría a la denuncia
				denuncia.geometria = denuncia.geometria_pt || denuncia.geometria_li || denuncia.geometria_po;
			});
			// Renderizamos la página con las denuncias
			res.render('visor.jade', {denuncias: denuncias});
		})
		.catch(function(error){
			error.status = 500;
			next(error);
		});	
}

/*
====================================================
==                 module.exports                 ==
	
	Exportamos el objeto para que las rutas 
	sean accesibles en server.js

====================================================
*/
module.exports = Denuncia;