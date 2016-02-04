'use strict';
var fs, // file System
	path, // util para paths
	dir, // recorrer directorios
	exec, // Ejecutar comandos
	denunciasPorPagina = 10,
	maxPaginas = 0,
	config = require('../../config.js'),
	User, // modelo de usuario
	validator, // validator 
	db, 
	dbCarto, 
	consultas,
	multer_imagen_perfil,
	multer_temp_denuncia;
/*
 * Constructor
 */
function ContPg(fs_, path_, dir_, exec_, User_, validator_, 
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
 * Renderizamos la página para añadir una denuncia
 */
ContPg.prototype.renderNueva = function(req, res){
	res.render('nueva');
}

/*
 * Eliminar imagen de la carpeta temporal
 */
ContPg.prototype.deleteTempImage = function(req, res){
	var path_image = path.join(path.join(config.TEMPDIR, req.params.tempDirID), req.params.fileName);
	
	fs.unlink(path_image, function(error){
		if(error) return res.status(500).send('Error borrando la imagen:\n' + error);
		res.send('Imagen eliminada correctamente');
	});
	
}

/*
 * Subir una imagen a la carpeta temporal
 */
ContPg.prototype.uploadTempImage = function(req, res){
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
 * Añadimos un comentario en una denuncia.
 */
ContPg.prototype.addComentario = function(req, res){
	
	var denuncia, notificacion;
	var contenido = req.body.contenido;
	var user_id = req.user._id;
	var id_denuncia = req.params.id_denuncia;
	
	var datos = JSON.stringify({contenido : contenido});
	
	if (!contenido || !user_id || !id_denuncia) return res.status(500).send('Fallo insertando comentario');
	
	console.log(consultas.añadir_comentario);
	
	db.none(consultas.añadir_comentario, [user_id, id_denuncia, contenido])
		.then (function(){
			return db.one(consultas.denuncia_por_id, id_denuncia);
		})
		.then(function(denuncia_){
			denuncia = denuncia_;
			if(denuncia.id_usuario == user_id){
				res.redirect('back');
				var err = new Error('Notificación no enviada. Mismo usuario, prop de la denunc');
				err.same_user = true;
			}
			return db.one(consultas.notificar_denuncia_comentada, 
					[id_denuncia, user_id, denuncia.id_usuario, datos]);
		})
		.then(function(notificacion_){
			notificacion = notificacion_;
			if(clients[denuncia.id_usuario]){
				for(var socketId in clients[denuncia.id_usuario]){
					clients[denuncia.id_usuario][socketId].emit('denuncia_comentada', 
						{denuncia: denuncia, from: req.user, noti: notificacion});
				}
				res.redirect('back');
			}
			else {
				console.log('el usuario de la denuncia comentada está conectado');
				res.redirect('back');
			}
		})
		.catch(function(error){
			console.log(error);
			res.status(500).send(error);
		});

};

/* 
 * Guardamos la denuncia
 */

ContPg.prototype.saveDenuncia = function(req, res){
	
	var errormsg = '';
	
	var usuarios_cerca = [];
	var from;
	var imagenes = []; // Lista de imágenes a guardar en la base de datos
	var titulo = req.body.titulo.replace(/["' # $ % & + ` -]/g, " ");
	var contenido = req.body.contenido.replace(/["' # $ % & + ` -]/g, " ");
	var wkt = req.body.wkt;
	
	var user_id = validator.escape(req.user._id); // id_usuario
	var tempDirID = req.body.tempDir; // nombre del directorio temporal donde se guardan las imágenes
	
	var tags_ = req.body.tags.length > 0 ? req.body.tags : [];  // tags introducidos por el usuarios
	console.log(tags_);
	
	var denuncia_io = req.body;
	denuncia_io.id_usuario = user_id;
	// comprobando datos de la denuncia
	if(!validator.isLength(titulo, 5, 50)) errormsg += '· El título debe tener entre 5 y 50 caracteres.\n';
	if(!validator.isLength(contenido, 50, 10000)) errormsg += '· El contenido debe tener entre 50 y 10000 caracteres.\n';
	if(wkt == undefined) errormsg += '· Debe agregar un punto, línea o polígono\n';	
	
	// Si hay algún error en los datos devolvemos la denuncia
	if(errormsg.length > 0)
		return res.send({type: 'error', msg: errormsg});
	
	dbCarto.one(consultas.comprobar_geometria(wkt) , wkt)
		.then(function(geom_check){
			if (geom_check.st_contains == false)
				throw new Error('La geometría debe estar dentro de Torrent.');
			else if(wkt.match(/LINESTRING/g) && geom_check.st_length > 500)
				throw new Error('La geometría lineal no debe superar los 500 metros de longitud.');
			else if(wkt.match(/POLYGON/g) && geom_check.st_area > 10000)
				throw new Error('La geometría poligonal no debe superar un area mayor de 10.000 metros cuadrados.');
			
			
			dir.files(config.TEMPDIR + "/" + tempDirID, function(err, files) {
				// Recorremos el directorio temporal en busca de imágenes añadidas a la denuncia.
				// Almacenamos el path (TODO: almacenar también la descripción) en una lista
				// para luego introducir esos path en la bdd
				  if (err) {
					  console.log(err);
				  }
				  
				  // Para cada imagen subida la movemos del directorio temporal 
				  // a la carpeta final
				  files.forEach(function(ruta) {
					  
					  console.log('img: ' + path.basename(ruta));
				    
					  var from = path.join(config.TEMPDIR, tempDirID + "/" + path.basename(ruta));
					  var to = path.join(config.UPLOADDIR, tempDirID +"-" + path.basename(ruta));
					  
					 // Movemos la imagen desde la carpeta temporal hasta la carpeta final
					 fs.rename(from, to, function(err_) {
						 if(err_) console.log(err_);
						 
						 imagenes.push("/files/denuncias/" + path.basename(to)); 
						 console.log('imgs list(' + imagenes.length + '): ' + imagenes);
					  
					 });
				  });
			});
			
			
			return db.task(function * (t){
				// t = this = contexto bdd
				var q = []; // consultas a ejecutar --> añadir imagenes y tags
				
				let denuncia = yield this.one(consultas.añadir_denuncia, [titulo, contenido, wkt, user_id]);
				
				denuncia_io = denuncia;
				
				imagenes.forEach(function(path){
					q.push(t.none(consultas.añadir_imagen_denuncia, [path, denuncia.gid, user_id]));
				});
				
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
						{denuncia: denuncia_io, from: from, noti: notificacion, imagenes: imagenes});	
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
 * Renderizamos el Perfil del usuario
 */
ContPg.prototype.getProfile = function(req, res) {
	// En cualquier otro caso renderizamos
	console.log('mi PErfil');

	db.query(consultas.obtener_denuncias_usuario, req.user._id)
		.then (function(denuncias){
			res.render('profile', { misDenuncias: denuncias });
		})
		.catch (function(error){
			res.status(500);
			res.send(error);
		});

};

/*
 *  Ruta /app/denuncias?page=1,2,3....
 */
ContPg.prototype.getDenunciasPage = function(req, res){
	var numDenuncias = 0;
	var maxPages = 1;
	var page = req.query.page; 
	if (!validator.isNumeric(page.toString())){
		page = 1;
		console.log('pagina no numerica');
	}
	if(page <= 0) page = 1;
	db.query(consultas.numero_denuncias)
		.then(function(num_denuncias){
			numDenuncias = num_denuncias[0].numdenun;
			//if (Math.ceil(numDenuncias/10) > 0)
			maxPages = Math.ceil(numDenuncias/10);
			if (page > maxPages) page = maxPages;
			return db.query(consultas.obtener_denuncias_recientes_por_pagina, page);
			
		})
		.then (function(denuncias){
			
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
 * Ruta /app/denuncia/:id_denuncia
 */
ContPg.prototype.getDenunciaPage = function(req,res){
	
	db.query(consultas.denuncia_por_id, req.params.id_denuncia)
		.then(function(denuncia){
			if (denuncia.length == 0) throw new Error('Denuncia no encontrada');
			//console.log(denuncia);
			denuncia[0].geometria = JSON.stringify(denuncia[0].geometria);
			//denuncia.descripcion = denuncia.descripcion.replace(/\n?\r\n/g, '<br />' );
			res.render('denuncia', {denuncia: denuncia[0], user: req.user});
		})
		.catch(function(error){
			res.status(500);
			res.send(error);
		});
};

/*
 * Ruta app/deleteImagen?path=path_denuncia
 */
ContPg.prototype.deleteImagenDenuncia = function(req, res){
	if(!req.query.path){
		return res.status(500).send('no hay path');
	}
	else {
		var path = '/files/denuncias/' + req.query.path;
		
		db.query(consultas.eliminar_imagen_denuncia, path)
			.then(function(result){
				if (result.rowCount > 0){
					exec('rm -r ' + config.UPLOADDIR + '/' + req.query.path, function(error){
						if (error) throw error;
						else res.send('Imagen "' + path + '" eliminada correctamente.');
					});
				}
				else {
					res.send('No se encontró la imagen "' + path + '"');
				}
			})
			.catch(function(error){
				res.status(500).send(error);
			});
	}
}


ContPg.prototype.getEdit = function(req, res){
	var id = req.query.id;
	if(!id){
		//Mostar error
		return res.status(500).send('No se especificó el id de la denuncia');
	}
	else{
		console.log('editar');
		
		db.query(consultas.denuncia_por_id, id)
			.then(function(denuncia){
				if(denuncia.length == 0) throw new Error('No existe la denuncia');
				if(denuncia[0].id_usuario != req.user._id) throw new Error('Permiso denegado. Usted no puede editar esta denuncia.')
				//console.log(denuncia[0]);
				denuncia[0].tags_ = JSON.stringify(denuncia[0].tags_);
				console.log(denuncia[0]);
				res.render('editar.jade', {denuncia: denuncia[0]});
			})
			.catch(function(error){
				res.status(500).send(error);
			});
	}
};


/*
 *  Ruta /app/delete/
 */
ContPg.prototype.deleteDenuncia = function(req, res){
	
	if(!req.query.id){
		//Mostar error
		res.status(500).send('No se ha especificado el id de la denuncia');
	}
	console.log('delete ' + req.query.id);
	var id = req.query.id; // id de la denuncia
	
	var id_user = req.user._id; // id del usuario
	
	db.query(consultas.denuncia_por_id, id)
		.then(function(denuncia){
			if(!denuncia[0]) throw new Error('No existe denuncia');
			if(id_user != denuncia[0].id_usuario) 
				throw new Error('Usted no tiene permisos para eliminar esta denuncia');
			
			if (denuncia[0].imagenes){
				denuncia[0].imagenes.forEach(function(img){
					exec('rm -r ' + config.UPLOADDIR + "/" + path.basename(img.path), function ( errD, stdout, stderr ){
						// Eliminamos las imágenes de la carpeta FINAL
						if (errD) {
						console.log('error_mensaje --> ' + errD);
						}
						else console.log('imagen eliminada: ' + path.basename(img.path));
						
					}); 
				});
			} // hay imágenes, las eliminamos
			
			return db.none(consultas.eliminar_denuncia_por_id, id);
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
 * Update Denuncia
 */
ContPg.prototype.updateDenuncia = function(req, res){
	
	var id = req.query.id;
	
	var response = {}; // La respuesta que se envía
	var errormsg = ''; // mensaje de errores
	
	var imagenes = []; // Lista de imágenes a guardar en la base de datos
	var titulo = req.body.titulo.replace(/["' # $ % & + ` -]/g, " ");
	var contenido = req.body.contenido.replace(/["' # $ % & + ` -]/g, " ");
	var wkt = req.body.wkt;
	
	var user_id = validator.escape(req.user._id); // id_usuario
	var tempDirID = req.body.tempDir; // nombre del directorio temporal donde se guardan las imágenes
	
	var tags_ = req.body.tags.length > 0 ? req.body.tags : [];  // tags introducidos por el usuarios
	console.log(tags_);
	
	var denuncia_io = req.body;
	denuncia_io.id_usuario = user_id;
	// comprobando datos de la denuncia
	if(!validator.isLength(titulo, 5, 50)) errormsg += '· El título debe tener entre 5 y 50 caracteres.\n';
	if(!validator.isLength(contenido, 50, 10000)) errormsg += '· El contenido debe tener entre 50 y 10000 caracteres.\n';
	if(wkt == undefined) errormsg += '· Debe agregar un punto, línea o polígono\n';	
	
	// Si hay algún error en los datos devolvemos la denuncia
	if(errormsg.length > 0)
		return res.send({type: 'error', msg: errormsg});
	
	dbCarto.one(consultas.comprobar_geometria(wkt), wkt)
		.then(function(geom_check){
			if (geom_check.st_contains == false)
				throw new Error('La geometría debe estar dentro de Torrent.');
			else if(wkt.match(/LINESTRING/g) && geom_check.st_length > 500)
				throw new Error('La geometría lineal no debe superar los 500 metros de longitud.');
			else if(wkt.match(/POLYGON/g) && geom_check.st_area > 10000)
				throw new Error('La geometría poligonal no debe superar un area mayor de 10.000 metros cuadrados.');
			
			
			dir.files(config.TEMPDIR + "/" + tempDirID, function(err, files) {
				// Recorremos el directorio temporal en busca de imágenes añadidas a la denuncia.
				// Almacenamos el path (TODO: almacenar también la descripción) en una lista
				// para luego introducir esos path en la bdd
				  if (err) {
					  console.log(err);
				  }
				  
				  // Para cada imagen subida la movemos del directorio temporal 
				  // a la carpeta final
				  files.forEach(function(ruta) {
					  
				    console.log('img: ' + path.basename(ruta));
				    
					  var from = path.join(config.TEMPDIR, tempDirID + "/" + path.basename(ruta));
					  var to = path.join(config.UPLOADDIR, tempDirID +"-" + path.basename(ruta));
					  
					 // Movemos la imagen desde la carpeta temporal hasta la carpeta final
					 fs.rename(from, to, function(err_) {
						 if(err_) console.log(err_);
						 
						 imagenes.push("/files/denuncias/" + path.basename(to)); 
						 console.log('imgs list(' + imagenes.length + '): ' + imagenes);
					  
					 });
				  });
			});
			
			
			return db.task(function * (t){
				// t = this = contexto bdd
				var q = []; // consultas a ejecutar --> añadir imagenes y tags
				
				q.push(t.none(consultas.actualizar_denuncia, [titulo, contenido, wkt, id]));
				
				imagenes.forEach(function(path){
					q.push(t.none(consultas.añadir_imagen_denuncia, [path, id, user_id]));
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
			res.send({type: 'error', msg: error.toString()})
		});
}; // Fin saveDenuncia


ContPg.prototype.getUpdateProfilePage = function(req, res){
	res.render('editarPerfil.jade', {user: req.user});
}

ContPg.prototype.updateProfile = function(req, res){
	
	var user = req.user;
	
	var nombre_usuario = req.body.username;
	var nombre = req.body.nombre;
	var apellidos = req.body.apellidos;
	
	var nueva_password = req.body.password;
	var nueva_password_rep = req.body.repassword;
	
	var changedPassword = false;
	var changedProfile = false;
	
	// Validar
	if(nueva_password && !validator.isLength(nueva_password,5,20)){
		return res.send({error: true, msg: 'La contraseña debe tener entre 5 y 20 caracteres'});
	}
	
	if(nueva_password != nueva_password_rep){
		return res.send({error: true, msg: 'Las contraseñas deben coincidir'});	
	}
	else if(nueva_password){
		user.password = User.generateHash(nueva_password);
		changedPassword = true;
	}
	
	if(nombre && !validator.isLength(nombre, 2, 10)){
		return res.send({error: true, msg: 'El nombre debe tener entre 2 y 10 caracteres'});
	}
	else if(nombre){
		user.profile.nombre = nombre;
		changedProfile = true;
	}
	
	if(apellidos && !validator.isLength(apellidos, 3, 15)){
		return res.send({error: true, msg: 'Los apellidos deben tener entre 3 y 15 caracteres'});

	}
	else if(apellidos){
		user.profile.apellidos = apellidos;
		changedProfile = true;
	}
	
	if(nombre_usuario && !validator.isLength(nombre_usuario, 5, 15)){
		return res.send({error: true, msg: 'El nombre de usuario debe tener entre 5 y 10 caracteres'});

	}
	
	var aux = nombre_usuario || '1';
	db.query(consultas.usuario_por_username, aux)
		.then(function(usuario){
			if(usuario[0]) throw new Error('El nombre de usuario ya existe');
			return db.none(consultas.actualizar_info_usuario, [user.passwors, JSON.stringify(user.profile), user._id]);
		})
		.then(function(){
			res.status(200).send({error: false, msg: 'Perfil actualizado correctamente'});
		})
		.catch(function(error){
			res.send({error: true, msg: error.toString()})
		});
	
}



var formatsAllowed = 'png|jpg|jpeg|gif'; // Podríamos poner más

ContPg.prototype.changeProfilePicture = function(req, res) {
	
	multer_imagen_perfil(req, res, function(error){
		
		if(error) return res.status(500).send({type: 'error', msg: 'Error subiendo archivo. ' + error});
		
		// La imagen se subió correctamente
		//console.log('imagen subida guay ' + JSON.stringify(req.files.file));
		var file = req.file;
		var extension = path.extname(file.path);
		
		console.log('patttth ' + file.path);
		
		if(!extension.match(formatsAllowed)){
			// Eliminamos la imagen subida si no es de uno de los formatos permitidos
			fs.unlink(path.join('./public/files/usuarios', path.basename(file.path)), function(error_){
				if(error_) console.log('error unlink ' + error_);
				return res.status(413).send({type: 'error', msg: 'Formato no permitido'});
			});
		}
		else {
	        var user = req.user;
	        var sub = '/files/usuarios'
	        if(user.profile.picture.indexOf(sub) > -1){
	        	console.log('eliminando imagen anterior');
	        	// Tenía una imagen subida
	        	fs.unlink(path.join('./public', user.profile.picture), function(err){
	        		if(err) console.log(err); // No debería ocurrir
	        	});
	        }
	        
	    	user.profile.picture = path.join('/files/usuarios', path.basename(file.path));
	        
	        db.none(consultas.actualizar_perfil, [JSON.stringify(user.profile), user._id])
	        	.then(function(){
	        		for (var socketId in global.clients[req.user._id])
	        			global.clients[req.user._id][socketId].emit('imagen cambiá', {path : user.profile.picture});
	        		res.send({
	        			type: 'success', 
	        			msg: 'Imagen de Perfil cambiada correctamente.',
	        			path: user.profile.picture
	        		});
	        	})
	        	.catch(function(error){
	        		res.status(500).send(error);
	        	});
		}
		
	});
		
};


ContPg.prototype.getEditLoc = function(req,res){
	
	db.one(consultas.obtener_loc_preferida, req.user._id)
		.then(function(location){
			res.render('editarLoc.jade', {loc_pref: location.loc_pref});
		})
		.catch(function(error){
			res.status(500).send(error);
		});
	
}

ContPg.prototype.postChangeLoc = function(req, res){
	
	var wkt = req.body.wkt;
	
	console.log(wkt + " WKTTTTTTTTTTTTT");
	
	dbCarto.query(consultas.comprobar_geometria(wkt))
		.then(function(check_geom){
			if(!check_geom[0].st_contains) throw new Error('La geometría debe estar en torrent');
			
			return db.none(consultas.actualizar_loc_pref, [wkt, req.body.distancia, req.user._id]);
			
		})
		.then(function(){
			res.send({error: false, msg: 'Ubicación preferida cambiada correctamente'});
		})
		.catch(function(error){
			res.status(500).send({error: true , msg : error.toString()});
		});
	
}

ContPg.prototype.changeImageGravatar = function(req, res){
	
	var user = req.user;
	var sub = '/files/usuarios'
	if(user.profile.picture.indexOf(sub) > -1){
    	fs.unlink(path.join('./public', user.profile.picture), function(err){
    		console.log('imagen anterior eliminada');
    		if(err) console.log(err); // No debería ocurrir
    	});
	}
	
	user.profile.picture = req.body.gravatar;
	
	db.none(consultas.actualizar_perfil, [JSON.stringify(user.profile), user._id])
		.then(function(){
    		for (var socketId in global.clients[req.user._id])
    			global.clients[req.user._id][socketId].emit('imagen cambiá', {path : user.profile.picture});
			res.send({msg: 'Imagen de perfil actualizada correctamente', path: req.body.gravatar});
		})
		.catch(function(error){
			res.status(500).send(error);
		});
	
}


ContPg.prototype.getVisorPage = function(req, res){
	
	db.query(consultas.denuncias_visor)
		.then(function(denuncias){
			res.render('visor.jade', {denuncias: JSON.stringify(denuncias)});
		})
		.catch(function(error){
			res.status(500).send(error);
		});
	
}


module.exports = ContPg;

