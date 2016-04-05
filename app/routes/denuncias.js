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
	mkdirp = require('mkdirp');
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
Denuncia.prototype.denuncia = function(req, res){
	var action = req.query.action || 'get_denuncia_page';

	console.log('denuncia action ' + action);

	if(!req.query.id)
		return res.status(500).send('Ruta no encontrada. Debe introducir al menos la id de la denuncia');

	switch (action){
		case 'get_denuncia_page' : pagina_denuncia(req, res);
			break;
		case 'get_edit_page' : pagina_editar(req, res);
			break;
		case 'edit' : editar(req, res);
			break;
		case 'delete' : eliminar(req, res);
			break;
		case 'add_coment' : añadir_comentario(req, res);
			break;
		default : pagina_denuncia(req, res);
	}
};

/*
====================================================
== GET --> /app/denuncias/nueva                   ==
	
	Renderizamos la página para añadir una nueva 
	denuncia

====================================================
*/
Denuncia.prototype.pagina_nueva_denuncia = function(req, res){
	// Creamos un string hexadecimal aleatorio que servirá de identificador
	// del directorio temporal
	crypto.randomBytes(25, function(ex, buf) {
		// Obtenemos el String
  		var token = buf.toString('hex');
  		// Creamos una carpeta en el directorio temporal
		mkdirp(path.join(config.TEMPDIR, token), function (err){
			if(err) console.log(err);
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
Denuncia.prototype.eliminar_imagen_temporal = function(req, res){
	// Parámetros para eliminar imagen del directorio temporal
	var tempdir = req.query.tempdir; // identificador del directorio temporal
	var filename = req.query.filename; // nombre de la imagen a eliminar

	// Comprobamos parámetros
	if(!(tempdir && filename))
		return res.status(500).send('Error borrando la imagen:\n Debe introducir los parámetros tempdir y filename en el QueryString');
	// Path de la imagen 
	var path_image = path.join(path.join(config.TEMPDIR, tempdir), filename);
	// Eliminamos la imagen
	fs.unlink(path_image, function(error){
		if(error) return res.status(500).send('Error borrando la imagen:\n' + error);
		res.send('Imagen eliminada correctamente');
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
			return res.status(500).send({type: 'error', msg: error});
		}
		// obetenemos la imagen subida
		var file = req.file;
		// obtenemos su extension
		var extension = path.extname(file.path);
		
		//console.log('patttth ' + file.path);
		// Si la extensión no está dentro de nuestros formatos soportados
		if(!extension.match(formatsAllowed)){
			// Eliminamos la imagen subida si no es de uno de los formatos permitidos
			var to = path.join('./public/files/temp', path.basename(file.path));
			// Eliminamos la imagen
			fs.unlink(to, function(error_){
				if(error_) console.log('error unlink ' + error_);
				return res.status(413).send({type: 'error', msg: 'Formato no permitido'});
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
	if(req.method.toLowerCase() != 'post')
		return res.status(500).send('La acción requiere ser enviada a través de POST');
	// Parámetros para añadir comentario
	var denuncia, notificacion;
	var contenido = req.body.contenido;
	var user_id = req.user._id;
	var id_denuncia = req.query.id;
	
	// Comprobamos parámetros
	if (!contenido || !user_id || !id_denuncia) return res.status(500).send('Fallo insertando comentario');
	if (!validator.isLength(contenido, 10, 1000)) return res.status(500).send('Fallo insertando comentario.\n El contenido del comentario debe tener entre 10 y 1000 caracteres');
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
			console.log(error);
			// Si el error es que es el propio usuario enviar mensaje de success
			if(error.mismo_user) res.send({success: true, contenido: contenido});
			else res.status(500).send(error);
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
	if(tags_.length < 2) errormsg += '· La denuncia debe contener al menos dos tags. \n';
	if(!validator.isLength(titulo, 5, 50)) errormsg += '· El título debe tener entre 5 y 50 caracteres.\n';
	if(!validator.isLength(contenido, 50, 10000)) errormsg += '· El contenido debe tener entre 50 y 10000 caracteres.\n';
	if(wkt == undefined) errormsg += '· Debe agregar un punto, línea o polígono\n';	
	
	// Si hay algún error en los datos devolvemos los errores
	if(errormsg.length > 0)
		return res.send({type: 'error', msg: errormsg});
	
	// ejecutamos consulta para comprobar que la geometría es correcta	
	dbCarto.one(consultas.comprobar_geometria(wkt) , wkt)
		.then(function(geom_check){
			// Si la geometría no está en torrent 
			if (geom_check.st_contains == false)
				throw new Error('La geometría debe estar dentro de Torrent.');
			// Si la geometría lineal supera los 200 metros
			else if(wkt.match(/LINESTRING/g) && geom_check.st_length > 200)
				throw new Error('La geometría lineal no debe superar los 200 metros de longitud.');
			// Si la geometría poligonal supera los 5000 metros cuadrados
			else if(wkt.match(/POLYGON/g) && geom_check.st_area > 5000)
				throw new Error('La geometría poligonal no debe superar un area mayor de 5000 metros <sup>2</sup>.');
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
Denuncia.prototype.pagina_denuncias = function(req, res){

	var numDenuncias = 0;
	var maxPages = 1;
	var page = req.query.page; 
	if (!validator.isNumeric(page.toString())){
		page = 1;
		console.log('pagina no numerica');
	}
	if(page <= 0) page = 1;
	
	var denuncias = [];
	
	db.one(consultas.numero_denuncias)
		.then(function(num_denuncias){
			console.log('num_denuncias', num_denuncias);
			numDenuncias = num_denuncias.numdenuncias;
			//if (Math.ceil(numDenuncias/10) > 0)
			maxPages = Math.ceil(numDenuncias/10);
			console.log('numDenuncias', numDenuncias, 'maxPages', maxPages);
			if (page > maxPages) page = maxPages;
			return db.query(consultas.obtener_denuncias_recientes_por_pagina, page);
			
		})
		.then (function(denuncias){
			denuncias.forEach(function(d){
				d.geometria = d.geometria_pt || d.geometria_li || d.geometria_po;
			});
			console.log(denuncias);
			res.render('denuncias',{denuncias : JSON.stringify(denuncias), 
				   user : req.user,
				   page: page,
				   maxPages: maxPages
			});
		})
		.catch(function(error){
			res.status(500);
			res.send(error);
		});

};

/*
==========================================================
== GET --> /app/denuncia?id=id&action=get_denuncia_page ==
	
	Renderiza la pagina de la denuncia seleccionada.
	Si se omite el parámetro action surge el mismo efecto

==========================================================
*/
var pagina_denuncia = function(req,res){

	var id_denuncia = req.query.id;

	db.one(consultas.denuncia_por_id, id_denuncia)
		.then(function(denuncia){
			if (!denuncia) throw new Error('Denuncia no encontrada');

			denuncia.geometria = denuncia.geometria_pt || denuncia.geometria_li || denuncia.geometria_po;
			res.render('denuncia', {denuncia: denuncia, user: req.user});
		})
		.catch(function(error){
			res.status(500);
			res.send(error);
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
	if(!req.query.path){
		return res.status(500).send('no hay path');
	}
	else {
		var path = req.query.path;
		
		db.query(consultas.eliminar_imagen_denuncia, path)
			.then(function(result){
				console.log(result);
				exec('rm -r ' + './public' + req.query.path, function(error){
					if (error) throw error;
					else res.send('Imagen "' + path + '" eliminada correctamente.');
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
var pagina_editar = function(req, res){
	var id = req.query.id;
	if(!id){
		//Mostar error
		return res.status(500).send('No se especificó el id de la denuncia');
	}
	else{
		console.log('editar');
		
		db.one(consultas.denuncia_por_id, id)
			.then(function(denuncia){
				if(!denuncia) throw new Error('No existe la denuncia');
				if(denuncia.id_usuario != req.user._id) throw new Error('Permiso denegado. Usted no puede editar esta denuncia.')
				//console.log(denuncia[0]);
				denuncia.tags_ = JSON.stringify(denuncia.tags_);
				console.log(denuncia);

				denuncia.geometria = denuncia.geometria_pt || denuncia.geometria_li || denuncia.geometria_po;

				crypto.randomBytes(25, function(ex, buf) {
  					var token = buf.toString('hex');
					mkdirp(path.join(config.TEMPDIR, token), function (err){
						if(err) throw err;
						res.render('editar.jade', {denuncia: denuncia, random : token});
					}); // Crea un directorio si no existe
				});
			})
			.catch(function(error){
				res.status(500).send(error);
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
	
	if(req.method.toLowerCase() != 'post')
		return res.status(500).send('La acción requiere ser enviada a través de POST');

	if(!req.query.id){
		//Mostar error
		res.status(500).send('No se ha especificado el id de la denuncia');
	}
	console.log('delete ' + req.query.id);
	var id = req.query.id; // id de la denuncia
	
	var id_user = req.user._id; // id del usuario
	
	db.oneOrNone(consultas.denuncia_por_id, id)
		.then(function(denuncia){
			if(!denuncia) throw new Error('No existe denuncia');
			if(id_user != denuncia.id_usuario) 
				throw new Error('Usted no tiene permisos para eliminar esta denuncia');
			
			exec('rm -r ' + config.UPLOADDIR + "/" + denuncia.gid, function ( errD, stdout, stderr ){
				// Eliminamos las imágenes de la carpeta FINAL
				if (errD) {
				console.log('error_mensaje --> ' + errD);
				}
				else console.log('imagenes eliminadas ');
				
			}); 

			//denuncia.geometria = denuncia.geometria_pt || denuncia.geometria_li || denuncia.geometria_po;
			//var tipo = denuncia.geometria.type;
			
			return db.none(consultas.eliminar_denuncia, [denuncia.gid]);
			
		})
		.then(function(){
			res.status(200).send('La denuncia con id: ' + id + ' se ha eliminado correctamente');
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

	if(req.method.toLowerCase() != 'post')
		return res.status(500).send('La acción requiere ser enviada a través de POST');
	
	var id = req.query.id;
	
	var response = {}; // La respuesta que se envía
	var errormsg = ''; // mensaje de errores
	
	var imagenes = []; // Lista de imágenes a guardar en la base de datos
	var titulo = req.body.titulo.replace(/["' # $ % & + ` -]/g, " ");
	var contenido = req.body.contenido;
	var wkt = req.body.wkt;
	
	var user_id = validator.escape(req.user._id); // id_usuario
	var tempDirID = req.body.tempDir; // nombre del directorio temporal donde se guardan las imágenes
	
	var tags_ = req.body.tags.length > 0 ? req.body.tags : [];  // tags introducidos por el usuarios
	console.log(tags_);
	
	var denuncia_io = req.body;
	denuncia_io.id_usuario = user_id;
	denuncia_io.gid = id;

	// comprobando datos de la denuncia
	if(tags_.length < 2) errormsg += '· La denuncia debe contener al menos dos tags. \n';
	if(!validator.isLength(titulo, 5, 50)) errormsg += '· El título debe tener entre 5 y 50 caracteres.\n';
	if(!validator.isLength(contenido, 50, 10000)) errormsg += '· El contenido debe tener entre 50 y 10000 caracteres.\n';
	if(wkt == undefined) errormsg += '· Debe agregar un punto, línea o polígono\n';	
	
	// Si hay algún error en los datos devolvemos la denuncia
	if(errormsg.length > 0)
		return res.send({type: 'error', msg: errormsg});
	
	var tipo = wkt.match(/LINESTRING/g) ? 'LineString' : (wkt.match(/POLYGON/g) ? 'Polygon': 'Point');
	var denuncia;
	
	db.one(consultas.denuncia_por_id, id)
		.then(function(d){
			denuncia = d;
			denuncia.geometria = denuncia.geometria_pt || denuncia.geometria_li || denuncia.geometria_po;
			return dbCarto.one(consultas.comprobar_geometria(wkt), wkt);
		})
		.then(function(geom_check){
			if (geom_check.st_contains == false)
				throw new Error('La geometría debe estar dentro de Torrent.');
			else if(wkt.match(/LINESTRING/g) && geom_check.st_length > 500)
				throw new Error('La geometría lineal no debe superar los 500 metros de longitud.');
			else if(wkt.match(/POLYGON/g) && geom_check.st_area > 10000)
				throw new Error('La geometría poligonal no debe superar un area mayor de 10.000 metros cuadrados.');

			console.log(wkt, 'wktttt');	
			return db.task(function * (t){
				// t = this = contexto bdd
				var q = [];

				var files = fs.readdirSync(config.TEMPDIR + "/" + tempDirID);
				if (files){
					try {
						fs.mkdirSync(path.join(config.UPLOADDIR, denuncia.gid));
					}
					catch(e){

					}
					
					files.forEach(function(ruta, index, that) {
					    console.log('img: ' + path.basename(ruta));
					    
						var from = path.join(config.TEMPDIR, tempDirID + "/" + path.basename(ruta));
						var to = path.join(config.UPLOADDIR, denuncia.gid + "/" + tempDirID + "-" + path.basename(ruta));
						var path_ = "/files/denuncias/" + denuncia.gid + "/" + path.basename(to); 
						// Movemos la imagen desde la carpeta temporal hasta la carpeta final
						q.push(t.none(consultas.añadir_imagen_denuncia, [path_, denuncia.gid]));
						fs.renameSync(from, to);
					});
				}

				let borrar = yield t.none(consultas.delete_all_tags, id);
				//console.log('borrar ', borrar);
				var tipo_ant = denuncia.geometria.type;
				//var fecha = denuncia.fecha;
				console.log(tipo);
				// Ha cambiado la geometría de la denuncia ¿?
				if (tipo != tipo_ant){
					// Eliminamos la geometría de la tabla en la que esté
					q.push(t.none(consultas.eliminar_geometria_por_id(tipo_ant), id));
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
				console.log('imagenes' + imagenes);
				imagenes.forEach(function(path){
					console.log('imagenes--' + path);
					q.push(t.none(consultas.añadir_imagen_denuncia, [path, id]));
				});
				
				tags_.forEach(function(tag){
					q.push(t.none(consultas.añadir_tag_denuncia, [id, tag]));
				});
				return t.batch(q);
				
			});
			
		})
		.then (function(){
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
	
	db.query(consultas.denuncias_visor)
		.then(function(denuncias){

			denuncias.forEach(function(denuncia){
				denuncia.geometria = denuncia.geometria_pt || denuncia.geometria_li || denuncia.geometria_po;
			});

			res.render('visor.jade', {denuncias: denuncias});
		})
		.catch(function(error){
			res.status(500).send(error);
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