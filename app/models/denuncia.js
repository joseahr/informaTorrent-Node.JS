'use strict';
var fs = require('fs'), // file System
	path = require('path'), // util para paths
	exec = require('child_process').exec, // Ejecutar comandos
	denunciasPorPagina = 10,
	maxPaginas = 0,
	config = require('../../config/upload.js'),
	validator = require('validator'), // validator 
	database = require('../../config/database.js'),
	pgp = database.pgp,
	db = database.db, 
	dbCarto = database.dbCarto, 
	consultas = require('../controllers/queries.js'),
	crypto = require('crypto'),
	mkdirp = require('mkdirp'),
	formatsAllowed = 'png|jpg|jpeg|gif', // Podríamos poner más
	this_;
/*
 * Constructor
 */
function Denuncia(){
	this_ = this;
}

Denuncia.prototype.set_titulo = function(titulo, id_denuncia){
	return db.none(consultas.set_titulo, [titulo, id_denuncia]);
};

Denuncia.prototype.set_contenido = function(contenido, id_denuncia){
	return db.none(consultas.set_contenido, [contenido, id_denuncia]);
};

Denuncia.prototype.is_equal = function(wkt, geojson){
	return db.one(consultas.is_equal, [wkt, JSON.stringify(geojson)]);
};

Denuncia.prototype.eliminar_tag = function(tag, id_denuncia){
	return db.none(consultas.eliminar_tag, [tag, id_denuncia]);
};

Denuncia.prototype.find = function(filtro, callback){
	// Consultas que se hagan de la api de denuncias

	// formateamos la consulta
	var query = consultas[filtro.consulta].query + filtro_denuncias(filtro);
	// realizamos la consulta
	db.query(query)
	.then(function(denuncias){
		// obtenemos las denuncias respecto a los criterios de búsqueda
		denuncias.forEach(function(denuncia){
			// Asignamos geometría
			denuncia.geometria = denuncia.geometria_pt || denuncia.geometria_li || denuncia.geometria_po;
			denuncia.geometria_pt = undefined;
			denuncia.geometria_li = undefined;
			denuncia.geometria_po = undefined;
			denuncia.geom_pt = undefined;
			denuncia.geom_li = undefined;
			denuncia.geom_po = undefined;
		});
		//console.log('denuncias api');
		callback(null, {query: denuncias});					
	})
	.catch(function(error){
		console.log(error.toString());
		callback({type : 'error', msg : error.toString()});
	});
};

Denuncia.prototype.find_by_id = function(id_denuncia, callback){
	db.one(consultas.denuncia_por_id, id_denuncia)
	.then(function(denuncia){
		// Asignamos geometría
		denuncia.geometria = denuncia.geometria_pt || denuncia.geometria_li || denuncia.geometria_po;
		
		callback(null, denuncia);
	})
	.catch(function(error){
		callback({type : 'error', msg : error.toString()});
	});
};

Denuncia.prototype.find_by_path_image = function(path, callback){
	db.one(consultas.denuncia_por_path_imagen, path)
	.then(function(denuncia){
		callback(null, denuncia);
	})
	.catch(function(error){
		callback({type : 'error', msg : error.toString()});
	});
};

Denuncia.prototype.get_size = function(callback){
	db.one(consultas.numero_denuncias)
	.then(function(num_denuncias){
		// Obtenemos el número de denuncias totales
		// Asignamos el número de denuncis a una variable global
		callback(null, num_denuncias.numdenuncias);	
	})
	.catch(function(error){
		callback({type : 'error', msg : error.toString()});
	});
};

Denuncia.prototype.comprobar_geometria = function(wkt, callback){
	// ejecutamos consulta para comprobar que la geometría es correcta	
	dbCarto.one(consultas.comprobar_geometria(wkt) , wkt)
	.then(function(geom_check){
		callback(null, geom_check);
	})
	.catch(function(error){
		console.log(error);
		callback({type : 'error', msg : error.toString()});
	});
};

Denuncia.prototype.get_usuarios_cerca = function(wkt, id_usuario, callback){
	db.any(consultas.usuarios_cerca_de_denuncia, [wkt, id_usuario])
	.then(function(usuarios){
		callback(null, usuarios);
	})
	.catch(function(error){
		callback({type : 'error', msg : error.toString()});
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
			if(error) 
				return callback({type : 'error', msg : error.toString()});
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
		if(error) 
			return callback({type : 'error', msg : error.toString()});
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
		fs.unlink(to, function(error){
			if(error) console.log('error unlink ' + error_);
			// Enviamos error
			callback({type : 'error'});
		});
	}
	else 
		callback(null, to);
};

Denuncia.prototype.sumar_visita = function(id_denuncia, callback){
	db.none(consultas.denuncia_vista, id_denuncia)
	.then(function(){
		console.log('incrementado veces_vista');
		callback(null);
	})
	.catch(function(error){
		console.log(error.toString());
		callback({type : 'error', msg : error.toString()});
	});
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
		return db.one(consultas.denuncia_por_id, id_denuncia);
	})
	.then(function(denuncia_){
		denuncia = denuncia_;
		denuncia.geometria = denuncia.geometria_pt || denuncia.geometria_li || denuncia.geometria_po;
		var datos = JSON.stringify({contenido : contenido});
		// Si es el propio usuario el que comenta su denuncia no enviamos la notificación
		console.log(id_usuario, denuncia.id_usuario);
		if(denuncia.id_usuario == id_usuario){
			var error = new Error('mismo_usuario');
			error.mismo_usuario = true;
			throw error;
		}
		else
			return db.one(consultas.notificar_denuncia_comentada, 
				[id_denuncia, id_usuario, denuncia.id_usuario, datos]);
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
		console.log(error);
		if(error.mismo_usuario)
			callback(null);
		else
			callback({type : 'error', msg : error.toString()});
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
		return db.one(consultas.usuario_por_id, id_usuario);
		// Ejecutamos la conulta para buscar usuarios cerca  informarles de que
		// hemos añadido una denuncia cerca de su ubicación
	})
	.then(function(usuario_from){
		usu_from = usuario_from;
		return db.one(consultas.denuncia_por_id, denuncia_io.gid);
	})
	.then(function(denuncia){
		// Asignamos
		denuncia.geometria = denuncia.geometria_pt || denuncia.geometria_li || denuncia.geometria_po;
		denuncia_io = denuncia;
		denuncia_io.wkt = wkt;
		denuncia_io.usuario = [usu_from];
		// Emitimos a todos los usuarios y a mi que hemos añadido una denuncia
		for(var socketId in global.clients[id_usuario]){
			// A todos menos a mi 
			global.clients[id_usuario][socketId].broadcast.emit('new_denuncia', {denuncia: denuncia_io});
			// Me la emito a todos mis sockets abiertos
			for (var sid in global.clients[id_usuario])
				global.clients[id_usuario][sid].emit('new_denuncia', {denuncia: denuncia_io});
			break;
		}
		return 	db.any(consultas.usuarios_cerca_de_denuncia, [wkt, id_usuario]);
	})
	.then(function(usuarios_cerca_){
		usuarios_cerca = usuarios_cerca_;
		//console.log(usuarios_cerca_);
		if(usuarios_cerca.length == 0) {
			console.log('NO HAY USUARIOS AFECTADOS');
			var error = new Error('no_usuarios_afectados');
			error.no_usuarios_afectados = true;
			throw error;
		}
		// Si hay usuarios cerca...
		else {
			console.log('HAY ' + usuarios_cerca.length + ' USUARIOS AFECTADOS');
			// ejecutamos tarea
			return db.tx(function (t){
				var q = []; // Consultas
				// Recorremos los usuarios cerca
				console.log(usuarios_cerca);
				usuarios_cerca.forEach(function(user){
					// Guardamos la distancia buffer del usuario en una variable
					var datos = JSON.stringify({
						distancia : user.distancia,
						location : user.location
					});
					// Añadimos la consulta para añadir notificación en la base de datos
					q.push(db.one(consultas.notificar_denuncia_cerca, 
						[denuncia_io.gid, id_usuario, user._id, datos]));
				});
				// Ejecutamos la conulta
				return t.batch(q);
			});
		} // If - Else No hay usuarios cerca
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
			denuncia: denuncia_io,
			num_usuarios_afectados : usuarios_cerca.length
		});
	})
	.catch(function(error){
		console.log('error denuncia', !error.no_usuarios_afectados);
		if(!error.no_usuarios_afectados)
			callback({type : 'error', msg : error.toString()});
		else
			// Enviamos un mensaje de que la denuncia se ha guardado correctamente
			callback(null, {
				denuncia: denuncia_io,
				num_usuarios_afectados : 0
			});
	});
}; // Fin saveDenuncia

Denuncia.prototype.find_by_pagina = function(page, callback){

	db.query(consultas.obtener_denuncias_recientes_por_pagina, page)
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
			page: page
		});
	})
	.catch(function(error){
		callback({type : 'error', msg : error.toString()});
	});
};

Denuncia.prototype.eliminar_imagen = function(path, callback){
	exec('rm -r ' + './public' + path, function(error){
		if (error) 
			callback({type : 'error', msg : error.toString()});
		else
			db.query(consultas.eliminar_imagen_denuncia, path)
			.then(function(result){
				//console.log(result);
				callback(null);
			})
			.catch(function(error){
				callback({type : 'error', msg : error.toString()});
			});
	});
};

Denuncia.prototype.eliminar = function(id_denuncia, callback){
	// Eliminamos la carpeta de imágenes de la denuncia
	exec('rm -r ' + config.UPLOADDIR + "/" + id_denuncia, function ( error, stdout, stderr ){
		// Eliminamos las imágenes de la carpeta FINAL
		if (error)
			callback({type : 'error', msg : error.toString()});
		else {
			console.log('imagenes eliminadas ');
			db.none(consultas.eliminar_denuncia, [id_denuncia])
			.then(function(){
				// La denuncia se eliminó correctamente
				callback(null);
			})
			.catch(function(error){
				callback({type : 'error', msg : error.toString()});
			});
		}
	}); 
};

Denuncia.prototype.editar = function(opciones, callback){
	// id de la denuncia
	var id_denuncia = opciones.id_denuncia;
	console.log(id_denuncia);
	
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
	denuncia_io.id_usuario = id_usuario;
	denuncia_io.gid = id_denuncia;

	// tipo de geometría introducida
	var tipo;
	if(wkt)
		tipo = wkt.match(/LINESTRING/g) ? 'LineString' : (wkt.match(/POLYGON/g) ? 'Polygon': 'Point');
	//var denuncia;
	db.task(function * (t){
		// t = this = contexto bdd
		var q = []; // Consultas

		if(titulo != denuncia_original.titulo)
			q.push(this_.set_titulo(titulo, id_denuncia));
		if(contenido != denuncia_original.descripcion)
			q.push(this_.set_contenido(contenido, id_denuncia));
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
		console.log('denuncia original tags', denuncia_original.tags);
		var tags_originales = [];
		denuncia_original.tags_.forEach(function(tag){
			tag = tag.tag;
			tags_originales.push(tag);
			var index = tags_.indexOf(tag);
			if (index == - 1){
				// Antes estaba este tag pero ahora no, hay que eliminarlo
				q.push(this_.eliminar_tag(tag, id_denuncia));
			}
		});
		tags_.forEach(function(tag){
			var index = tags_originales.indexOf(tag);
			if(index == -1){
				// Antes no estaba y ahora sí, hay que añadirlo
				q.push(t.none(consultas.añadir_tag_denuncia, [id_denuncia, tag]));
			}
		});
		//console.log('borrar ', borrar);
		// tipo de geometría que tenía anteriormente
		var tipo_ant = denuncia_original.geometria.type;
		//var fecha = denuncia.fecha;
		console.log(tipo);
		// Ha cambiado la geometría de la denuncia
		if (tipo != tipo_ant && wkt){
			// Eliminamos la geometría de la tabla en la que esté
			let borrar_geom = yield t.none(consultas.eliminar_geometria_por_id(tipo_ant), id_denuncia);
			// Insertamos la geometría en la tabla que corresponda
			q.push(t.none(consultas.añadir_geometria(wkt), [id_denuncia, wkt]));
			// Actualizamos el contenido de la denuncia
			//q.push(t.none(consultas.actualizar_denuncia, [titulo, contenido, id_denuncia]));
		}
		else if(wkt){
			// Si no ha cambiado el tipo de primitiva comprobamos que las geometrías son iguales
			let check_geom_igual = yield this_.is_equal(wkt, denuncia_original.geometria);
			if(!check_geom_igual.equals){
				console.log('denuncia misma geom false')
				q.push(t.none(consultas.actualizar_geometria(tipo), [wkt, id_denuncia]));
			}
			// Actualizamos info denuncia
			//q.push(t.none(consultas.actualizar_denuncia, [titulo, contenido, id_denuncia]));
		}
		//console.log('imagenes' + imagenes);
		// Recorremos las imágenes
		imagenes.forEach(function(path){
			//console.log('imagenes--' + path);
			// Añadimos consulta a la tarea para añadir imagen
			q.push(t.none(consultas.añadir_imagen_denuncia, [path, id_denuncia]));
		});
		// Ejecutamos las consultas
		return t.batch(q);	
	})
	.then (function(){
		// Enviamos respuesta satisfactoria
		callback(null, {
			type: 'success', 
			msg: 'Denuncia actualizada correctamente',
			denuncia : denuncia_io
		});
	})
	.catch(function(error){
		console.log('Error actualizando denuncia ' + JSON.stringify(error));
		callback({type : 'error', msg : error.toString()});
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
			denuncia.geometria_pt = undefined;
			denuncia.geometria_li = undefined;
			denuncia.geometria_po = undefined;
			denuncia.geom_pt = undefined;
			denuncia.geom_li = undefined;
			denuncia.geom_po = undefined;
		});
		// Renderizamos la página con las denuncias
		callback(null, {denuncias: denuncias});
	})
	.catch(function(error){
		callback({type : 'error', msg : error.toString()});
	});	
};

Denuncia.prototype.denuncias_cerca = function(posicion, callback){
	// Formateamos la consulta --> Usamos un buffer de 100 metros para saber si tengo denuncias cerca
	var query = consultas.denuncias_sin_where.query + 
		" (st_distance(st_transform(st_geomfromtext($1,4258),25830) , st_transform(x.geom_pt,25830)) < 100 or " +
		"st_distance(st_transform(st_geomfromtext($1,4258),25830) , st_transform(x.geom_li,25830)) < 100 or " +
		"st_distance(st_transform(st_geomfromtext($1,4258),25830) , st_transform(x.geom_po,25830)) < 100)" +
		"order by fecha desc";
	// Ejecutamos la consulta
	db.any(query, posicion)
	.then(function(denuncias){
		if(denuncias){
			// Obtenemos las denuncias cercanas
			denuncias.forEach(function(denuncia){
				// Asignamos geometría a la denuncia
				denuncia.geometria = denuncia.geometria_pt || denuncia.geometria_li || denuncia.geometria_po;
				denuncia.geometria_pt = undefined;
				denuncia.geometria_li = undefined;
				denuncia.geometria_po = undefined;
				denuncia.geom_pt = undefined;
				denuncia.geom_li = undefined;
				denuncia.geom_po = undefined;
			});
			// Emitimos el evento con las denuncias cerca
			callback(null, denuncias);
		}
		else
			callback(null, []);
	})
	.catch(function(error){
		callback({type : 'error', msg : error.toString()})
	});
};

module.exports = Denuncia;

/*
 * Función de filtro para consultar denuncias por sus atributos
 */

function filtro_denuncias(filter){
    var cnd = []; // Condiciones

    // Buffer
    if(filter.lat && filter.lon && filter.buffer_radio){
    	cnd.push(pgp.as.format("(st_distance(st_transform(x.geom_pt, 25830), st_transform(st_geomfromtext('POINT(" + 
    		filter.lon.replace(',', '.') + ' ' + 
    		filter.lat.replace(',', '.') + ")', 4258), 25830)) < " + 
    		filter.buffer_radio + " or " + 
    		"st_distance(st_transform(x.geom_li, 25830), st_transform(st_geomfromtext('POINT(" + 
    		filter.lon.replace(',', '.') + ' ' + 
    		filter.lat.replace(',', '.') + ")', 4258), 25830)) < " + 
    		filter.buffer_radio + " or " +
    		"st_distance(st_transform(x.geom_po, 25830), st_transform(st_geomfromtext('POINT(" + 
    		filter.lon.replace(',', '.') + ' ' + 
    		filter.lat.replace(',', '.') + ")', 4258), 25830)) < " + 
    		filter.buffer_radio + ")")
    	);
    }
    // BBOX
    if(filter.bbox){
    	cnd.push('(x.geom_pt && st_makeEnvelope(' + filter.bbox + ') or ' + 
    		'x.geom_li && st_makeEnvelope(' + filter.bbox + ') or ' + 
    		'x.geom_po && st_makeEnvelope(' + filter.bbox + '))');
    }    

    // ID denuncia -- Si se pasa la id de la denuncia los parámetros más abajo no se tienen en cuente para la búsqueda
    if(filter.id){
    	cnd.push(pgp.as.format("gid = '" + filter.id + "'"));
    	return cnd.join(' and ');
    }
    // Nombre like
    if (filter.titulo){
    	cnd.push(pgp.as.format("titulo ilike '%$1^%'", filter.titulo.replace(' ', '_').toLowerCase()));
    }
    // Tags like
    if(filter.tags){
    	var q = '';
    	filter.tags.forEach(function(tag, index){
    		tag = tag.toLowerCase();
    		if(index == 0) q += "tag ilike '%" + tag + "%' ";
    		else q += "or tag ilike '%" + tag + "%' "
    	});
    	cnd.push(pgp.as.format("gid in (select id_denuncia from tags where " + q + ")"));
    }
    // Nombre Usuario
    if(filter.usuario_nombre){
    	cnd.push("id_usuario = (select _id from usuarios where profile ->> 'username' ilike '%" + filter.usuario_nombre.toLowerCase() + "%')");
    }
    // Fecha desde
    if(filter.fecha_desde){
    	cnd.push("fecha > date '" + filter.fecha_desde[2] + "-" + filter.fecha_desde[1] + "-" + filter.fecha_desde[0] + "'");
    }
    // Fecha hasta
    if(filter.fecha_hasta){
    	cnd.push("fecha < date '" + filter.fecha_hasta[2] + "-" + filter.fecha_hasta[1] + "-" + filter.fecha_hasta[0] + "'");
    }
    //console.log(cnd.join(' and '));
    return cnd.join(" and ");
};