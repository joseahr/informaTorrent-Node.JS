var connectionString = "postgres://jose:jose@localhost/denuncias", // BDD Denuncias
	connectionStringCarto = "postgres://jose:jose@localhost/carto_torrent", // BDD InformaTorrent
	fs, // file System
	path, // util para paths
	dir, // recorrer directorios
	exec, // Ejecutar comandos
	denunciasPorPagina = 10,
	maxPaginas = 0,
	pg, // postgreSQL
	config = require('../../config.js'),
	User, // modelo de usuario
	validator; // validator 
var client, io, io_visor;
	
/*
 * Constructor
 */
function ContPg(fs_, path_, dir_, exec_, pg_, User_, validator_, sio){
	io = sio;
	fs = fs_;
	path = path_;
	dir = dir_;
	exec = exec_;
	pg = pg_;
	User = User_;
	validator = validator_;
	io.of('/app/visor').on('connection', function(socket){
		console.log('conectdo visor' + socket.id);
		socket.on('new_denuncia_added', function(data){
			console.log('emit denuncias to all users' + data);
			socket.broadcast.emit('new_denuncia', {denuncia: data});
		});
	});
	
}

/*
 * Añadimos un comentario en una denuncia.
 */
ContPg.prototype.addComentario = function(req, res){
	
	var contenido = req.body.contenido;
	var user_id = req.user._id;
	var id_denuncia = req.params.id_denuncia;
	
	client = new pg.Client(connectionString);
	client.connect(function(err){
		  if(err) {
			  return res.redirect('back');
		  }
		  client.query(queries.addComentario(user_id, id_denuncia, contenido), function(erro, result){	  
			  client.end();
			  return res.redirect('back');
		  });		  
	});
};

/* 
 * Guardamos la denuncia
 */

ContPg.prototype.saveDenuncia = function(req, res){
	process.nextTick(function(){
		var response = {}; // La respuesta que se envía
		var errormsg = ''; // mensaje de errores
		
		var imagenes = []; // Lista de imágenes a guardar en la base de datos
		var titulo = req.body.titulo.replace(/["' # $ % & + ` -]/g, " ");
		var contenido = req.body.contenido.replace(/["' # $ % & + ` -]/g, " ");
		var wkt = req.body.wkt;
		
		var user_id = validator.escape(req.user._id); // id_usuario
		var tempDirID = req.body.tempDir; // nombre del directorio temporal donde se guardan las imágenes
		
		var tags_ = req.body.tags;  // tags introducidos por el usuarios
		var tags = '{'; // hay que convertirlo en {'tag1', 'tag2', ...} para introducirlo en pgsql
				
		
		// comprobando datos de la denuncia
		if(!validator.isLength(titulo, 5, 50)) errormsg += '· El título debe tener entre 5 y 50 caracteres.\n';
		if(!validator.isLength(contenido, 50, 10000)) errormsg += '· El contenido debe tener entre 50 y 10000 caracteres.\n';
		if(wkt == undefined) errormsg += '· Debe agregar un punto, línea o polígono\n';	
		
		//  Formateamos los tags para introducirlos como ARRAY(TEXT) en pgsql
		tags_.forEach(function(tag, index, that){
			
			tag = tag.replace(/["' # $ % & + ` - \s]/g, "");
			if (!validator.isLength(tags, 1, 10)){
				response.type = 'error';
				response.msg += 'El tag "' + tag + '" no debe tener más de 10 caracteres\n'
			}
			if(index == that.length - 1)
			{
				if (tag == '')
					tags = tags + '}';
				else
					tags = tags + ',' + tag + '}';
			}
			else if(index == 0)
			{
				if (tag != '')
					tags = tags + tag;
			}
			else
			{
				if (tag != '')
					tags = tags + ',' + tag;
					
			}
		});
		
		// Si hay algún error en los datos devolvemos la denuncia
		if(errormsg.length > 0){
			console.log('error_mensaje --> ' + errormsg);
			response.type = 'error';
			response.msg = errormsg;
			return res.send(response);			
		};

		// Nos conectamos a la base de Datos Carto_Torrent para comprobar que la geometría
		// introducida está dentro de torrent
		// Utilizamos la función ST_Contains(geom, geom) de postGIS
		
		var clientCarto = new pg.Client(connectionStringCarto);
		clientCarto.connect(function(errCartoConnect){
			if(errCartoConnect) {
				return console.error('error fetching client from pool', errCartoConnect);
			}
			console.log(wkt);
			// Consulta para saber si el punto está dentro 
			clientCarto.query(queries.torrentContainsGeom(wkt),
			function(errorCartoIn, estaDentro){
				// error al realizar la consulta
				clientCarto.end();
				if(errorCartoIn) return console.error('error en la consulta espacial', errorCartoIn);
				
				console.log(estaDentro.rows[0].st_contains);
				
				// Si la denuncia no está dentro...
				if (estaDentro.rows[0].st_contains == false){
					console.log('Tu no eres del barrio mierda');
					response.type = 'error';
					response.msg = 'La geometría debe estar en Torrente';
					return res.send(response);
				}
				else if(wkt.match(/LINESTRING/g) && estaDentro.rows[0].st_length > 500){
					// Comprobar en caso de línea no supere cierta longitud (1000 metros)
					response.type = 'error';
					response.msg = 'La línea no debe tener una longitud mayor a 500 metros';
					return res.send(response);
				}
				else if(wkt.match(/POLYGON/g) && estaDentro.rows[0].st_area > 10000){
					// Comprobar en caso de polígono no supere cierto area
					response.type = 'error';
					response.msg = 'El polígono no debe superar un area de 10000 metros cuadrados';
					return res.send(response);
				}
				else {
					// La geometría está dentro de Torrent
					
					dir.files(config.TEMPDIR + "/" + tempDirID, function(err, files) {
						// Recorremos el directorio temporal en busca de imágenes añadidas a la denuncia.
						// Almacenamos el path (TODO: almacenar también la descripción) en una lista
						// para luego introducir esos path en la bdd
						  if (err) {
							  errormsg += '· Fail' +err;
							  console.log('error_mensaje --> ' + errormsg);
							  response.type = 'error';
							  response.msg = errormsg;
							  return res.send(response);
						  }
						  
						  // Para cada imagen subida la movemos del directorio temporal 
						  // a la carpeta final
						  files.forEach(function(ruta) {
							  
						    console.log('img: ' + path.basename(ruta));
						    
							  var from = path.join(config.TEMPDIR, tempDirID + "/" + path.basename(ruta));
							  var to = path.join(config.UPLOADDIR, tempDirID +"-" + path.basename(ruta));
							  
							 // Movemos la imagen desde la carpeta temporal hasta la carpeta final
							 fs.rename(from, to, function(err) {
								 if(err) errormsg += err;
								 
								 imagenes.push("/files/denuncias/" + path.basename(to)); 
								 console.log('imgs list(' + imagenes.length + '): ' + imagenes);
							  
							 });
						  });
					});
					
					client = new pg.Client(connectionString);
					client.connect(function(err){
						if(err) {
							return console.error('error fetching client from pool', err);
						}
						// SI hay un error en la conexión a postgre lo mostramos
				  
						// Si no ejecutamos la consulta para obtener las denuncias
				  
						client.query(queries.insertDenuncia(user_id, titulo, contenido, wkt, tags), 
						function(err, result){
							//console.log(result.rows);
							
							if (err){
								client.end();
								return console.error('error', err);
							}
							// ID de la denuncia introducida, lo obtenemos ya que lo hemos devuelto 
							// en la consulta de INSERT --> returning gid;
							var id_denuncia = result.rows[0].gid;
							
							// Añadir las imágenes
							var values = '';
							
							if(imagenes.length == 0){
								client.end();
								// Si no hay imágenes... Denuncia guardada correctamente
								console.log('guardada - no imgs');
								response.type = 'success';
								response.msg = 'Denuncia Guardada Correctamente';
								res.send(response);
							}
							else
							{
								// values para la consulta SQL
								imagenes.forEach(function(img, index, that){		
									if (index == that.length - 1)
										values += "('" + img + "','" + id_denuncia + "','" + user_id + "')";
									else
										values += "('" + img + "','" + id_denuncia + "','" + user_id + "'),";
								});
								
								// Insertamos las paths e info de las imágenes en la bdd
								client.query(queries.insertImagenes(values), 
								function(err1, result1){
									client.end();
									if (err1)
										return console.error('error en la consulta', err1);
									console.log('guardada');
									response.type = 'success';
									response.msg = 'Denuncia Guardada Correctamente';
									res.send(response);
											
								}); // insert into imagenes
							}}); // cliet.query(insert into denuncias)
					}); // Pg connect
				}});	// Geom está dentro de Torrente, function(err, estaDentro));
		}); // Pg connect Carto
	});
}; // Fin saveDenuncia

/*
 * Renderizamos el Perfil del usuario
 */
ContPg.prototype.getProfile = function(req, res) {
	// En cualquier otro caso renderizamos
	console.log('mi PErfil');
	var misDenuncias;
	client = new pg.Client(connectionString);
	client.connect(function(err){
		  if(err) {
		    return console.error('error fetching client from pool', err);
		  }
		  
		  client.query(queries.getUserDenuncias(req.user._id),function(err1, misDenuncias){
			  client.end();
			  console.log('Er');
			  if(err1) return console.error('errrrrrrror', err1);
			  else res.render('profile', {user : req.user, misDenuncias: misDenuncias.rows});
		  });
	});

};

/*
 *  Ruta /app/denuncias?page=1,2,3....
 */
ContPg.prototype.getDenunciasPage = function(req, res){
	var result;
	var page = req.query.page; // TODO: comprobar que sea un número
	if (!validator.isNumeric(page.toString())){
		res.redirect('/app/denuncias?page=1')
	}
	// TODO: otros query params para ordenar por otros campos?
	client = new pg.Client(connectionString);
	client.connect(function(err){
	  if(err) {
		  res.redirect('/app');
	  }
	  // SI hay un error en la conexión a postgre lo mostramos
	  
	  // Si no ejecutamos la consulta para obtener las denuncias
	  
	  // TODO: Num denuncias en una consulta nueva
	  client.query(queries.denuncias(page), 
	  function(err, result_){
		  if(err){ client.end(); return res.redirect('/app');}
		  result = result_;
		  client.query(queries.num_denuncias(), function(e_qc, result1){
			  console.log('resulttttt '+ result + '  ' + result1);
			  client.end();
			  if(e_qc) {return res.redirect('/app');}
			  var numDenuncias = result1.rows[0].numdenuncias;
			  var maxPages = 1;
			  if (Math.ceil(numDenuncias/10) > 0)
				  maxPages = Math.ceil(numDenuncias/10);
			  console.log('numDenuncias ' + numDenuncias + ' maxPages ' + Math.ceil(numDenuncias/10));
			  console.log(result.rows);
			  if(result.rows.length == 0){
				  if(page > 1 || page <= 0)
					  res.redirect('/app/denuncias?page=' + maxPages);
//				  return res.render('denuncias', {denuncias: [], 
//					  user: req.user,
//					  page: page,
//					  maxPages: maxPages,
//					  message: {info: 'No hay más denuncias'}});
			  }
			  
			  return res.render('denuncias',{denuncias : result.rows, 
					   user : req.user,
					   page: page,
					   maxPages: maxPages
			  });
			  //console.log(result.rows);
			  //res.send(result.rows);
			  
		  }); //End query count denuncias
		  
	  }); // end query seleccionar denuncias
		  
	});

};

/*
 * Ruta /app/denuncia/:id_denuncia
 */
ContPg.prototype.getDenunciaPage = function(req,res){
	client = new pg.Client(connectionString);
	client.connect(function(err){
		  if(err) {
			  res.redirect('/app');
		  } //IF ERROR 	 
		  
		  // Obtener toda la info de la denuncia
		  client.query(queries.denuncia(req.params.id_denuncia),
		  function(error, denuncia_){
			  client.end();
			  if (error) res.redirect('/app/denuncias?page=1');
			  if (denuncia_.rows.length == 0){
				  return res.redirect('/app');
			  }
			  var denuncia = denuncia_.rows[0];
			  if (error)
				  res.redirect('/app');
			  //client.end();
			  //console.log(denuncia);
			  denuncia.geometria = JSON.stringify(denuncia.geometria);
			  res.render('denuncia', {denuncia: denuncia, user: req.user});	  
			  
		  });
		  
	}); // PG CONNECT
};

/*
 * Ruta app/deleteImagen?path=path_denuncia
 */
ContPg.prototype.deleteImagenDenuncia = function(req, res){
	if(!req.query.path){
		return res.send('no hay path');
	}
	else {
		var path = '/files/denuncias/' + req.query.path;
		
		client = new pg.Client(connectionString);
		client.connect(function(e){
			if (e) res.send('error conectand bdd');
			else {
				client.query(queries.deleteDenunciaImagen(path), function(er, result){
					client.end();
					if (er) res.send('error realizando consulta');
					else {
						if (result.rowCount > 0){
							exec('rm -r ' + config.UPLOADDIR + '/' + req.query.path, function(error){
								if (error) console.error('error borrando la imagen', error);
								else res.send('Imagen "' + path + '" eliminada correctamente.');
							});
						}
						else {
							res.send('No se encontró la imagen "' + path + '"');
						}
					}
				});
			}
			
		});
		
	}
}

/*
 * Ruta /app/getImagenes?id=id_denuncia
 */
ContPg.prototype.getImagenesDenuncia = function(req, res){
	if (!req.query.id) res.send('Error obteniendo imágenes de la denuncia');
	var id = req.query.id;
	
	client = new pg.Client(connectionString);
	client.connect(function(e){
		if(e) res.send('error conectando cliente a la base de datos');
		else {
			client.query(queries.denuncia(id), function(er, result){
				client.end();
				if(er) res.send('error consultando ');
				else{
					var denuncia = result.rows[0];
					
					var list = [];
					if(denuncia.imagenes)
						denuncia.imagenes.forEach(function(imagen){
							var obj = {};
							obj.name = path.basename(imagen.path);
							obj.size = 0;
							obj.path = imagen.path;
							list.push(obj);
						});
					
					res.send(list);
				}
			});
		}
	});
}

/*
 *  Ruta /app/edit/
 */
ContPg.prototype.getEdit = function(req, res, next){
	var id = req.query.id;
	if(!id){
		//Mostar error
		return res.redirect('back');
	}
	else{
		console.log('editar');
		
		client = new pg.Client(connectionString);
		client.connect(function(e){
			if(e) return console.error('error conectando cliente a la bdd', e);
			else{
				client.query(queries.denuncia(id), function(er, denuncia){
					client.end();
					if (er) return console.error('error realizando consulta', er);
					else if (denuncia.rows.length == 0)
						res.redirect('/app/profile');
					else{
						if(denuncia.rows[0].id_usuario != req.user._id){
							console.log('error usuario');
							var error = new Error('Acceso Denegado.\n Usted no tiene permiso para modificar esta denuncia.');
							error.status(401)
							next(error)
						}
						else{
							console.log('editaaaaaaaaar');
							res.render('editar.jade', {denuncia: denuncia.rows[0]});
						}
						
					}
				});
			}
			
		});
	}
};


/*
 *  Ruta /app/delete/
 */
ContPg.prototype.deleteDenuncia = function(req, res){
	
	if(!req.query.id){
		//Mostar error
		res.redirect('/app/profile');
	}
	console.log('delete ' + req.query.id);
	var id = req.query.id; // id de la denuncia
	
	var id_user = req.user._id; // id del usuario
	
	client = new pg.Client(connectionString);
	client.connect(function(err){
		// Nos intentamos conectar a pg
		if (err) return console.error('error al conectarse en bdd', err);
		
		client.query(queries.getDenunciaUserID(id), function(e, user_id){
			
			if(e) {
				client.end();
				return console.error('error consultando', e);
			}
			
			var user_den_denuncia = user_id.rows[0].id_usuario;
			
			if(user_den_denuncia != id_user){
				client.end();
				console.log('acceso denengado + id_user ' + id_user + '; id_user_den: ' + user_den_denuncia);
				req.flash('error','Acceso denegado. No tienes permisos para eliminar esta denuncia');
				res.redirect('/app/profile');
			}
			else {
				
				client.query(queries.getDenunciaImagenes(id), function(eI, imagenes){
					if(eI) {
						client.end();
						console.error('error consulta imagenes', eI);
					}
					else{
						// no hay error
						if(imagenes.rows.length > 0){
							// Hay imágenes
							imagenes.rows.forEach(function(img){
								exec('rm -r ' + config.UPLOADDIR + "/" + path.basename(img.path), function ( errD, stdout, stderr ){
									// Eliminamos las imágenes de la carpeta FINAL
									if (errD) {
									console.log('error_mensaje --> ' + errD);
									}
									else console.log('imagen eliminada: ' + path.basename(img.path));
									
								}); 
							});
							
						}
						// Eliminamos la denuncia en la BDD, al estar definidas las claves ajenas
						// y el borrado en casacada nos eliminará de la base de datos las 
						// imñágenes y comentarios y tags, sin necesidad de otra consulta
						client.query(queries.deleteDenuncia(id), function(err1, eliminado){
							client.end();
							if(err1) return console.error('error consultando', err1);
							if (eliminado.rowCount > 0){
								console.log(eliminado);
								res.send('La denuncia con id: ' + id + ' se ha eliminado correctamente');
							}
							else{
								console.log(eliminado);
								res.send('Denuncia no encontrada'); // No debe pasar
							}
						}); // Client.query delete denuncia
					}
				}); // Client.query getImagenesDenuncia
			}

		}); // Client.query getDenunciaUserID
		
	}); // Pg.Connect
};


var queries = {
		denuncia: function(id_denuncia){
			return "SELECT *,to_char(fecha::timestamp,'TMDay, DD TMMonth YYYY HH24:MI:SS') as fecha," +
	  		"ST_AsGeoJSON(the_geom) as geometria FROM denuncias " +
	  		"LEFT   JOIN LATERAL (" +
	  		"SELECT json_agg(com) AS comentarios " +
	  		"FROM  (SELECT c.id_usuario, c.contenido, to_char(c.fecha::timestamp,'TMDay, DD TMMonth YYYY a las HH24:MI:SS') as fecha, u.* FROM comentarios c, usuarios u WHERE c.id_usuario = u._id and c.id_denuncia = denuncias.gid ORDER BY c.fecha DESC) com" +
	  		") comentarios ON true " +
	  		"LEFT   JOIN LATERAL (" +
	  		"SELECT json_agg(img) AS imagenes " +
	  		"FROM  (SELECT *,to_char(fecha::timestamp,'TMDay, DD TMMonth YYYY') as fecha  FROM imagenes WHERE id_denuncia = denuncias.gid) img" +
	  		") imagenes ON true " +
	  		"LEFT   JOIN LATERAL (" +
	  		"SELECT json_agg(usuario) AS usuario " +
	  		"FROM  (SELECT * FROM usuarios WHERE _id = denuncias.id_usuario) usuario" +
	  		") usuarios ON true " +
	  		"WHERE  gid='" + id_denuncia + "' ORDER BY denuncias.fecha DESC";
		},
		updateDenuncia: function(id_denuncia, titulo, contenido, wkt, tags){
			return "UPDATE denuncias SET (titulo, descripcion, the_geom, tags) = ("
			+ "'" + titulo + "','" + contenido + "', st_geomfromtext('" + wkt + "',4258),'" + tags + "')" +
					" WHERE gid='" + id_denuncia + "'";//TODO
		},
		denuncias: function(page){
			return "SELECT *,to_char(fecha::timestamp,'TMDay, DD TMMonth YYYY HH24:MI:SS') as fecha," +
	  		"ST_AsGeoJSON(the_geom) as geometria FROM denuncias " +
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
	  		"ORDER BY denuncias.fecha DESC limit 10 offset " 
	  		+ (page - 1)*10;
		},
		num_denuncias: function(){
			return 'select count(*) as numdenuncias from denuncias';
		},
		getUserDenuncias: function(id_usuario){
			return "SELECT *,to_char(fecha::timestamp,'TMDay, DD TMMonth YYYY HH24:MI:SS') as fecha," +
	  		"ST_AsGeoJSON(the_geom) as geometria FROM denuncias " +
	  		"LEFT   JOIN LATERAL (" +
	  		"SELECT json_agg(com) AS comentarios " +
	  		"FROM  (SELECT id_usuario, contenido, to_char(fecha::timestamp,'TMDay, DD TMMonth YYYY a las HH24:MI:SS') as fecha FROM comentarios WHERE id_denuncia = denuncias.gid ORDER BY fecha DESC) com" +
	  		") comentarios ON true " +
	  		"LEFT   JOIN LATERAL (" +
	  		"SELECT json_agg(img) AS imagenes " +
	  		"FROM  (SELECT *,to_char(fecha::timestamp,'TMDay, DD TMMonth YYYY') as fecha  FROM imagenes WHERE id_denuncia = denuncias.gid) img" +
	  		") imagenes ON true " +
	  		"WHERE  id_usuario='" + id_usuario + "' ORDER BY denuncias.fecha DESC";
		},
		insertImagenes: function(values){
			return "insert into imagenes(path, id_denuncia, id_usuario) " +
			"VALUES" + values;
		},
		insertDenuncia: function(user_id, titulo, contenido, wkt, tags){
			return "insert into denuncias(titulo, descripcion, the_geom, id_usuario, tags) VALUES('" + 
			titulo + "', '" +  
			contenido + "'," + 
			"ST_GeomFromText('" + wkt + "',4258),'" 
			+ user_id + "','" + tags + "') returning gid";
		},
		torrentContainsGeom : function(wkt){
			if (wkt.match(/POINT/g))
				return "select st_contains(muni_torrent.geom, st_geomfromtext('"+ wkt +"',4258)) " +
				"from muni_torrent";
			else if(wkt.match(/LINESTRING/g))
				return "select st_contains(muni_torrent.geom, st_geomfromtext('"+ wkt +"',4258)), " +
				"st_length(st_transform(st_geomfromtext('"+ wkt +"',4258) , 25830)) from muni_torrent";
			else if(wkt.match(/POLYGON/g))
				return "select st_contains(muni_torrent.geom, st_geomfromtext('"+ wkt +"',4258)), " +
				"st_area(st_transform(st_geomfromtext('"+ wkt +"',4258) , 25830)) from muni_torrent";
		},
		addComentario: function(user_id, id_denuncia, contenido){
			return "insert into comentarios(id_usuario, id_denuncia, contenido) " +
				   "VALUES('" + user_id + "', '" + id_denuncia + "','" + contenido + "')";
		},
		deleteDenuncia: function(id_denuncia){
			return "delete from denuncias where gid='" + id_denuncia + "'";
		},
		getDenunciaImagenes: function(id_denuncia){
			return "select * from imagenes where id_denuncia='" + id_denuncia + "'";
		},
		getDenunciaUserID : function(id_denuncia){
			return "select id_usuario from denuncias where gid='" + id_denuncia + "'";
		},
		deleteDenunciaImagen : function(path){
			return "delete from imagenes where path='" + path + "'";
		}
};

/*
 * Update Denuncia
 */
ContPg.prototype.updateDenuncia = function(req, res){
	
	var id_denuncia = req.query.id;
	
	var response = {};
	var errormsg = '';
	
	var imagenes = [];
	var titulo = req.body.titulo.replace(/["' # $ % & + ` -]/g, "");
	var contenido = req.body.contenido.replace(/["' # $ % & + ` -]/g, "");
	var wkt = req.body.wkt;
	//var descImgs = req.body.images_desc;
	//console.log(descImgs);
	
	var user_id = validator.escape(req.user._id);
	var tempDirID = req.body.tempDir;
	
	var tags_ = req.body.tags;
	var tags = '{';
	
	// comprbando datos de la denuncia
	if(!validator.isLength(titulo, 5, 50)) errormsg += '· El título debe tener entre 5 y 50 caracteres.\n';
	if(!validator.isLength(contenido, 50, 10000)) errormsg += '· El contenido debe tener entre 100 y 10000 caracteres.\n';
	if(wkt == undefined) errormsg += '· Debe agregar un punto, línea o polígono\n';	
	
	//  Formateamos los tags para introducirlos como ARRAY(TEXT) en pgsql
	tags_.forEach(function(tag, index, that){
		
		tag = tag.replace(/["' # $ % & / \ ( ) + ` { } - \s]/g, "");
		if (!validator.isLength(tags, 0, 10)){
			response.type = 'error';
			response.msg += 'El tag "' + tag + '" no debe tener más de 10 caracteres\n'
		}
		if(index == that.length - 1)
		{
			if (tag == '')
				tags = tags + '}';
			else
				tags = tags + ',' + tag + '}';
		}
		else if(index == 0)
		{
			if (tag != '')
				tags = tags + tag;
		}
		else
		{
			if (tag != '')
				tags = tags + ',' + tag;
				
		}
	});
	
	// Si hay algún error en los datos devolvemos la denuncia
	if(errormsg.length > 0){
		console.log('error_mensaje --> ' + errormsg);
		response.type = 'error';
		response.msg = errormsg;
		return res.send(response);			
	};

	// Nos conectamos a la base de Datos Carto_Torrent para comprobar que la geometría
	// introducida está dentro de torrent
	// Utilizamos la función ST_Contains(geom, geom) de postGIS
	var clientCarto = new pg.Client(connectionStringCarto);
	
	clientCarto.connect(function(errCartoConnect){
		if(errCartoConnect) {
			return console.error('error fetching client from pool', errCartoConnect);
		}
		console.log(wkt);
		// Consulta para saber si el punto está dentro 
		clientCarto.query(queries.torrentContainsGeom(wkt),
		function(errorCartoIn, estaDentro){
			// error al realizar la consulta
			clientCarto.end();
			if(errorCartoIn) return console.error('error en la consulta espacial', errorCartoIn);
			
			console.log(estaDentro.rows[0].st_contains);
			
			// Si la denuncia no está dentro...
			if (estaDentro.rows[0].st_contains == false){
				console.log('Tu no eres del barrio mierda');
				response.type = 'error';
				response.msg = 'La geometría debe estar en Torrente';
				return res.send(response);
			}
			else {
				// La geometría está dentro de Torrent
				
				dir.files(config.TEMPDIR + "/" + tempDirID, function(err, files) {
					// Recorremos el directorio temporal en busca de imágenes añadidas a la denuncia.
					// Almacenamos el path (TODO: almacenar también la descripción) en una lista
					// para luego introducir esos path en la bdd
					  if (err) {
						  errormsg += '· Fail' +err;
						  console.log('error_mensaje --> ' + errormsg);
						  response.type = 'error';
						  response.msg = errormsg;
						  return res.send(response);
					  }
					  
					  // Para cada imagen subida la movemos del directorio temporal 
					  // a la carpeta final
					  files.forEach(function(ruta) {
						  
						  console.log('img: ' + path.basename(ruta));
					    
						  var from = path.join(config.TEMPDIR, tempDirID + "/" + path.basename(ruta));
						  var to = path.join(config.UPLOADDIR, tempDirID +"-" + path.basename(ruta));
						  
						 // Movemos la imagen desde la carpeta temporal hasta la carpeta final
						 fs.rename(from, to, function(err) {
							 if(err) errormsg += err;
							 
							 imagenes.push("/files/denuncias/" + path.basename(to)); 
							 console.log('imgs list(' + imagenes.length + '): ' + imagenes);
						  
						 });
					  });
				});
				client = new pg.Client(connectionString);		
				client.connect(function(err){
					if(err) {
						return console.error('error fetching client from pool', err);
					}
					// SI hay un error en la conexión a postgre lo mostramos
			  
					// Si no ejecutamos la consulta para obtener las denuncias
			  
					client.query(queries.updateDenuncia(id_denuncia, titulo, contenido, wkt, tags), 
					function(err, result){
						//console.log(result.rows);
						console.log('e11111111');
						if (err){
							client.end();
							return console.error('error', err);
						}
						// Añadir las imágenes
						var values = '';
						
						if(imagenes.length == 0){
							// Si no hay imágenes... Denuncia guardada correctamente
							client.end();
							console.log('guardada - no imgs');
							response.type = 'success';
							response.msg = 'Denuncia Guardada Correctamente';
							res.send(response);
						}
						else
						{
							// values para la consulta SQL
							imagenes.forEach(function(img, index, that){		
								//var desc = img.desc.replace(/["' # $ % & / \ ( ) + ` { } - \s]/g, "");
								if (index == that.length - 1)
									values += "('" + img + "','" + id_denuncia + "','" + user_id + "')";
								else
									values += "('" + img + "','" + id_denuncia + "','" + user_id + "'),";
							});
							
							// Insertamos las paths e info de las imágenes en la bdd
							client.query(queries.insertImagenes(values), 
							function(err1, result1){
								client.end();
								console.log('e222222222222222');
								if (err1)
									return console.error('error en la consulta', err1);
								
								console.log('guardada');
								response.type = 'success';
								response.msg = 'Denuncia Actualizada Correctamente';
								res.send(response);
										
							}); // insert into imagenes
						}}); // cliet.query(insert into denuncias)
				}); // Pg connect
			}});	// Geom está dentro de Torrente, function(err, estaDentro));
	}); // Pg connect Carto
}; // Fin saveDenuncia

module.exports = ContPg;

