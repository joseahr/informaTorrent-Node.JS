/**
 * SOCKET.IO
 */
var validator = require('validator');
var consultas = require('./queries.js');
var database = require('../../config/database.js');
var pgp = database.pgp;
var db = database.db;

global.clients = {}; // Un cliente puede tener varios sockets abiertos

module.exports = function(io){
	
	io.of('/app/visor').on('connection', function(socket){
		/*
		==============================================================================================
			CONEXIÓN/DESCONEXIÓN DE SOCKETS
		==============================================================================================
		*/
		socket.on('get_id_usuario', function(data){
			// Evento que lanza el cliente una vez se conecta
			// Almacenamos el cliente y sus sockets abiertos 
			// en un objeto
			// Nos servirá para saber si un usuario de nuestra app está conectado
			// y emitir los eventos a sus sockets
			//console.log(data.locale);
			if (data){
				// Si el usuario no está logeado salimos.
				if (!data.id_usuario) return;
				// Si está logeado almacenamos la id del usuario y el idioma que está usando
				this.id_usuario = data.id_usuario;
				this.locale = data.locale || 'es';

				// Si ya estaba conectado--> ej. otro socket abierto
				if (clients[this.id_usuario]){
					// Incluimos ese socket dentro de los sockets del usuario
					clients[this.id_usuario][this.id] = this;
					console.log('ya había una conexión del usuario ' + this.id_usuario + ' ; socket_id: ' + this.id);
				}
				else {
					// Si es la primera conexión
					// Creamos un objeto con clave --> la id del usuario
					// y valor --> un objeto que contendrá los sockets abiertos del usuario
					clients[this.id_usuario] = {};
					clients[this.id_usuario][this.id] = this;

					console.log('primera conexión ' + this.id_usuario + ' ; socket_id: ' + this.id);
					// Emitimos el evento con el fin de actualizar el número de usuarios conectados
					this.emit('num_usuarios_conectados', {num_usuarios: Object.keys(clients).length});
					this.broadcast.emit('num_usuarios_conectados', {num_usuarios: Object.keys(clients).length});
				}
			}
		});
		
		// Cuando un socket se deconecta
		socket.on('disconnect', function(){
			if (clients[this.id_usuario]){
				console.log('delete socket id ' + this.id + ' del cliente ' + this.id_usuario);
				// Eliminamos ese socket de la lista de sockets del usuario
				delete clients[this.id_usuario][this.id];
				// comprobamos que queden sockets abiertos
				if(Object.keys(clients[this.id_usuario]).length == 0){
					// Si no quedan sockts abiertos...
					console.log('delete cliente de la lista --> No más sockets abiertos');
					// Eliminamos el cliente del objeto que almacena los clientes
					delete clients[this.id_usuario];
					// Emitimos el evento con el fin de actualizar el número de usuarios conectados
					this.broadcast.emit('num_usuarios_conectados', {num_usuarios: Object.keys(clients).length});
				}
			}
		});

		/*
		==============================================================================================
			DATOS APP
		==============================================================================================
		*/
		// El cliente lanza el evento para saber al cargar la página el número de clientes conectados
		socket.on('get_num_usuarios', function(){
			// Lo emite un cliente loggeado o no para obtener el número de usuarios conectados
			// Emitimos el evento
			socket.emit('num_usuarios_conectados', {num_usuarios: Object.keys(clients).length});
		});

		/*
		==============================================================================================
			ACCIONES USUARIO
		==============================================================================================
		*/
		// Un cliente ha visto una notificación
		socket.on('noti_vista', function(data){
			// data --> id de la notificación
			
			// Actualizamos en la bdd 
			// ponemos la notificación vista a true
			db.none(consultas.notificacion_vista, data)
				.then(function(){
					// Emitimos el evento a todos los sockets abiertos del usuario
					for(var socketId in clients[socket.id_usuario]){
						console.log(socketId);
						console.log('El usuario ' + socket.id_usuario + ' ha visto una notificación');
						// Emitimos el evento a modo de callback para actualizar en el cliente la notificación a vista
						clients[socket.id_usuario][socketId].emit('noti_vista_cb', data);
					}
				})
				.catch(function(error){
					console.log('error noti_vista ' + error.toString());
				});
			
		}); // Fin noti vista

		/*
		==============================================================================================
			ACCIONES SOBRE DENUNCIAS
		==============================================================================================
		*/
		// El cliente quiere saber las denuncias que existen de acuerdo a ciertos criterios de búsqueda
		socket.on('query', function(data){
			// Consultas que se hagan de la api de denuncias
			//console.log('querry llegaa ');
			
			// filtro de la consulta
			var filtro = {};
			
			filtro.titulo = data.titulo == '' ? undefined : data.titulo;
			filtro.tags = data.tags == '' ? undefined : data.tags.split(',');

			var lon_centro = data.lon == '' ? undefined : data.lon;
			var lat_centro = data.lat == '' ? undefined : data.lat;
			var buffer_centro_ = (lon_centro && lat_centro) ? [lon_centro, lat_centro] : undefined;
			var buffer_radio_ = data.buffer_radio || undefined;

			filtro.usuario_nombre = data.username == '' ? undefined : data.username;

			filtro.fecha_desde = data.fecha_desde == '' ? undefined : data.fecha_desde.split('/');
			filtro.fecha_hasta = data.fecha_hasta == '' ? undefined : data.fecha_hasta.split('/');

			filtro.bbox = (buffer_centro_ || buffer_radio_) ? undefined : 
				(data.bbox ? data.bbox : undefined);
			

			//console.log(buffer_centro_ + ' buffer centroooo ');
			// Validamos los parámetros que envía el usuario
			if(buffer_centro_ && buffer_radio_){
				if(!validator.isDecimal(lon_centro.replace(',', '.')) && !validator.isNumeric(lon_centro))
					return socket.emit('error_query', {msg: 'La longitud del centro del buffer debe ser numérica'});

				if(!validator.isDecimal(lat_centro.replace(',', '.')) && !validator.isNumeric(lat_centro))
					return socket.emit('error_query', {msg: 'La latitud del centro del buffer debe ser numérica'});
				
				if(!validator.isDecimal(buffer_radio_) && !validator.isNumeric(buffer_radio_))
					return socket.emit('error_query', {msg: 'El radio del centro del buffer debe ser numérico'});
				
				filtro.buffer_centro = buffer_centro_;
				filtro.buffer_radio = buffer_radio_;
				

			}
			else if(buffer_centro_ && !buffer_radio_) return socket.emit('error_query', {msg: 'Debes introducir el centro del buffer y el radio. Ambos parámetros.'});
			else if(!buffer_centro_ && buffer_radio_) return socket.emit('error_query', {msg: 'Debes introducir el centro del buffer y el radio. Ambos parámetros.'});
			
			// formateamos la consulta
			var query = consultas.denuncias_sin_where.query + filtro_denuncias(filtro);
			
			var aux = false;
			
			// Comprobamos que haya metido algún parámetro de búsqueda
			for(var key in filtro) {
					if (filtro[key] != undefined) {
							aux = true;
							console.log('keeeeey' + key);
					}
								
			}
			//console.log(aux);
			// Si no ha añadido ningún parámetro de búsqueda emitimos un evento de error
			if(!aux) return socket.emit('error_query', {msg: 'Debe introducir algún parámetro de búsqueda'});

			//console.log(query);
			// realizamos la consulta
			db.query(query)
				.then(function(denuncias){
					// obtenemos las denuncias respecto a los criterios de búsqueda
					denuncias.forEach(function(denuncia){
						// Asignamos geometría
						denuncia.geometria = denuncia.geometria_pt || denuncia.geometria_li || denuncia.geometria_po;
					});
					//console.log('denuncias api');
					// Emitimos el evento con los resultado de la búsqueda
					socket.emit('api', {query: denuncias});					
				})
				.catch(function(error){
					console.log(error.toString());
					socket.emit('error_query', {msg: 'Hubo un error consultando: ' + error.toString()});
				});
		
		});
		
		// Un usuario ha visto mi denuncia
		/*socket.on('alguien_vio_una_denuncia', function(data){
			// Buscamos la denuncia
			var soc = this;
			db.one(consultas.denuncia_por_id, data.id_denuncia)
				.then(function(denuncia){
					// Si es el propio usuario quien ve su denuncia salimos.
					if (denuncia.id_usuario == soc.id_usuario)
						throw new Error('Denuncia Vista mismo usuario no incrementa');
					return db.none(consultas.denuncia_vista, data.id_denuncia)
				})
				.then(function(){
					console.log('incrementado veces_vista');
				})
				.catch(function(error){
					console.log(error.toString());
				});
		});*/
		
		// Alguien ha emitido un evento para saber qué denuncias tiene cerca
		// Emite su posición
		socket.on('tengo_denuncias_cerca_?', function(data){
			//console.log('tengo denuncuas cerca?', data);

			// si no data salimos
			if (!data) return;

			// Formateamos la consulta --> Usamos un buffer de 100 metros para saber si tengo denuncias cerca
			var query = consultas.denuncias_sin_where.query + 
				" (st_distance(st_transform(st_geomfromtext($1,4258),25830) , st_transform(x.geom_pt,25830)) < 100 or " +
				"st_distance(st_transform(st_geomfromtext($1,4258),25830) , st_transform(x.geom_li,25830)) < 100 or " +
				"st_distance(st_transform(st_geomfromtext($1,4258),25830) , st_transform(x.geom_po,25830)) < 100)" +
				"order by fecha desc";
			// Ejecutamos la consulta
			db.any(query, data)
				.then(function(denuncias){
					if(denuncias){
						// Obtenemos las denuncias cercanas
						denuncias.forEach(function(denuncia){
							// Asignamos geometría a la denuncia
							denuncia.geometria = denuncia.geometria_pt || denuncia.geometria_li || denuncia.geometria_po;
						});
						// Emitimos el evento con las denuncias cerca
						socket.emit('si_que_tengo_denuncias_cerca', denuncias);
					}
				});

		});
		
		// Alguien se ha metido en la página de una denuncia, al iniciar emite este evento para saber si le gusta la denuncia
		socket.on('te_pregunto_que_si_me_gusta_esta_puta_mierda_de_denuncia?', function(data){

			console.log(data);

			// Si el usuario no está conectado salimos
			if(data.usuario_id == '') 
				return socket.emit('yo_socket_io_consultando_a_postgresql_te_contesto_si_te_gusta_o_no_esa_puta_mierda_de_denuncia_vale?', 
					{error: true});

			var id_usuario = this.id_usuario;
			// ejecutamos la consulta
			db.oneOrNone(consultas.check_like_denuncia, [id_usuario, data.denuncia.gid])
				.then(function(like){
					// Emitimos el evento con la respuesta de si le gusta la denuncia
					socket.emit('yo_socket_io_consultando_a_postgresql_te_contesto_si_te_gusta_o_no_esa_puta_mierda_de_denuncia_vale?',
						{error: false, like: (like != null) });
				})
				.catch(function(error){
					console.log(error.toString());
				});
			
		});
		
		// Alguien le ha dado al botón de me gusta --> Puede ser por dos motivos
		// 1- Le gusta 2 - Le ha dejado de gustar
		socket.on('le_he_dao_al_boton_de_me_gusta_haz_lo_que_tengas_que_hacer', function(data){

			//console.log(data);

			// Si el usuario no está conectado emitimos mensaje de error
			if(data.usuario_id == '') 
				return socket.emit('yo_socket_io_consultando_a_postgresql_te_contesto_si_te_gusta_o_no_esa_puta_mierda_de_denuncia_vale?', 
					{error: true});

			var me_gusta, notificacion_,
				id_usuario = this.id_usuario,
				denuncia;

			// ejecutamos la consulta
			db.one(consultas.denuncia_por_id, data.denuncia.gid)
			.then(function(denuncia_){
				denuncia = denuncia_;
				// Obtenemos denuncia y asignamos geometria
				denuncia.geometria = denuncia.geometria_pt || denuncia.geometria_li || denuncia.geometria_po;

				// ejecutamos la consulta para saber si nos gusta la denuncia 
				return db.oneOrNone(consultas.check_like_denuncia, [id_usuario, data.denuncia.gid]);
			})
			.then(function(like){
				//console.log(like);

				me_gusta = (like == null); // Si me gusta me va a dejar de gustar, si no me gustaba me va a gustar
				// Emitimos el evento para que el cliente actualice su like
				socket.emit('yo_socket_io_consultando_a_postgresql_te_contesto_si_te_gusta_o_no_esa_puta_mierda_de_denuncia_vale?',
					{error: false, like: me_gusta });

				// Le va a gustar --> Añadiremos el like dentro de la tabla de likes
				if(like == null){
					// No le gusta aún, entonces le ha dado a me gusta
					return db.tx(function(t){
						q = [];
						// Insertamos el like
						q.push(t.none(consultas.insertar_like, [data.usuario_id, data.denuncia.gid]));
						//console.log('from',data.usuario_id, 'to', data.denuncia.id_usuario);

						// Si el usuario es el propietario de la denuncia no enviamos notificacion
						if(data.usuario_id != data.denuncia.id_usuario) {
							// Insertamos la notificación para que el propietario de la denuncia 
							// sepa que le hemos dado al like
							q.push(t.one(consultas.insertar_notificacion, 
								[data.denuncia.gid, data.usuario_id, data.denuncia.id_usuario,'LIKE_DENUNCIA', JSON.stringify({})]));
						}
						// ejecutamos las consultas
						return t.batch(q);
					});
				}
				else {
					// Ya le gusta, por lo tanto le deja de gustar
					return db.tx(function(t){
						q = [];
						// Eliminamos el like de la tabla de likes
						q.push(t.none(consultas.eliminar_like, [data.usuario_id, data.denuncia.gid]));
						// Si el usuario es el mismo que el propietario de la denuncia no insertamos notificación
						if(data.usuario_id != data.denuncia.id_usuario){
							// Insertamos notificación para que el propietario de la denuncia sepa que nos ha dejado de gustar
							q.push(t.one(consultas.insertar_notificacion, 
								[data.denuncia.gid, data.usuario_id, data.denuncia.id_usuario,'NO_LIKE_DENUNCIA', JSON.stringify({})]));
						}
						// ejecutamos las consultas
						return t.batch(q);
					});
				}
			})
			.then(function(notificacion){
				//console.log('noti length', notificacion);
				if(notificacion[1] == null){
					// No hay notificación --> El usuario es el propietario de la denuncia
					throw new Error('No notificación. Mismo usuario que el propietario de la denuncia. No emito noti.');
				}
				else {
					// Si hay noti es decir el usuario que da al like y el usuario prop de la 
					// denuncia son distintos
					notificacion_ = notificacion;
					// consultamos los datos del usuario
					return db.one(consultas.usuario_por_id, data.usuario_id);
				}
			})
			.then(function(usuario){
				// Si es una notificación de me gusta y el cliente está conectado
				if(me_gusta && clients[data.denuncia.id_usuario])
					// Emitimos el evento a todos sus sockets abiertos
					for(var socketId in clients[data.denuncia.id_usuario]){
						// Emitimos el evento
						clients[data.denuncia.id_usuario][socketId].emit('denuncia_likeada', 
							{denuncia: denuncia, from: usuario, noti: notificacion_});
					}
				// Si es una notificación de ya no me gusta y el usuario está conectado 
				else if(!me_gusta && clients[data.denuncia.id_usuario])
					// Emitimos el evento a todos sus sockets abiertos
					for(var socketId in clients[data.denuncia.id_usuario]){
						// Emitimos el evento
						clients[data.denuncia.id_usuario][socketId].emit('denuncia_no_likeada', 
							{denuncia: denuncia, from: usuario, noti: notificacion_});
					}
					
			})
			.catch(function(error){
				console.log(error.toString());
			});

		}); // Le he dao al boton del like
		
		
	}); // io.of('/app/visor')
};
/*
 * Función de filtro para consultar denuncias por sus atributos
 */

function filtro_denuncias(filter){
    var cnd = []; // Condiciones
    
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
    // Buffer
    if(filter.buffer_centro && filter.buffer_radio){
    	cnd.push(pgp.as.format("(st_distance(st_transform(x.geom_pt, 25830), st_transform(st_geomfromtext('POINT(" + 
    		filter.buffer_centro[0].replace(',', '.') + ' ' + 
    		filter.buffer_centro[1].replace(',', '.') + ")', 4258), 25830)) < " + 
    		filter.buffer_radio + " or " + 
    		"st_distance(st_transform(x.geom_li, 25830), st_transform(st_geomfromtext('POINT(" + 
    		filter.buffer_centro[0].replace(',', '.') + ' ' + 
    		filter.buffer_centro[1].replace(',', '.') + ")', 4258), 25830)) < " + 
    		filter.buffer_radio + " or " +
    		"st_distance(st_transform(x.geom_po, 25830), st_transform(st_geomfromtext('POINT(" + 
    		filter.buffer_centro[0].replace(',', '.') + ' ' + 
    		filter.buffer_centro[1].replace(',', '.') + ")', 4258), 25830)) < " + 
    		filter.buffer_radio + ")")
    	);
    }
    // BBOX
    if(filter.bbox){
    	cnd.push('(x.geom_pt && st_makeEnvelope(' + filter.bbox + ') or ' + 
    		'x.geom_li && st_makeEnvelope(' + filter.bbox + ') or ' + 
    		'x.geom_po && st_makeEnvelope(' + filter.bbox + '))');
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