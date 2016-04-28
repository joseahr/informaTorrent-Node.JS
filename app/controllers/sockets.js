/**
 * SOCKET.IO
 */
var validator = require('validator');

var usuarioModel = require('../models/usuario.js');
var denunciaModel = require('../models/denuncia.js');

global.clients = {}; // Un cliente puede tener varios sockets abiertos

module.exports = function(io){

	// Creamos instancias de usuarioModel y denunciaModel
	usuarioModel = new usuarioModel();
	denunciaModel = new denunciaModel();
	
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
			// Actualizamos en la bdd ponemos la notificación vista a true
			usuarioModel.noti_vista(data, function(error){
				if(!error){
					// Emitimos el evento a todos los sockets abiertos del usuario
					for(var socketId in clients[socket.id_usuario])					
						// Emitimos el evento a modo de callback para actualizar en el cliente la notificación a vista
						clients[socket.id_usuario][socketId].emit('noti_vista_cb', data);
					console.log('El usuario ' + socket.id_usuario + ' ha visto una notificación');
				}
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
			// filtro de la consulta
			var filtro = {};
			
			filtro.consulta = 'denuncias_sin_where';

			filtro.titulo = data.titulo && data.titulo != '' ? data.titulo : undefined;
			filtro.tags = data.tags && data.tags != '' ? data.tags.split(',') : undefined;
			filtro.usuario_nombre = data.username && data.username != '' ? data.username : undefined;

			filtro.lon = data.lon && data.lon != '' ? data.lon : undefined;
			filtro.lat = data.lat && data.lat != '' ? data.lat : undefined;
			filtro.buffer_radio = data.buffer_radio && data.buffer_radio != '' ? data.buffer_radio : undefined;

			filtro.fecha_desde = data.fecha_desde && data.fecha_desde != '' ? data.fecha_desde.split('/') : undefined;
			filtro.fecha_hasta = data.fecha_hasta && data.fecha_hasta != '' ? data.fecha_hasta.split('/') : undefined;

			filtro.bbox = (filtro.lat || filtro.lon || filtro.buffer_radio) ? undefined : 
				(data.bbox ? data.bbox : undefined);
			// Comprobamos que haya metido algún parámetro de búsqueda
			for(var key in filtro) {
				if (filtro[key] != undefined) {
					aux = true;
					console.log('keeeeey' + key);
				}
								
			}
			// Si no ha añadido ningún parámetro de búsqueda emitimos un evento de error
			if(!aux) return socket.emit('error_query', {msg: 'Debe introducir algún parámetro de búsqueda'});
			// Validamos los parámetros que envía el usuario
			if(filtro.lat && filtro.lon && filtro.buffer_radio){
				if(!validator.isDecimal(filtro.lon.replace(',', '.')) && !validator.isNumeric(filtro.lon))
					return socket.emit('error_query', {msg: 'La longitud del centro del buffer debe ser numérica'});

				if(!validator.isDecimal(filtro.lat.replace(',', '.')) && !validator.isNumeric(filtro.lat))
					return socket.emit('error_query', {msg: 'La latitud del centro del buffer debe ser numérica'});
				
				if(!validator.isDecimal(filtro.buffer_radio) && !validator.isNumeric(filtro.buffer_radio))
					return socket.emit('error_query', {msg: 'El radio del centro del buffer debe ser numérico'});
			}
			else if((filtro.lat || filtro.lon) && !filtro.buffer_radio) 
				return socket.emit('error_query', {msg: 'Debes introducir el centro del buffer y el radio. Ambos parámetros'});
			else if(!(filtro.lat || filtro.lon) && filtro.buffer_radio) 
				return socket.emit('error_query', {msg: 'Debes introducir el centro del buffer y el radio. Ambos parámetros'});
			// Ejecutamos consulta
			denunciaModel.find(filtro, false, function(error, result){
				if(error)
					return socket.emit('error_query', {msg: 'Debe introducir algún parámetro de búsqueda'});
				return socket.emit('api', {query: result.query});
			});
		});

		// Alguien ha emitido un evento para saber qué denuncias tiene cerca
		// Emite su posición
		socket.on('tengo_denuncias_cerca_?', function(data){
			// si no data salimos
			if (!data) return;
			// Ejecutamos la consulta 
			denunciaModel.denuncias_cerca(data, function(error, denuncias){
				if(error)
					socket.emit('si_que_tengo_denuncias_cerca', []);
				else
					socket.emit('si_que_tengo_denuncias_cerca', denuncias);
			});
		});
		
		// Alguien se ha metido en la página de una denuncia, al iniciar emite este evento para saber si le gusta la denuncia
		socket.on('te_pregunto_que_si_me_gusta_esta_puta_mierda_de_denuncia?', function(data){
			// Si el usuario no está conectado salimos
			if(data.usuario_id == '') 
				return socket.emit('yo_socket_io_consultando_a_postgresql_te_contesto_si_te_gusta_o_no_esa_puta_mierda_de_denuncia_vale?', 
					{error: true});

			var id_usuario = this.id_usuario;
			// ejecutamos la consulta para saber si nos gusta la denuncia
			usuarioModel.me_gusta_la_denuncia(id_usuario, data.denuncia.gid, function(error, like){
				if(!error)
					// Emitimos el evento con la respuesta de si le gusta la denuncia
					socket.emit('yo_socket_io_consultando_a_postgresql_te_contesto_si_te_gusta_o_no_esa_puta_mierda_de_denuncia_vale?',
						{error: false, like: like});
			});	
		});
		
		// Alguien le ha dado al botón de me gusta --> Puede ser por dos motivos
		// 1- Le gusta 2 - Le ha dejado de gustar
		socket.on('le_he_dao_al_boton_de_me_gusta_haz_lo_que_tengas_que_hacer', function(data){
			// Si el usuario no está conectado emitimos mensaje de error
			if(data.usuario_id == '') 
				return socket.emit('yo_socket_io_consultando_a_postgresql_te_contesto_si_te_gusta_o_no_esa_puta_mierda_de_denuncia_vale?', 
					{error: true});

			var id_usuario = this.id_usuario;

			denunciaModel.find_by_id(data.denuncia.gid, function(error, denuncia){
				if(!error)
					usuarioModel.me_gusta_la_denuncia(id_usuario, data.denuncia.gid, function(error, like){
						if(!error)
							usuarioModel.likear_denuncia(id_usuario, denuncia, like, function(error, notificacion){
								socket.emit('yo_socket_io_consultando_a_postgresql_te_contesto_si_te_gusta_o_no_esa_puta_mierda_de_denuncia_vale?', 
									{error: false, like : !like});
								if(notificacion){
									usuarioModel.find_by_id(id_usuario, function(error, usuario){
										// Si es una notificación de me gusta y el cliente está conectado
										if(!like && clients[data.denuncia.id_usuario])
											// Emitimos el evento a todos sus sockets abiertos
											for(var socketId in clients[data.denuncia.id_usuario]){
												// Emitimos el evento
												console.log('event like ');
												clients[data.denuncia.id_usuario][socketId].emit('denuncia_likeada', 
													{denuncia: denuncia, from: usuario, noti: notificacion});
											}
										// Si es una notificación de ya no me gusta y el usuario está conectado 
										else if(like && clients[data.denuncia.id_usuario])
											// Emitimos el evento a todos sus sockets abiertos
											for(var socketId in clients[data.denuncia.id_usuario]){
												// Emitimos el evento
												console.log('event no like')
												clients[data.denuncia.id_usuario][socketId].emit('denuncia_no_likeada', 
													{denuncia: denuncia, from: usuario, noti: notificacion});
											}
									});
								}
							});
					});
			});
		}); // Le he dao al boton del like	
	}); // io.of('/app/visor')
};