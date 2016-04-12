'use strict';
var fs = require('fs'), // file System
	path = require('path'), // util para paths
	exec = require('child_process').exec, // Ejecutar comandos
	denunciasPorPagina = 10,
	maxPaginas = 0,
	config = require('../../config/upload.js'),
	validator = require('validator'), // validator 
	database = require('../../config/database.js'),
	db = database.db, 
	dbCarto = database.dbCarto, 
	consultas = require('../controllers/queries.js'),
	crypto = require('crypto'),
	mkdirp = require('mkdirp'),
	formatsAllowed = 'png|jpg|jpeg|gif', // Podríamos poner más
	usuarioModel = require('../models/usuario.js'),
	this_;
/*
 * Constructor
 */
function Denuncia(){
	this_ = this;
	usuarioModel = new usuarioModel();
}

Denuncia.prototype.find_by_id = function(id_denuncia, callback){
	db.one(consultas.denuncia_por_id, id_denuncia)
	.then(function(denuncia){
		// Asignamos geometría
		denuncia.geometria = denuncia.geometria_pt || denuncia.geometria_li || denuncia.geometria_po;
		
		callback(null, denuncia);
	})
	.catch(function(error){
		callback(error);
	});
};

Denuncia.prototype.find_by_path_image = function(path, callback){
	db.one(consultas.denuncia_por_path_imagen, path)
	.then(function(denuncia){
		callback(null, denuncia);
	})
	.catch(function(error){
		callback(error);
	});
};

Denuncia.prototype.comprobar_geometria = function(wkt, callback){
	// ejecutamos consulta para comprobar que la geometría es correcta	
	dbCarto.one(consultas.comprobar_geometria(wkt) , wkt)
	.then(function(geom_check){
		// Si la geometría no está en torrent 
		if (geom_check.st_contains == false)
			callback({type : 'error', msg : 'denuncia_geometria_dentro'});
		// Si la geometría lineal supera los 200 metros
		else if(wkt.match(/LINESTRING/g) && geom_check.st_length > 200)
			callback({type : 'error', msg : 'denuncia_geometria_lineal'});
		// Si la geometría poligonal supera los 5000 metros cuadrados
		else if(wkt.match(/POLYGON/g) && geom_check.st_area > 5000)
			callback({type : 'error', msg : 'denuncia_geometria_poligonal'});
	})
	.catch(function(error){
		callback(error);
	});
};

Denuncia.prototype.get_usuarios_cerca = function(wkt, id_usuario, callback){
	db.any(consultas.usuarios_cerca_de_denuncia, [wkt, id_usuario])
	.then(function(usuarios){
		callback(null, usuarios);
	})
	.catch(function(error){
		callback(error);
	})
};

Denuncia.prototype.crear_temp_dir = function(callback){
	// Creamos un string hexadecimal aleatorio que servirá de identificador
	// del directorio temporal
	crypto.randomBytes(25, function(ex, buf) {
		// Obtenemos el String
  		var token = buf.toString('hex');
  		// Creamos una carpeta en el directorio temporal
		mkdirp(path.join(config.TEMPDIR, token), function (error){
			if(error) return callback(error);
			// renderizamos la página de nueva denuncia pasándole el token
			return callback(null, token);
		}); // Crea un directorio si no existe
	});
}

Denuncia.prototype.eliminar_imagen_temporal = function(tempdir, filename, callback){
	// Path de la imagen 
	var path_image = path.join(path.join(config.TEMPDIR, tempdir), filename);
	// Eliminamos la imagen
	fs.unlink(path_image, function(error){
		if(error) return callback(error);
		return callback(null);
	});
};

Denuncia.prototype.subir_imagen_temporal = function(file, callback){
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
			callback({type : 'error'})
		});
	}
	else callback(null);
};

Denuncia.prototype.añadir_comentario = function(opciones, callback){

	// Parámetros para añadir comentario
	//var denuncia, notificacion;
	var contenido = opciones.contenido;
	var id_denuncia = opciones.id_denuncia;
	var usuario_from = opciones.usuario_from;
	var id_usuario = usuario_from._id;
	var denuncia;
	// ejecutamos la consulta para añadir comentario
	db.none(consultas.añadir_comentario, [id_usuario, id_denuncia, contenido])
	.then(function(){
		this_.find_by_id(id_denuncia, function(error, denuncia_){
			denuncia = denuncia_;
			var datos = JSON.stringify({contenido : contenido});
			// Si es el propio usuario el que comenta su denuncia no enviamos la notificación
			if(denuncia.id_usuario == user_id) 
				callback(null, {type : 'error', msg : 'mismo_usuario'});
			else
				return db.one(consultas.notificar_denuncia_comentada, 
					[id_denuncia, id_usuario_from, denuncia.id_usuario, contenido]);
		});
	})
	.then(function(notificacion){
		if(clients[denuncia.id_usuario]){
			// Emitimos la notificación a todos sus sockets abiertos
			for(var socketId in clients[denuncia.id_usuario]){
				clients[denuncia.id_usuario][socketId].emit('denuncia_comentada', 
					{denuncia: denuncia, from: usuario_from, noti: notificacion});
			}
			callback(null);
		}
		else {
			console.log('el usuario de la denuncia comentada está desconectado');
			callback(null);
		}
	})
	.catch(function(error){
		callback(error);
	});

};

Denuncia.prototype.guardar = function(opciones, callback){
	
	var usuarios_cerca = [];
	var usu_from; // Usuario denuncia

	var imagenes = []; // Lista de imágenes a guardar en la base de datos

	var titulo = opciones.titulo;
	var contenido = opciones.contenido;  // Contenido de la denucnia
	var wkt = opciones.wkt; // geometría de la denuncia

	var id_usuario = opciones.id_usuario; // id_usuario
	var tempDirID = opciones.tempDir; // nombre del directorio temporal donde se guardan las imágenes
	
	var tags_ = opciones.tags;  // tags introducidos por el usuarios
	
	var denuncia_io = {}; // copia de la denuncia
	denuncia_io.id_usuario = id_usuario; // asignamos id de usuario
	denuncia_io.wkt = wkt; // Asignamos la geometría a la denuncia

	// Ejecutamos la tarea para añadir denuncia, tags, imágenes
	db.task(function * (t){
		// t = this = contexto bdd = db
		var q = []; // Consultas a ejecutar --> añadir imagenes y tags
		// Ejecutamos la consulta síncrona (ES-6) para añadir una denuncia, asignamos el resultado
		// de la consulta a la variable denuncia 
		let denuncia = yield this.one(consultas.insert_denuncia, [titulo, contenido, id_usuario]);
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
			    // String --> path desde donde tengo que mover el archivo
				var from_ = path.join(config.TEMPDIR, tempDirID + "/" + path.basename(ruta));
				// String --> path final donde se alojará el archivo
				var to = path.join(config.UPLOADDIR, denuncia.gid + "/" + tempDirID + "-" + path.basename(ruta));
				// path relativo para almacenar en la base de datos
				var path_ = "/files/denuncias/" + denuncia.gid + "/" + path.basename(to); 
				// Añadimos la consulta para añadir las imágenes a la base de datos
				q.push(t.none(consultas.añadir_imagen_denuncia, [path_, denuncia.gid]));
				// Movemos la imagen
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
	})
	.then (function(){			
		// La denuncia se ha añadido correctamente
		//console.log(denuncia_io + ' new denuncia addedd');
		// Emitimos a todos los usuarios y a mi que hemos añadido una denuncia
		for(var socketId in global.clients[id_usuario]){
			// A todos menos a mi 
			global.clients[id_usuario][socketId].broadcast.emit('new_denuncia', {denuncia: denuncia_io});
			// Me la emito a todos mis sockets abiertos
			for (var sid in global.clients[id_usuario])
				global.clients[id_usuario][sid].emit('new_denuncia', {denuncia: denuncia_io});
			break;
		}
		// Ejecutamos la conulta para buscar usuarios cerca  informarles de que
		// hemos añadido una denuncia cerca de su ubicación
		this_.get_usuarios_cerca(wkt, id_usuario, function(error, usuarios_cerca){
			// Si no hay usuarios cerca...
			if(usuarios_cerca.length == 0) {
				console.log('NO HAY USUARIOS AFECTADOS');
				// Enviamos un mensaje de que la denuncia se ha guardado correctamente
				callback(null, {
					type: 'success', 
					msg: 'Denuncia guardada correctamente',
					denuncia: denuncia_io,
					num_usuarios_afectados : usuarios_cerca.length
				});
			}
			// Si hay usuarios cerca...
			else {
				console.log('HAY ' + usuarios_cerca.length + ' USUARIOS AFECTADOS');
				// Asignamos a la variable usuarios_cerca los usuarios
				Usuario.find_by_id(id_usuario, function(error, usuario_from){
					usu_from = usuario_from;
					// Denuncia que hemos añadido
					this_.find_by_id(id_usuario, function(error, denuncia){
						// Asignamos
						denuncia_io = denuncia;
						// ejecutamos tarea
						return db.tx(function (t){
							var q = []; // Consultas
							// Recorremos los usuarios cerca
							usuarios_cerca.forEach(function(user){
								// Guardamos la distancia buffer del usuario en una variable
								var datos = JSON.stringify({distancia : user.distancia});
								// Añadimos la consulta para añadir notificación en la base de datos
								q.push(db.one(consultas.notificar_denuncia_cerca, 
									[denuncia_io.gid, id_usuario, user._id, datos]));
							});
							// Ejecutamos la conulta
							return t.batch(q);
						});
					});
				});
			}
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
		callback(null, {
			type: 'success', 
			msg: 'Denuncia guardada correctamente',
			denuncia: denuncia_io,
			num_usuarios_afectados : usuarios_cerca.length
		});
	})
	.catch(function(error){
		callback(error);
	});
}; // Fin saveDenuncia

Denuncia.prototype.find_by_pagina = function(page, callback){
	console.log('pagina');
	// Parámetros por defecto 
	var numDenuncias = 0;
	var maxPages = 1;
	//Ejecutamos la consulta para obtener el número de denuncias 
	db.one(consultas.numero_denuncias)
	.then(function(num_denuncias){
		// Obtenemos el número de denuncias totales
		// Asignamos el número de denuncis a una variable global
		numDenuncias = num_denuncias.numdenuncias;
		//if (Math.ceil(numDenuncias/10) > 0)
		// Calculamos el número máximo de página
		maxPages = Math.ceil(numDenuncias/10);
		//console.log('numDenuncias', numDenuncias, 'maxPages', maxPages);
		// Si la página solicitada es mayor que el número de páginas que puede haber
		// Asignamos la máxima página
		if (page > maxPages) {
			callback({type : 'error', msg : 'pagina_no_existe'})
		}
		// Ejecutamos la consulta para obtener las denuncias recientes por página
		else return db.query(consultas.obtener_denuncias_recientes_por_pagina, page);
		
	})
	.then(function(denuncias){
		// Obtenemos las denuncias y las recorremos
		denuncias.forEach(function(d){
			// Asignamos la geometría a la denuncia
			d.geometria = d.geometria_pt || d.geometria_li || d.geometria_po;
		});
		//console.log(denuncias);
		// Respondemos renderizando la página con las denuncias
		callback(null,{
			denuncias : denuncias, 
			page: page,
			maxPages: maxPages
		});
	})
	.catch(function(error){
		callback(error);
	});
};

Denuncia.prototype.eliminar_imagen = function(path, callback){
	exec('rm -r ' + './public' + path, function(error){
		if (error) callback(error);
		// Enviamos respuesta satisfactoria
		else
			db.query(consultas.eliminar_imagen_denuncia, path)
			.then(function(result){
				//console.log(result);
				callback(null);
			})
			.catch(function(error){
				callback(error);
			});
	});
};

Denuncia.prototype.eliminar = function(id_denuncia, callback){
	// Eliminamos la carpeta de imágenes de la denuncia
	exec('rm -r ' + config.UPLOADDIR + "/" + id_denuncia, function ( error, stdout, stderr ){
		// Eliminamos las imágenes de la carpeta FINAL
		if (error)
			callback(error);
		else {
			console.log('imagenes eliminadas ');
			db.none(consultas.eliminar_denuncia, [id_denuncia])
			.then(function(){
				// La denuncia se eliminó correctamente
				callback(null);
			})
			.catch(function(error){
				callback(error);
			});
		}
	}); 
};

Denuncia.prototype.editar = function(opciones, callback){
	// id de la denuncia
	var id_denuncia = opciones.id_denuncia;
	
	//var response = {}; // La respuesta que se envía
	var errormsg = ''; // mensaje de errores
	
	var imagenes = []; // Lista de imágenes a guardar en la base de datos

	var denuncia_original = opciones.denuncia_original;

	var titulo = opciones.titulo; // título
	var contenido = opciones.contenido; // contenido
	var wkt = opciones.wkt; // Geometría
	
	var id_usuario = opciones.id_usuario; // id_usuario
	var tempDirID = opciones.tempDir; // nombre del directorio temporal donde se guardan las imágenes
	
	var tags_ = opciones.tags;  // tags introducidos por el usuarios
	
	var denuncia_io = {}; // objeto denuncia
	// Asignamos más valores a la denuncia--> gid, id_usuario
	denuncia_io.id_usuario = user_id;
	denuncia_io.gid = id;

	// tipo de geometría introducida
	var tipo = wkt.match(/LINESTRING/g) ? 'LineString' : (wkt.match(/POLYGON/g) ? 'Polygon': 'Point');
	//var denuncia;
	db.task(function * (t){
		// t = this = contexto bdd
		var q = []; // Consultas
		// Leemos el directorio temporal
		var files = fs.readdirSync(config.TEMPDIR + "/" + tempDirID);
		// Si hay imágenes...
		if (files){
			try {
				// Intenyamos crear un directorio temporal por su no lo hubiera
				fs.mkdirSync(path.join(config.UPLOADDIR, id_denuncia));
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
				var to = path.join(config.UPLOADDIR, id_denuncia + "/" + tempDirID + "-" + path.basename(ruta));
				// PAth para introducir en la base de datos
				var path_ = "/files/denuncias/" + id_denuncia + "/" + path.basename(to); 
				// Añadimos la consulta a la tarea
				q.push(t.none(consultas.añadir_imagen_denuncia, [path_, id_denuncia]));
				// Movemos la imagen
				fs.renameSync(from_, to);
			});
		}

		// Consulta síncrona para borrar todos los tags de la denuncia
		let borrar_tags = yield t.none(consultas.delete_all_tags, id);
		//console.log('borrar ', borrar);
		// tipo de geometría que tenía anteriormente
		var tipo_ant = denuncia_original.geometria.type;
		//var fecha = denuncia.fecha;
		console.log(tipo);
		// Ha cambiado la geometría de la denuncia ¿?
		if (tipo != tipo_ant){
			// Eliminamos la geometría de la tabla en la que esté
			let borrar_geom = yield t.none(consultas.eliminar_geometria_por_id(tipo_ant), id_denuncia);
			// Insertamos la geometría en la tabla que corresponda
			q.push(t.none(consultas.añadir_geometria(wkt), [id_denuncia, wkt]));
			// Actualizamos el contenido de la denuncia
			q.push(t.none(consultas.actualizar_denuncia, [titulo, contenido, id_denuncia]));
		}
		else {
			// Si no ha cambiado actualizamos la geometria dentro de la misma tabla por si a caso
			// aun siendo el mismo tipo de geometría, ha cambiado las coordenadas
			q.push(t.none(consultas.actualizar_geometria(tipo), [wkt, id_denuncia]));
			// Actualizamos info denuncia
			q.push(t.none(consultas.actualizar_denuncia, [titulo, contenido, id_denuncia]));
		}
		//console.log('imagenes' + imagenes);
		// Recorremos las imágenes
		imagenes.forEach(function(path){
			//console.log('imagenes--' + path);
			// Añadimos consulta a la tarea para añadir imagen
			q.push(t.none(consultas.añadir_imagen_denuncia, [path, id_denuncia]));
		});
		// Recorremos los tags
		tags_.forEach(function(tag){
			// Añadimos consulta a la tarea para añadir tag
			q.push(t.none(consultas.añadir_tag_denuncia, [id_denuncia, tag]));
		});
		// Ejecutamos las consultas
		return t.batch(q);	
	})
	.then (function(){
		// Enviamos respuesta satisfactoria
		callback(null, {
			type: 'success', 
			msg: 'Denuncia actualizada correctamente',
		});
	})
	.catch(function(error){
		console.log('Error actualizando denuncia ' + JSON.stringify(error));
		callback(error);
	});	

}; // Fin saveDenuncia

Denuncia.prototype.denuncias_visor = function(callback){
	// Ejecutamos consulta para obtener denuncias del visor
	db.query(consultas.denuncias_visor)
	.then(function(denuncias){
		// Recorremos las denuncias
		denuncias.forEach(function(denuncia){
			// Asignamos geometría a la denuncia
			denuncia.geometria = denuncia.geometria_pt || denuncia.geometria_li || denuncia.geometria_po;
		});
		// Renderizamos la página con las denuncias
		callback(null, {denuncias: denuncias});
	})
	.catch(function(error){
		callback(error);
	});	
};

module.exports = Denuncia;