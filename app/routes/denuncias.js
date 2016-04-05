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

	crypto.randomBytes(25, function(ex, buf) {
  		var token = buf.toString('hex');
		mkdirp(path.join(config.TEMPDIR, token), function (err){
			if(err) throw err;
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
	var tempdir = req.query.tempdir;
	var filename = req.query.filename;

	if(!(tempdir && filename))
		return res.status(500).send('Error borrando la imagen:\n Debe introducir los parámetros tempdir y filename en el QueryString');

	var path_image = path.join(path.join(config.TEMPDIR, tempdir), filename);
	
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
	multer_temp_denuncia(req, res, function(error){
		
		if(error) {
			console.log(error.toString());
			return res.status(500).send({type: 'error', msg: error});
		}
		
		var file = req.file;
		var extension = path.extname(file.path);
		
		console.log('patttth ' + file.path);
		
		if(!extension.match(formatsAllowed)){
			// Eliminamos la imagen subida si no es de uno de los formatos permitidos
			var to = path.join('./public/files/temp', path.basename(file.path));
			fs.unlink(to, function(error_){
				if(error_) console.log('error unlink ' + error_);
				return res.status(413).send({type: 'error', msg: 'Formato no permitido'});
			});
		}
		else {
			// Todo ok
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
	
	if(req.method.toLowerCase() != 'post')
		return res.status(500).send('La acción requiere ser enviada a través de POST');

	var denuncia, notificacion;
	var contenido = req.body.contenido;
	var user_id = req.user._id;
	var id_denuncia = req.query.id;
	
	
	if (!contenido || !user_id || !id_denuncia) return res.status(500).send('Fallo insertando comentario');
	
	console.log(consultas.añadir_comentario);
	
	db.none(consultas.añadir_comentario, [user_id, id_denuncia, contenido])
		.then(function(){
			return db.one(consultas.denuncia_por_id, id_denuncia);
		})
		.then(function(denuncia_){
			denuncia = denuncia_;
			denuncia.geometria = denuncia.geometria_pt || denuncia.geometria_li || denuncia.geometria_po;
			//denuncia.tipo = denuncia.geometria.type;
			//denuncia.coordenadas = denuncia.geometria.coordinates;
			//denuncia.geometria = undefined;
			var datos = JSON.stringify({contenido : contenido});
			if(denuncia.id_usuario == user_id){
				var err = new Error();
				err.mismo_user = true;
				throw err;
			}
			else return db.one(consultas.notificar_denuncia_comentada, 
					[id_denuncia, user_id, denuncia.id_usuario, datos]);
		})
		.then(function(notificacion_){
			notificacion = notificacion_;
			if(clients[denuncia.id_usuario]){
				for(var socketId in clients[denuncia.id_usuario]){
					clients[denuncia.id_usuario][socketId].emit('denuncia_comentada', 
						{denuncia: denuncia, from: req.user, noti: notificacion});
				}
			}
			else {
				console.log('el usuario de la denuncia comentada está conectado');
			}
			res.send({success: true, contenido: contenido});
		})
		.catch(function(error){
			console.log(error);
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
	
	
	var errormsg = '';
	
	var usuarios_cerca = [];
	var from;
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
	// comprobando datos de la denuncia
	if(tags_.length < 2) errormsg += '· La denuncia debe contener al menos dos tags. \n';
	if(!validator.isLength(titulo, 5, 50)) errormsg += '· El título debe tener entre 5 y 50 caracteres.\n';
	if(!validator.isLength(contenido, 50, 10000)) errormsg += '· El contenido debe tener entre 50 y 10000 caracteres.\n';
	if(wkt == undefined) errormsg += '· Debe agregar un punto, línea o polígono\n';	
	
	// Si hay algún error en los datos devolvemos la denuncia
	if(errormsg.length > 0)
		return res.send({type: 'error', msg: errormsg});
	
	var tabla = wkt.match(/LINESTRING/g) ? 'denuncias_lineas' : (wkt.match(/POLYGON/g) ? 'denuncias_poligonos': 'denuncias_puntos');
	
	dbCarto.one(consultas.comprobar_geometria(wkt) , wkt)
		.then(function(geom_check){
			if (geom_check.st_contains == false)
				throw new Error('La geometría debe estar dentro de Torrent.');
			else if(wkt.match(/LINESTRING/g) && geom_check.st_length > 500)
				throw new Error('La geometría lineal no debe superar los 500 metros de longitud.');
			else if(wkt.match(/POLYGON/g) && geom_check.st_area > 10000)
				throw new Error('La geometría poligonal no debe superar un area mayor de 10.000 metros cuadrados.');
			
			return db.task(function * (t){
				// t = this = contexto bdd
				var q = []; // consultas a ejecutar --> añadir imagenes y tags
				
				let denuncia = yield this.one(consultas.insert_denuncia, [titulo, contenido, user_id]);

				var files = fs.readdirSync(config.TEMPDIR + "/" + tempDirID);
				if (files){
					fs.mkdirSync(path.join(config.UPLOADDIR, denuncia.gid));
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
				q.push(t.none(consultas.añadir_geometria(wkt), [denuncia.gid, wkt]));
				
				denuncia_io = denuncia;
				
				tags_.forEach(function(tag){
					q.push(t.none(consultas.añadir_tag_denuncia, [denuncia.gid, tag]));
				});
				
				return t.batch(q);
				
			});
			
		})
		.then (function(){
			// TODO: Socket.on('new denuncia added') ponerlo aquiiiiii!!!
			
			// Buscar usuarios cerca, emitir notificacion
			console.log(denuncia_io + ' new denuncia addedd');
			denuncia_io.wkt = wkt;
			for(var socketId in global.clients[req.user._id]){
				global.clients[req.user._id][socketId].broadcast.emit('new_denuncia', {denuncia: denuncia_io});
				global.clients[req.user._id][socketId].emit('new_denuncia', {denuncia: denuncia_io});
				break;
			}
			
			return db.any(consultas.usuarios_cerca_de_denuncia, [wkt, req.user._id]);
			
		})
		.then(function(usuarios){
			if(usuarios.length == 0) {
				//throw new Error('No hay usuarios cerca de la denuncia');
				console.log('////////////');
				console.log('NO HAY USUARIOS AFECTADOS');
				res.send({
					type: 'success', 
					msg: 'Denuncia guardada correctamente',
					denuncia: denuncia_io,
					num_usuarios_afectados : usuarios.length
				});
				var err = new Error('No hay usuarios cerca de la denuncia');
				err.no_users_found = true;
				throw err;
			}
			else {
				usuarios_cerca = usuarios;
				return db.one(consultas.usuario_por_id, req.user._id);
			}
		})
		.then(function(usuario){
			from = usuario;
			console.log(denuncia_io.gid);
			return db.one(consultas.denuncia_por_id, denuncia_io.gid);
		})
		.then(function(denuncia_){
			//denuncia_.tipo = denuncia_.geometria.type;
			//denuncia_.coordenadas = denuncia_.geometria.coordinates;
			//denuncia_.geometria = undefined;
			denuncia_.geometria = denuncia_.geometria_pt || denuncia_.geometria_li || denuncia_.geometria_po;
			denuncia_io = denuncia_;
			return db.tx(function (t){
				var q = [];
				usuarios_cerca.forEach(function(user){
					var datos = JSON.stringify({distancia : user.distancia});
					q.push(db.one(consultas.notificar_denuncia_cerca, 
						[denuncia_io.gid, req.user._id, user._id, datos]));
				});
				return t.batch(q); // Devuelve una lista de promesas que ddeben evaluarse
			});

		})
		.then(function(notificaciones){
			console.log('notificaciones');
			notificaciones.forEach(function(notificacion){
				for(var socketId in global.clients[notificacion.id_usuario_to]){
					console.log(socketId);
					console.log('El usuario ' + notificacion.id_usuario_from + ' ha publicado una denuncia carca de la ubicación del usuario ' + notificacion.id_usuario_to);
					clients[notificacion.id_usuario_to][socketId].emit('denuncia_cerca', 
						{denuncia: denuncia_io, from: from, noti: notificacion});	
				}
			});
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
			if(!error.no_users_found) res.send({type: 'error', msg: error.toString()})
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
			//console.log(denuncia);
			//denuncia.geometria = JSON.stringify(denuncia.geometria);
			//denuncia.descripcion = denuncia.descripcion.replace(/\n?\r\n/g, '<br />' );
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