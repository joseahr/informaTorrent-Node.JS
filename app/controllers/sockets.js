/**
 * SOCKET.IO
 */

global.clients = {}; // Un cliente puede tener varios sockets abiertos

module.exports = function(io, pg, path, mkdirp, exec, config){
	
	io.of('/app/visor').on('connection', function(socket){
		
		socket.on('get_num_usuarios', function(){
			// Lo emite un cliente loggeado o no para obtener el número de usuarios conectados
			// Emitimos el evento
			socket.emit('num_usuarios_conectados', {num_usuarios: Object.keys(clients).length});
		});
		
		socket.on('noti_vista', function(data){
			// data --> id de la notificación
			var client = new pg.Client('postgres://jose:jose@localhost/denuncias');
			
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
			var client = new pg.Client('postgres://jose:jose@localhost/denuncias');
						
			client.connect(function(error){
				if(error) console.error('Error conectando a la bdd', error);
				else {
					client.query("select _id from usuarios where " +
					"st_distance(st_transform(location_pref, 25830), st_transform(st_geomfromtext('" + data.wkt + "', 4258), 25830)) < 20 "+
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
								console.log('id usuario afectado denuncia cerca ' + id_usuario._id);
								if(index != result.rows.length -1)
									values = "('"+ data.id +"','"+ id_usuario_from +"','" + id_usuario._id + "','DENUNCIA_CERCA')";
								else
									values = "('"+ data.id +"','"+ id_usuario_from +"','" + id_usuario._id + "','DENUNCIA_CERCA')";
								if(clients[id_usuario._id] && id_usuario._id != id_usuario_from){
									// Si el usuario está conectado y es distinto al usuario que emite la
									// denuncia emitimos esa notificación a el usuario
									
									client.query("select * from usuarios where _id='" + id_usuario_from +"'"
									, function(_e, _result){
										//client.end();
										if(_e) return console.error(_e);
										
										client.query("insert into notificaciones(id_denuncia, id_usuario_from, id_usuario_to, tipo) " +
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
			var client = new pg.Client('postgres://jose:jose@localhost/denuncias');
			
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