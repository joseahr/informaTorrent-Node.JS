/**
 * SOCKET.IO
 */

global.clients = {}; // Un cliente puede tener varios sockets abiertos

var client;

module.exports = function(io, pg, path, mkdirp, exec, config, validator){
	
	io.of('/app/visor').on('connection', function(socket){
		
		socket.on('get_num_usuarios', function(){
			// Lo emite un cliente loggeado o no para obtener el número de usuarios conectados
			// Emitimos el evento
			socket.emit('num_usuarios_conectados', {num_usuarios: Object.keys(clients).length});
		});
		
		socket.on('noti_vista', function(data){
			// data --> id de la notificación
			client = new pg.Client('postgres://jose:jose@localhost/denuncias');
			
			client.connect(function(error){
				if(error) return console.error('error conectando', error);
				
				client.query("update notificaciones set vista=true where id_noti='" + data + "'", function(e, r){
					client.end();
					if(e) return console.error('error consultando', e);
					
					for(var socketId in clients[socket.id_usuario]){
						console.log(socketId);
						console.log('El usuario ' + socket.id_usuario + ' ha visto una notificación');
						clients[socket.id_usuario][socketId].emit('noti_vista_cb', data);
					}
					
					
				});
				
			});
			
		});
		
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
		
		socket.on('new_denuncia_added', function(data){
			// Recibimos el evento que emite el cliente 
			// que añade una nueva denuncia
			console.log(data + ' new denuncia addedd');
			socket.broadcast.emit('new_denuncia', {denuncia: data});
			// Emitimos la información a todos los 'sockets' conectados
			// excepto al que emite el mensaje (Información de la denuncia-->>titulo, contenido, wkt...)
			
			// Buscar usuarios cuya localización preferida está cercana a la denuncia añadida
			// Guardar las notificaciones en postgres y Emitir el evento a los usuarios involucrados
			// en caso de que estén conectados
			var id_usuario_from = this.id_usuario;
			client = new pg.Client('postgres://jose:jose@localhost/denuncias');
						
			client.connect(function(error){
				if(error) console.error('Error conectando a la bdd', error);
				else {
					client.query("select _id, st_distance(st_transform(location_pref, 25830), st_transform(st_geomfromtext('" + data.wkt + "', 4258), 25830)) as distancia from usuarios where " +
					"st_distance(st_transform(location_pref, 25830), st_transform(st_geomfromtext('" + data.wkt + "', 4258), 25830)) < distancia_aviso "+
					"and _id <> '" + id_usuario_from + "'",
					function(e, result){
						//client.end(); // Habrá que quitarlo
						
						if(e) {
							client.end();
							console.error('Error consultando usuarios cerca ', e);
						}
					
						else if(result.rows.length > 0){
							
							console.log('resultroooows' + result.rows);
							// Hay usuarios afectados
							var values = '';
							result.rows.forEach(function(id_usuario, index){
								var distancia = id_usuario.distancia;
								console.log('id usuario afectado denuncia cerca ' + id_usuario._id);
								if(index != result.rows.length -1)
									values = "('"+ data.id +"','"+ id_usuario_from +"','" + id_usuario._id + "','DENUNCIA_CERCA'," + distancia + ")";
								else
									values = "('"+ data.id +"','"+ id_usuario_from +"','" + id_usuario._id + "','DENUNCIA_CERCA', " + distancia + ")";
								if(clients[id_usuario._id] && id_usuario._id != id_usuario_from){
									// Si el usuario está conectado y es distinto al usuario que emite la
									// denuncia emitimos esa notificación a el usuario
									
									client.query("select * from usuarios where _id='" + id_usuario_from +"'"
									, function(_e, _result){
										//client.end();
										if(_e) return console.error(_e);
										
										client.query("insert into notificaciones(id_denuncia, id_usuario_from, id_usuario_to, tipo, distancia) " +
												"values " + values + " returning *", function(e_, result_){
													
											client.end();
											
											if(e_) {
												return console.error('Error consultando',e_);
											}
											
											for(var socketId in clients[id_usuario._id]){
												console.log(socketId);
												console.log('El usuario ' + data.id_usuario + ' ha publicado una denuncia carca de la ubicación del usuario ' + id_usuario);
												clients[id_usuario._id][socketId].emit('denuncia_cerca', {denuncia: data, from: _result.rows[0], noti: result_.rows[0]});	
											}
													
										});
										
									});
									
								}
							});

						} // Si hay usuarios afectados
						
					});
				}
			});
			
		});
		
		socket.on('new_comentario_added', function(data){
			// Cuando se lance este evento obtenemos la id del 
			// usuario, guardamos la notificación en postgresql y 
			// emitimos al cliente si está conectado
			
			if (this.id_usuario == data.denuncia.id_usuario) return;
			
			var denuncia = data.denuncia;
			console.log('denuncia comentada ' + denuncia.gid);
			
			var id_usuario_from = this.id_usuario;
			client = new pg.Client('postgres://jose:jose@localhost/denuncias');
			
			client.connect(function(error){
				
				if(error) return console.error('Error conectando bdd ', error);
				
				values = "('"+ denuncia.gid +"','"+ id_usuario_from +"','"+ denuncia.id_usuario +"','COMENTARIO_DENUNCIA')";
				
				client.query("insert into notificaciones(id_denuncia, id_usuario_from, id_usuario_to, tipo) " +
				"values " + values + " returning *", function(e_, result_){
					
					if(e_) {
						client.end();
						return console.error('Error consultando',e_);
					}
					
					if(clients[denuncia.id_usuario]){
						client.query("select * from usuarios where _id='" + id_usuario_from +"'"
						, function(_e, _result){
							client.end();
							if(_e) return console.error(_e);
							for(var socketId in clients[denuncia.id_usuario]){
								clients[denuncia.id_usuario][socketId].emit('denuncia_comentada', {denuncia: denuncia, from: _result.rows[0], noti: result_.rows[0]});
							}
						});
					}
					
				});
				
			});
			
		});
		
		socket.on('query', function(data){
			// Consultas que se hagan de la api de denuncias
			console.log('querry llegaa ');
			var cuantas = 0;
			
			var titulo_ = data.titulo == '' ? undefined : data.titulo;
			var tags_ = data.tags == '' ? '' : data.tags.split(',');
			var lon_centro = data.lon == '' ? undefined : data.lon;
			var lat_centro = data.lat == '' ? undefined : data.lat;
			var buffer_centro_ = lon_centro && lat_centro ? lon_centro + ';;' + lat_centro : undefined;
			var buffer_radio_ = data.buffer_radio;
			var usuario_nombre_ = data.username == '' ? undefined : data.username;
			var fecha_desde = data.fecha_desde == '' ? undefined : data.fecha_desde.split('/');
			var fecha_hasta = data.fecha_hasta == '' ? undefined : data.fecha_hasta.split('/');		
			
			var query = "SELECT *, to_char(denuncias.fecha::timestamp,'TMDay, DD TMMonth YYYY HH24:MI:SS') as fecha, (select count(*) from likes where id_denuncia = denuncias.gid) as likes, " +
	  		"ST_AsGeoJSON(the_geom) as geom FROM denuncias " +
	  		"LEFT   JOIN LATERAL (" +
	  		"SELECT json_agg(com) AS comentarios " +
	  		"FROM  (SELECT c.id_usuario, c.contenido, to_char(c.fecha::timestamp,'TMDay, DD TMMonth YYYY a las HH24:MI:SS') as fecha, u.* FROM comentarios c, usuarios u WHERE c.id_usuario = u._id and c.id_denuncia = denuncias.gid ORDER BY fecha DESC) com" +
	  		") comentarios ON true " +
	  		"LEFT   JOIN LATERAL (" +
	  		"SELECT json_agg(img) AS imagenes " +
	  		"FROM  (SELECT *,to_char(fecha::timestamp,'TMDay, DD TMMonth YYYY') as fecha  FROM imagenes WHERE id_denuncia = denuncias.gid) img" +
	  		") imagenes ON true " +
	  		"LEFT   JOIN LATERAL (" +
	  		"SELECT json_agg(usuarios) AS usuario " +
	  		"FROM  (SELECT * FROM usuarios WHERE _id = denuncias.id_usuario) usuarios" +
	  		") usuarios ON true " +
	  		"LEFT   JOIN LATERAL (" +
	  		"SELECT json_agg(t_) AS tags_ " +
	  		"FROM  (SELECT tag FROM tags WHERE id_denuncia = denuncias.gid) t_ " +
	  		") t ON true " +
	  		"WHERE "
			
			//console.log(titulo_.replace(' ', '_'));
			
			if(titulo_) {
				cuantas ++;
				query += "titulo like '%" + titulo_.replace(' ', '_') +  "%' ";
			}
			
			if(tags_ && cuantas > 0) {
				var query2 = 'like ';
				tags_.forEach(function(tag, index, that){
					if (index == 0) query2 += "'%" + tag.replace(' ', '') + "%' ";
					else query2 += "or tag like '%" + tag.replace(' ', '') + "%' ";
					console.log(tag);
				});
				query += "and gid in (select id_denuncia from tags where tag " + query2 + ")";
				cuantas++;
			}
			else if(tags_) {
				var query2 = 'like ';
				tags_.forEach(function(tag, index, that){
					if (index == 0) query2 += "'%" + tag.replace(' ', '') + "%'";
					else query2 += "or tag like '%" + tag.replace(' ', '') + "%'";
					console.log(tag);
				});
				query += " gid in (select id_denuncia from tags where tag " + query2 + ")";
				cuantas++;
			}
			console.log(buffer_centro_ + ' buffer centroooo ');
			if(buffer_centro_ && buffer_radio_){
				if(!validator.isDecimal(lon_centro.replace(',', '.')) && !validator.isNumeric(lon_centro))
					return socket.emit('error_query', {msg: 'La longitud del centro del buffer debe ser numérica'});

				if(!validator.isDecimal(lat_centro.replace(',', '.')) && !validator.isNumeric(lat_centro))
					return socket.emit('error_query', {msg: 'La latitud del centro del buffer debe ser numérica'});
				
				if(!validator.isDecimal(buffer_radio_) && !validator.isNumeric(buffer_radio_))
					return socket.emit('error_query', {msg: 'El radio del centro del buffer debe ser numérico'});
				
				var lonlat = buffer_centro_;
				console.log(lonlat);
				if(cuantas > 0) {
					cuantas++;
					query += "and st_distance(st_transform(the_geom, 25830), st_transform(st_geomfromtext('POINT(" + lon_centro.replace(',', '.') +' ' + lat_centro.replace(',', '.') + ")', 4258), 25830)) < " + buffer_radio_ + " ";
				}
				else {
					cuantas++;
					query += "st_distance(st_transform(the_geom, 25830), st_transform(st_geomfromtext('POINT(" + lon_centro.replace(',', '.') +' ' + lat_centro.replace(',', '.') + ")', 4258), 25830)) < " + buffer_radio_ + " ";
				}
			}
			else if(buffer_centro_ && !buffer_radio_) return socket.emit('error_query', {msg: 'Debes introducir el centro del buffer y el radio. Ambos parámetros.'});
			else if(!buffer_centro_ && buffer_radio_) return socket.emit('error_query', {msg: 'Debes introducir el centro del buffer y el radio. Ambos parámetros.'});

			if(usuario_nombre_){
				if(cuantas > 0) {
					query += "and id_usuario = (select _id from usuarios where profile ->> 'username' like '%" + usuario_nombre_ + "%') ";
					cuantas ++;
				}
				else {
					cuantas++;
					query += "id_usuario = (select _id from usuarios where profile ->> 'username' like '%" + usuario_nombre_ + "%') ";
				}
			}
			
			if(fecha_desde){
				if(cuantas> 0) {
					query += "and fecha > date '" + fecha_desde[2] +"-" + fecha_desde[1] + "-" + + fecha_desde[0] + "'";
					cuantas++;
				}
				else {
					cuantas++;
					query += "fecha > date '" + fecha_desde[2] +"-" + fecha_desde[1] + "-" + + fecha_desde[0] + "'";
				}
			}

			if(fecha_hasta){
				if(cuantas> 0) {
					query += "and fecha < date '" + fecha_hasta[2] +"-" + fecha_hasta[1] + "-" + + fecha_hasta[0] + "'";
					cuantas++;
				}
				else {
					cuantas++;
					query += "fecha < date '" + fecha_hasta[2] +"-" + fecha_hasta[1] + "-" + + fecha_hasta[0] + "'";
				}
			}
			
			client = new pg.Client('postgres://jose:jose@localhost/denuncias');
			
			client.connect(function(error){
				if (error) return console.error('Error conectando ', error);
				console.log(query);
				client.query(query, function(e, r){
					client.end();
					if(e) return socket.emit('error_query', {msg: 'Hubo un error consultando: ' + e});
					console.log('rooows ' +  r.rows);
					socket.emit('api', {query: r.rows});
					
				});
			});
		
		});
		
		socket.on('alguien_vio_una_denuncia', function(data){
			client = new pg.Client('postgres://jose:jose@localhost/denuncias');
			
			client.connect(function(error){
				if(error) return console.log('Error conectando', error);
				
				client.query("update denuncias set veces_vista = veces_vista + 1 where gid='" + data.id_denuncia + "'", 
				function(e, r){
					client.end();
					if(e) return console.error('Error consultando', e);
					console.log('incrementado veces_vista');
				});
				
			});
			
		});
		
		
		socket.on('te_pregunto_que_si_me_gusta_esta_puta_mierda_de_denuncia?', function(data){
			console.log(data);
			if(data.usuario_id == '') 
				return socket.emit('yo_socket_io_consultando_a_postgresql_te_contesto_si_te_gusta_o_no_esa_puta_mierda_de_denuncia_vale?', 
					{error: true});

			
			client = new pg.Client('postgres://jose:jose@localhost/denuncias');
			
			client.connect(function(error){
				if(error) return console.error('Error conectando ', error);
				
				client.query("select * from likes where id_usuario = '" + data.usuario_id + "' and id_denuncia ='" + data.denuncia.gid + "'",
				function(e, r){
					client.end();
					if(e) return console.error('Error consultando ', e);
					
					socket.emit('yo_socket_io_consultando_a_postgresql_te_contesto_si_te_gusta_o_no_esa_puta_mierda_de_denuncia_vale?',
					{error: false, like: (r.rows.length != 0) });
					
				});
				
			});
			
		});
		
		socket.on('le_he_dao_al_boton_de_me_gusta_haz_lo_que_tengas_que_hacer', function(data){
			console.log(data);
			if(data.usuario_id == '') 
				return socket.emit('yo_socket_io_consultando_a_postgresql_te_contesto_si_te_gusta_o_no_esa_puta_mierda_de_denuncia_vale?', 
					{error: true});

			
			client = new pg.Client('postgres://jose:jose@localhost/denuncias');
			
			client.connect(function(error){
				if(error) return console.error('Error conectando ', error);
				
				client.query("select * from likes where id_usuario = '" + data.usuario_id + "' and id_denuncia ='" + data.denuncia.gid + "'",
				function(e, r){
					//client.end();
					if(e) {
						client.end();
						return console.error('Error consultando ', e);
					}
					
					if(r.rows.length == 0){
						console.log('aun no le gusta pero le va a gustar en cuanto se actualize la bdd')
						// Al usuario aún no le gusta la denuncia y ha indicado que le gusta
						client.query("insert into likes(id_usuario, id_denuncia) values ('" + data.usuario_id + "','" + data.denuncia.gid + "')", 
						function(e_, r_){
							//client.end();
							if(e_) {
								client.end()
								return console.error('Error consultando ', e_);
							}
							
							if(data.usuario_id == data.denuncia.id_usuario){
								// Si le doy a like a una denuncia mía NO ENVIAMOS NOTIFICACIÓN
								return 	socket.emit('yo_socket_io_consultando_a_postgresql_te_contesto_si_te_gusta_o_no_esa_puta_mierda_de_denuncia_vale?',
								{error: false, like: true });
							}
							
							client.query("insert into notificaciones(id_denuncia, id_usuario_from, id_usuario_to, tipo) " +
							"values ('" + data.denuncia.gid + "','" + data.usuario_id + "','" + data.denuncia.id_usuario + "','LIKE_DENUNCIA') returning *",
							function(e__, r__){
								//client.end();
								if(e__) {
									client.end();
									return console.error('Error consultando', e__);
								}
								
								socket.emit('yo_socket_io_consultando_a_postgresql_te_contesto_si_te_gusta_o_no_esa_puta_mierda_de_denuncia_vale?',
										{error: false, like: true });
								
								if(clients[data.denuncia.id_usuario]){
									client.query("select * from usuarios where _id='" + data.usuario_id +"'"
									, function(_e, _result){
										client.end();
										if(_e) return console.error(_e);
										for(var socketId in clients[data.denuncia.id_usuario]){
											clients[data.denuncia.id_usuario][socketId].emit('denuncia_likeada', {denuncia: data.denuncia, from: _result.rows[0], noti: r__.rows[0]});
										}
									});
								}
								
							});
							
						});
					}
					else {
						console.log('le gusta pero le va a dejar de gustar');

						client.query("delete from likes where id_usuario = '" + data.usuario_id + "' and id_denuncia = '" + data.denuncia.gid + "'", 
						function(e_, r_){
							//client.end();
							if(e_) {
								client.end()
								return console.error('Error consultando ', e_);
							}
							
							if(data.usuario_id == data.denuncia.id_usuario){
								// Si me ha dejado de gustar una denuncia mía NO ENVIAMOS NOTIFICACIÓN
								return 	socket.emit('yo_socket_io_consultando_a_postgresql_te_contesto_si_te_gusta_o_no_esa_puta_mierda_de_denuncia_vale?',
								{error: false, like: false });
							}
							
							client.query("insert into notificaciones(id_denuncia, id_usuario_from, id_usuario_to, tipo) " +
							"values ('" + data.denuncia.gid + "','" + data.usuario_id + "','" + data.denuncia.id_usuario + "','NO_LIKE_DENUNCIA') returning *",
							function(e__, r__){
								//client.end();
								if(e__) {
									client.end();
									return console.error('Error consultando', e__);
								}
								
								socket.emit('yo_socket_io_consultando_a_postgresql_te_contesto_si_te_gusta_o_no_esa_puta_mierda_de_denuncia_vale?',
										{error: false, like: false });
								
								if(clients[data.denuncia.id_usuario]){
									client.query("select * from usuarios where _id='" + data.usuario_id +"'"
									, function(_e, _result){
										client.end();
										if(_e) return console.error(_e);
										for(var socketId in clients[data.denuncia.id_usuario]){
											clients[data.denuncia.id_usuario][socketId].emit('denuncia_no_likeada', {denuncia: data.denuncia, from: _result.rows[0], noti: r__.rows[0]});
										}
									});
								}
								
							});
									
						});
					}
					
				});
				
			});
		});
		
		
	});

	io.of('/app/denuncias/nueva').on('connection', function(socket){
		socket.join('sessionId');
		console.log(socket.id + ' sessionID');
		
		// Creamos una carpeta temporal dentro de public/files/temp/
		// cuyo nombre es el identificador del socket
		mkdirp(path.join(config.TEMPDIR, socket.id), function (err){
			if(err) console.log(err);
		}); // Crea un directorio si no existe
		
		
		socket.on('disconnect', function(){
			console.log(this.id + ' desconectado');
			exec( 'rm -r ' + config.TEMPDIR + "/" + this.id, function ( errD, stdout, stderr ){
				if (errD) console.log(errD);
			});
		});
	});
	
}