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
	io,
	db, 
	dbCarto, 
	consultas, 
	client;
	
/*
 * Constructor
 */
function ContPg(fs_, path_, dir_, exec_, User_, validator_, 
		sio, db_, dbCarto_, consultas_){
	io = sio;
	fs = fs_;
	path = path_;
	dir = dir_;
	exec = exec_;
	User = User_;
	validator = validator_;
	db = db_;
	dbCarto = dbCarto_;
	consultas = consultas_;
	
}

/*
 * Añadimos un comentario en una denuncia.
 */
ContPg.prototype.addComentario = function(req, res){
	
	var contenido = req.body.contenido;
	var user_id = req.user._id;
	var id_denuncia = req.params.id_denuncia;
	
	if (!contenido || !user_id || !id_denuncia) return res.send(404);
	
	console.log(consultas.añadir_comentario);
	
	db.none(consultas.añadir_comentario, [user_id, id_denuncia, contenido])
		.then (function(){
			return res.redirect('back');
		})
		.catch(function(error){
			console.log(error);
			res.send(404);
		});

};

/* 
 * Guardamos la denuncia
 */

ContPg.prototype.saveDenuncia = function(req, res){
	
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
	
	dbCarto.one(consultas.comprobar_geometria(wkt))
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
				
				denuncia_io.id = denuncia.gid;
				
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
			res.send({
				type: 'success', 
				msg: 'Denuncia guardada correctamente',
				denuncia: denuncia_io
			});
		})
		.catch(function(error){
			console.log('Error insertando nueva denuncia ' + error);
			res.send({type: 'error', msg: error.toString()})
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
	var page = req.query.page; // TODO: comprobar que sea un número
	if (!validator.isNumeric(page.toString())){
		page = 1;
	}
	db.query(consultas.numero_denuncias)
		.then(function(num_denuncias){
			numDenuncias = num_denuncias[0].numdenun;
			if (Math.ceil(numDenuncias/10) > 0)
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

/*
 * Ruta /app/getImagenes?id=id_denuncia
 */
ContPg.prototype.getImagenesDenuncia = function(req, res){
	if (!req.query.id) return res.status(500).send('No se ha especificado el id de la denuncia');
	var id = req.query.id;
	
	db.query(consultas.denuncia_por_id, id)
		.then(function(denuncia){
			var list = [];
			if(denuncia[0].imagenes)
				denuncia[0].imagenes.forEach(function(imagen){
					var obj = {};
					obj.name = path.basename(imagen.path);
					obj.size = 0;
					obj.path = imagen.path;
					list.push(obj);
				});
			
			res.send(list);
		})
		.catch(function(error){
			res.status(500).send(error);
		});
}

/*
 *  Ruta /app/edit/
 */
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
				denuncia[0].tags_ = JSON.stringify(denuncia.tags_);
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
	
	dbCarto.one(consultas.comprobar_geometria(wkt))
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
			console.log('Error insertando nueva denuncia ' + error.toString());
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
	db.query(usuario_por_username, aux)
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
		
	var sms = {}; //JSON DE INFO QUE ENVIAREMOS
	
	
	var file = req.files.file;
	console.log(req.files);
	var extname = path.extname(file.path);
	if (!extname.match(formatsAllowed)){
        var msg = "Error subiendo tu archivo. Formato no válido. ";
        var type="error";
        sms.type = type;
        sms.msg = msg;
        return res.send(sms);
	}
	console.log(file.size );
	if (file.size > (4096*1024)){
        var msg = "Error subiendo tu archivo. Imagen demasiado grande. ";
        var type="error";
        sms.type = type;
        sms.msg = msg;
        return res.send(sms);
	}
	var from = file.path; // Ruta origen
	var to = path.join('./public/files/usuarios', req.user._id + path.extname(file.name));
	console.log(to);
	fs.rename(from, to, function(err) {
		     if(err) { 
		        var msg = "Error subiendo tu archivo "+err;
		        var type="error";
		        sms.type = type;
		        sms.msg = msg;
		        console.error('error', err);
		        return res.send(sms);
		     } 
		     else {
		        var fileSize = file.size/1024;
		        var msg = "Archivo subido correctamente a "+to+" ("+(fileSize.toFixed(2)) +" kb)";
		        var type="success";
		        sms.type = type;
		        sms.msg = msg;
		        sms.path = path.join('/files/usuarios', req.user._id + path.extname(file.name));
		        
		        var user = req.user;
	        	
	        	user.profile.picture = path.join('/files/usuarios', req.user._id + path.extname(file.name));
		        
		        db.none(consultas.actualizar_perfil, [JSON.stringify(user.profile), user._id])
		        	.then(function(){
		        		res.send(sms);
		        	})
		        	.catch(function(error){
		        		res.status(500).send(error);
		        	});
		        
		     }
		     
	  });
};


ContPg.prototype.getEditLoc = function(req,res){
	
	db.query(consultas.obtener_loc_preferida, req.user._id)
		.then(function(location){
			res.render('editarLoc.jade', {loc_pref: location[0].loc_pref});
		})
		.catch(function(error){
			res.status(500).send(error);
		});
	
}

ContPg.prototype.postChangeLoc= function(req, res){
	
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
			res.status(500).send(error);
		});
	
}

ContPg.prototype.changeImageGravatar = function(req, res){
	
	var user = req.user;
	
	user.profile.picture = req.body.gravatar;
	
	db.none(consultas.actualizar_perfil, [JSON.stringify(user.profile), user._id])
		.then(function(){
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

