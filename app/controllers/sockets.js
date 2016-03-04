/**
 * SOCKET.IO
 */

global.clients = {}; // Un cliente puede tener varios sockets abiertos

module.exports = function(io, path, mkdirp, exec, config, validator, db, consultas, pgp){
	
	io.of('/app/visor').on('connection', function(socket){
		
		socket.on('get_num_usuarios', function(){
			// Lo emite un cliente loggeado o no para obtener el número de usuarios conectados
			// Emitimos el evento
			socket.emit('num_usuarios_conectados', {num_usuarios: Object.keys(clients).length});
		});
		
		socket.on('noti_vista', function(data){
			// data --> id de la notificación
			
			db.none(consultas.notificacion_vista, data)
				.then(function(){
					for(var socketId in clients[socket.id_usuario]){
						console.log(socketId);
						console.log('El usuario ' + socket.id_usuario + ' ha visto una notificación');
						clients[socket.id_usuario][socketId].emit('noti_vista_cb', data);
					}
				})
				.catch(function(error){
					console.log('error noti_vista ' + error.toString());
				});
			
		}); // Fin noti vista
		
		socket.on('get_id_usuario', function(data){
			// Evento que lanza el cliente una vez se conecta
			// Almacenamos el cliente y sus sockets abiertos 
			// en un objeto
			// Nos servirá para saber si un cliente está conectado
			// y emitir los eventos a sus sockets
			if (data){
				if (!data.id_usuario) return;
				this.id_usuario = data.id_usuario;
				if (clients[this.id_usuario]){
					clients[this.id_usuario][this.id] = this;
					console.log('ya había una conexión del usuario ' + this.id_usuario + ' ; socket_id: ' + this.id);
				}
				else {
					clients[this.id_usuario] = {};
					clients[this.id_usuario][this.id] = this;
					console.log('primera conexión ' + this.id_usuario + ' ; socket_id: ' + this.id);
					this.broadcast.emit('num_usuarios_conectados', {num_usuarios: Object.keys(clients).length});
				}
			}
		});
		
		socket.on('disconnect', function(){
			if (clients[this.id_usuario]){
				console.log('delete socket id ' + this.id + ' del cliente ' + this.id_usuario);
				delete clients[this.id_usuario][this.id];
				if(Object.keys(clients[this.id_usuario]).length == 0){
					console.log('delete cliente de la lista --> No más sockets abiertos');
					delete clients[this.id_usuario];
					this.broadcast.emit('num_usuarios_conectados', {num_usuarios: Object.keys(clients).length});
				}
			}
		});

		socket.on('query', function(data){
			// Consultas que se hagan de la api de denuncias
			console.log('querry llegaa ');
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
			

			console.log(buffer_centro_ + ' buffer centroooo ');
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
			
			var query = consultas.denuncias_sin_where.query + filtro_denuncias(filtro);
			
			var aux = false;
			
			for(var key in filtro) {
					if (filtro[key] != undefined) {
							aux = true;
							console.log('keeeeey' + key);
					}
								
			}
			console.log(aux);
			if(!aux) return socket.emit('error_query', {msg: 'Debe introducir algún parámetro de búsqueda'});

			console.log(query);
			db.query(query)
				.then(function(denuncias){
					console.log('denuncias api ' + denuncias);
					socket.emit('api', {query: denuncias});					
				})
				.catch(function(error){
					console.log(error.toString());
					socket.emit('error_query', {msg: 'Hubo un error consultando: ' + error.toString()});
				});
		
		});
		
		socket.on('alguien_vio_una_denuncia', function(data){
			db.one(consultas.denuncia_por_id, data.id_denuncia)
				.then(function(denuncia){
					var tipo = denuncia.geometria.type;
					return db.none(consultas.denuncia_vista(tipo), data.id_denuncia)
				})
				.then(function(){
					console.log('incrementado veces_vista');
				})
				.catch(function(error){
					console.log(error.toString());
				});
		});
		
		socket.on('tengo_denuncias_cerca_?', function(data){
			console.log(data);

			if (!data) return;

			var query = consultas.denuncias_sin_where.query + 
				" st_distance(st_transform(st_geomfromtext($1,4258),25830) , st_transform(the_geom,25830)) < 20 " +
				"order by fecha desc";
			db.any(query, data)
				.then(function(denuncias){
					socket.emit('si_que_tengo_denuncias_cerca', denuncias);
				});

		});
		
		socket.on('te_pregunto_que_si_me_gusta_esta_puta_mierda_de_denuncia?', function(data){
			console.log(data);
			if(data.usuario_id == '') 
				return socket.emit('yo_socket_io_consultando_a_postgresql_te_contesto_si_te_gusta_o_no_esa_puta_mierda_de_denuncia_vale?', 
					{error: true});
			var id_usuario = this.id_usuario;
			db.oneOrNone(consultas.check_like_denuncia, [id_usuario, data.denuncia.gid])
				.then(function(like){
					socket.emit('yo_socket_io_consultando_a_postgresql_te_contesto_si_te_gusta_o_no_esa_puta_mierda_de_denuncia_vale?',
						{error: false, like: (like != null) });
				})
				.catch(function(error){
					console.log(error.toString());
				});
			
		});
		
		socket.on('le_he_dao_al_boton_de_me_gusta_haz_lo_que_tengas_que_hacer', function(data){
			console.log(data);
			if(data.usuario_id == '') 
				return socket.emit('yo_socket_io_consultando_a_postgresql_te_contesto_si_te_gusta_o_no_esa_puta_mierda_de_denuncia_vale?', 
					{error: true});
			var me_gusta, notificacion_;
			var id_usuario = this.id_usuario;
			console.log(id_usuario + 'id_USUUSUSUSU');
			
			var denuncia;
			
			db.one(consultas.denuncia_por_id, data.denuncia.gid)
				.then(function(denuncia_){
					denuncia = denuncia_;
					denuncia.tipo = denuncia.geometria.type;
					denuncia.coordenadas = denuncia.geometria.coordinates;
					denuncia.geometria = undefined;
					return db.oneOrNone(consultas.check_like_denuncia, [id_usuario, data.denuncia.gid]);
				})
				.then(function(like){
					console.log(like);
					me_gusta = (like == null);
					socket.emit('yo_socket_io_consultando_a_postgresql_te_contesto_si_te_gusta_o_no_esa_puta_mierda_de_denuncia_vale?',
						{error: false, like: me_gusta });
					if(like == null){
						// No le gusta aún, entonces le ha dado a me gusta
						return db.tx(function(t){
							q = [];
							q.push(t.none(consultas.insertar_like, [data.usuario_id, data.denuncia.gid]));
							console.log('from',data.usuario_id, 'to', data.denuncia.id_usuario);
							// Si el usuario es el propietario de la denuncia no enviamos notificacion
							if(data.usuario_id != data.denuncia.id_usuario) {
								q.push(t.one(consultas.insertar_notificacion, 
									[data.denuncia.gid, data.usuario_id, data.denuncia.id_usuario,'LIKE_DENUNCIA', JSON.stringify({})]));
							}
							return t.batch(q);
						});
					}
					else {
						// Ya le gusta, por lo tanto le deja de gustar
						return db.tx(function(t){
							q = [];
							q.push(t.none(consultas.eliminar_like, [data.usuario_id, data.denuncia.gid]));
							if(data.usuario_id != data.denuncia.id_usuario){
								q.push(t.one(consultas.insertar_notificacion, 
									[data.denuncia.gid, data.usuario_id, data.denuncia.id_usuario,'NO_LIKE_DENUNCIA', JSON.stringify({})]));
							}
							return t.batch(q);
						});
					}
				})
				.then(function(notificacion){
					console.log('noti length', notificacion);
					if(notificacion[1] == null){
						throw new Error('No notificación. Mismo usuario que el propietario de la denuncia. No emito noti.');
					}
					else {
						// Si hay noti es decir el usuario que da al like y el usuario prop de la 
						// denuncia son distintos
						notificacion_ = notificacion;
						return db.one(consultas.usuario_por_id, data.usuario_id);
					}
				})
				.then(function(usuario){
					if(me_gusta && clients[data.denuncia.id_usuario])
						for(var socketId in clients[data.denuncia.id_usuario]){
							clients[data.denuncia.id_usuario][socketId].emit('denuncia_likeada', 
								{denuncia: denuncia, from: usuario, noti: notificacion_});
						}
					else if(!me_gusta && clients[data.denuncia.id_usuario])
						for(var socketId in clients[data.denuncia.id_usuario]){
							clients[data.denuncia.id_usuario][socketId].emit('denuncia_no_likeada', 
								{denuncia: denuncia, from: usuario, noti: notificacion_});
						}
						
				})
				.catch(function(error){
					console.log(error.toString());
				});

		}); // Le he dao al boton del like
		
		
	}); // io.of('/app/visor')
	
	/*
	 * Función de filtro para consultar denuncias por sus atributos
	 */
	
	function filtro_denuncias(filter){
	    var cnd = []; // Condiciones
	    
	    // Nombre like
	    if (filter.titulo){
	    	cnd.push(pgp.as.format("titulo like '%$1^%'", filter.titulo.replace(' ', '_')));
	    }
	    // Tags like
	    if(filter.tags){
	    	var q = '';
	    	filter.tags.forEach(function(tag, index){
	    		if(index == 0) q += "tag like '%" + tag + "%' ";
	    		else q += "or tag like '%" + tag + "%' "
	    	});
	    	cnd.push(pgp.as.format("gid in (select id_denuncia from tags where " + q + ")"));
	    }
	    // Buffer
	    if(filter.buffer_centro && filter.buffer_radio){
	    	cnd.push(pgp.as.format("st_distance(st_transform(the_geom, 25830), st_transform(st_geomfromtext('POINT(" + 
	    		filter.buffer_centro[0].replace(',', '.') + ' ' + 
	    		filter.buffer_centro[1].replace(',', '.') + ")', 4258), 25830)) < " + 
	    		filter.buffer_radio));
	    }
	    // Nombre Usuario
	    if(filter.usuario_nombre){
	    	cnd.push("id_usuario = (select _id from usuarios where profile ->> 'username' like '%" + filter.usuario_nombre + "%')");
	    }
	    // Fecha desde
	    if(filter.fecha_desde){
	    	cnd.push("fecha > date '" + filter.fecha_desde[2] + "-" + filter.fecha_desde[1] + "-" + filter.fecha_desde[0] + "'");
	    }
	    // Fecha hasta
	    if(filter.fecha_hasta){
	    	cnd.push("fecha < date '" + filter.fecha_hasta[2] + "-" + filter.fecha_hasta[1] + "-" + filter.fecha_hasta[0] + "'");
	    }
	    console.log(cnd.join(' and '));
	    return cnd.join(" and ");
	}
	
	
}
