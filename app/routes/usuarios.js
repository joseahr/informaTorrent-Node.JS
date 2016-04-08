/**
 * Controlador Passport
 */
var passport = require('passport'); // Passport
var db;
var consultas;
var crypto;
var nodemailer;
var validator;
var User;
var config = require('../../config/mailer.js');
var formatsAllowed = 'png|jpg|jpeg|gif'; // Podríamos poner más

/*
 * Constructor
 */

function Usuario(crypto_, nodemailer_, validator_, User_, db_, q_){
	//passport = passport_;
	db = db_;
	consultas = q_;
	crypto = crypto_;
	nodemailer = nodemailer_;
	validator = validator_;
	User = User_;
};


/*
 * cambiarContraseña 
 */
Usuario.prototype.get_cambiar_pass = function(req, res){
	if(!req.user || !req.user.local.valid)
	{
		req.flash('error', req.i18n.__('debe_estar_logeado'));
		return res.redirect('/app#iniciar')
	}
	res.render('cambiarPass.jade');
};

Usuario.prototype.post_cambiar_pass = function(req, res, next){
	if(!req.user || !req.user.local.valid)
	{
		req.flash('error', req.i18n.__('debe_estar_logeado'));
		return res.redirect('/app#iniciar')
	}
	
	if (req.body.password_nueva != req.body.password_nueva_repeat){
		req.flash('error', req.i18n.__('contraseña_coincidir'));
		return res.redirect('back');
	}
	
	var password_original = req.body.password_original;
	var password_nueva = req.body.password_nueva;
	var password_nueva_repeat = req.body.password_nueva_repeat;
	
	db.one(consultas.usuario_por_email, req.user.local.email)
		.then(function(user){
			//console.log('password_original: ' + password_original);
			//console.log('password_original_verdadera: ' + user.password);
			if(!User.validPassword(password_original, user.password))
				throw new Error(req.i18n.__('contraseña_coincide_original'));
			user.local.password = User.generateHash(password_nueva);
			return db.none(consultas.actualizar_local_usuario, [JSON.stringify(user.local), user._id]);
		})
		.then(function(){
			req.flash('success', req.i18n.__('contraseña_actualizada'));
		})
		.catch(function(error){
			error.status = 500;
			next(error);
		});
};


/*
 * POST reset/:token
 */
Usuario.prototype.cambiar_pass_token = function(req, res, next) {
	
    if (req.body.password != req.body.passwordRepeat){
        req.flash('error', req.i18n.__('contraseña_coincidir'));
        return res.redirect('back');
    }
	
    var user_;
	db.oneOrNone(consultas.usuario_por_password_reset_token, req.params.token)
		.then(function(user){
			user_ = user;
			if(!user)
				throw new Error(req.i18n.__('url_no_valida_expirada'));
			db.none(consultas.actualizar_password_reset_token, [User.generateHash(req.body.password), user._id]);
		})
		.then(function(){
			req.flash(req.i18n.__('contraseña_actualizada'));
			req.logIn(user_, function(err) {
				if(err) throw err;
				enviar_email(user_.local.email, req)
		    });
		})
		.catch(function(error){
			error.status = 500;
			next(error);
			//res.status(500).send(error.toString());
		});
	
		var enviar_email = function(email, req){
		
			var smtpTransport = nodemailer.createTransport('SMTP', {
				service: 'gmail',
				auth: {
					user: config.user,
					pass: config.pass
				}
			});
			var mailOptions = {
				to: email,
				from: config.from,
				subject: req.i18n.__('email_actualizar_contraseña_titulo'),
				text:  req.i18n.__('email_actualizar_contraseña_contenido_1') + email + req.i18n.__('email_actualizar_contraseña_contenido_2')
			};
			smtpTransport.sendMail(mailOptions, function(err) {
				return res.redirect('/app');
			});
		}
};

/*
 * GET reset/:token
 */
Usuario.prototype.get_cambiar_pass_token = function(req, res, next) {
	
	db.oneOrNone(consultas.usuario_por_password_reset_token, req.params.token)
		.then(function(user){
			if (!user){
				req.flash('error', 'La URL solicitada no es válida o ha expirado.');
			    return res.redirect('/app#olvidaste')
			}
			else {
				res.render('cambiarPass.jade', {token: req.params.token, usuario_cambiar: user});
			}
		})
		.catch(function(error){
			error.status = 500;
			next(error);
			//res.status(500).send(error);
		});
};

/*
 * GET /app/forgot
 */
Usuario.prototype.get_olvidaste_pass = function(req, res){
	res.redirect('/app#olvidaste');
}

/*
 * POST Forgot -- Envía un mail para cambiar contraseña
 */
Usuario.prototype.olvidaste_pass = function(req, res, next) {
	
	if(!req.body.email) {
		req.flash('error', req.i18n.__('parametro_no_valido') + ': email');
		res.redirect('back');
	}

    crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        var user_;
        db.oneOrNone(consultas.usuario_por_email_o_username, req.body.email.toLowerCase())
        	.then(function(user){
        		if(!user) {
        			req.flash('error', req.i18n.__('usuario_email_no_existe') + req.body.email);
        			return res.redirect('back');
        		}
        		user_ = user;
        		db.none(consultas.set_token_1_hora , [token, user._id]);
        		
        	})
        	.then(function(){
        		enviar_email(token, user_.local.email);
        	})
        	.catch(function(error){
        		error.status = 500;
        		next(error);
        		//res.status(500).send(error);
        	});
        
        var enviar_email = function(token, email){
        	var smtpTransport = nodemailer.createTransport('SMTP', {
                service: 'Gmail',
                auth: {
                  user: config.user,
                  pass: config.pass
                }
              });
              var mailOptions = {
                to: email,
                from: config.from,
                subject: req.i18n.__('email_actualizar_contraseña_aviso_titulo'),
                text: req.i18n.__('email_actualizar_contraseña_aviso_contenido_1') + 
                  'http://' + req.headers.host + '/app/reset/' + token + '\n\n' +
                  req.i18n.__('email_actualizar_contraseña_aviso_contenido_2')
              };
              smtpTransport.sendMail(mailOptions, function(err) {
                req.flash('info', req.i18n.__('email_enviado') + email + req.i18n.__('email_instrucciones'));
                res.redirect('/app');
              });
        }      
    });

};

/*
 * Desconectar - Deslinkear cuenta TW Asociada
 */
Usuario.prototype.unlink_twitter = function(req, res) {
    var user           = req.user;
    
    db.none(consultas.deslincar_twitter, user._id)
    	.then(function(){
    		req.flash('success', req.i18n.__('cuenta_de') + ' Twitter ' + req.i18n.__('deslinqueada'));
    		res.redirect('/app/perfil');
    	})
    	.catch(function(error){
    		res.status(500).send(error);
    	});
};


/*
 * Desconectar - Deslinkear cuenta FB Asociada
 */
Usuario.prototype.unlink_facebook = function(req, res, next) {
    var user           = req.user;
    
    db.none(consultas.deslincar_facebook, user._id)
    	.then(function(){
    		req.flash('success', req.i18n.__('cuenta_de') + ' Twitter ' + req.i18n.__('deslinqueada'));
    		res.redirect('/app/perfil');
    	})
    	.catch(function(error){
    		error.status = 500;
    		next(error);
    		//res.status(500).send(error);
    	});
}

/*
 * Desconectar - Deslinkear cuenta Local Asociada
 */
//Usuario.prototype.unlinkLocal = function(req, res) {
//    var user            = req.user;
//    user.local.email    = undefined;
//    user.local.password = undefined;
//    user.local = undefined;
//    user.save(function(err) {
//    	if (err) req.flash('error', 'Error desconectando cuenta local');
//        res.redirect('/app/profile');
//    });
//};

/*
 * Conectar una cuenta de Twitter con otra existente -- Callback
 */
Usuario.prototype.conectar_twitter_callback = passport.authorize('twitter', {
    successRedirect : '/app/perfil',
    failureRedirect : '/app/perfil'
});

/*
 * Conectar una cuenta de Twitter con otra existente
 */
Usuario.prototype.conectar_twitter = passport.authorize('twitter', { scope : 'email' });

/*
 * Conectar una cuenta de Facebook con otra existente -- Callback
 */
Usuario.prototype.conectar_facebook_callback = passport.authorize('facebook', {
    successRedirect : '/app/perfil',
    failureRedirect : '/app/perfil'
});

/*
 * Conectar una cuenta de Facebook a otra existente
 */
Usuario.prototype.conectar_facebook = passport.authorize('facebook', { scope : 'email' });

/*
 * Lincar una Cuenta Local a otra existente
 */
//Usuario.prototype.connectLocal = passport.authenticate('local-signup', {
//    successRedirect : '/app/profile', // redirect to the secure profile section
//    failureRedirect : '/app/profile', // redirect back to the signup page if there is an error
//    failureFlash : true // allow flash messages
//})

/*
 * Twitter Auth -- Callback de Twitter una vez autentificcados
 */
Usuario.prototype.autenticar_twitter_callback = passport.authenticate('twitter', {
    successRedirect : '/app/perfil',
    failureRedirect : '/app#iniciar'
})

/*
 * Twitter Auth -- Twitter renderiza la página de inicio de Sesión
 */
Usuario.prototype.autenticar_twitter = passport.authenticate('twitter', { scope : 'email' });

/*
 *  Facebook Auth -- Callback de Facebook una vez autentificados
 */
Usuario.prototype.autenticar_facebook_callback = passport.authenticate('facebook', {
    successRedirect : '/app/perfil',
    failureRedirect : '/app#iniciar'
});

/*
 * Facebook Auth -- Facebook Renderiza la página de Inicio de Sesión
 */
Usuario.prototype.autenticar_facebook = passport.authenticate('facebook', { scope : 'email' });

/*
 * Post Login
 */
Usuario.prototype.autenticar_local = passport.authenticate('local-login', {
    successRedirect : '/app/perfil', // redirect to the secure profile section
    failureRedirect : '/app#iniciar', // redirect back to the signup page if there is an error
    failureFlash : true // allow flash messages
});
/*
 * POST SignUp
 */
Usuario.prototype.registrarse_local = passport.authenticate('local-signup', {
    successRedirect : '/app', // redirect to the secure profile section
    failureRedirect : '/app', // redirect back to the signup page if there is an error
    failureFlash : true // allow flash messages
});

/*
 * Renderizamos SignUp
 */
Usuario.prototype.pagina_registro = function(req, res) {
	res.redirect('/app#registrarse');
}

/*
 * Renderizamos LogIn
 */
Usuario.prototype.pagina_login = function(req, res) {
	res.redirect('/app#iniciar');
}


/*
 * Cerramos la sesión del usuario
 */
Usuario.prototype.cerrar_sesion = function(req, res) {
    req.logout();
    res.redirect('/app');
}

/*
 * Confirmar Usuario Ruta: /app/confirmar/:id_usuario
 */

Usuario.prototype.confirmar = function(req, res, next){
	var iduser = req.params.idUsuario;
	var user_;
	db.oneOrNone(consultas.usuario_por_id , iduser)
		.then(function(user){
			if(user.local.valid) 
				throw new Error(req.i18n.__('usuario_valido'));
			user.local.valid = true;
			user_ = user;
			return db.none(consultas.actualizar_local_usuario, [JSON.stringify(user.local) , user._id]);
		})
		.then(function(){
			req.logIn(user_, function(error){
				req.flash('success', req.i18n.__('cuenta_confirmada'));
				return res.redirect('/app/perfil');
			});
		})
		.catch(function(error){
			error.status = 500;
			next(error);
			//res.status(500).send(error);
		});
};

/*
 * Perfil visible de los usuarios
 */
Usuario.prototype.perfil_visible = function(req, res, next){
	// Perfil que será visible para los demás usuarios
	// solo podemos acceder si estamos loggeados
	var usuario, denuncias_user;

	if(!req.query.id) {
		var error = new Error(req.i18n.__('faltan_parametros') + ': id');
		error.status = 500;
		return next(error);
	};

	db.oneOrNone(consultas.perfil_otro_usuario, req.query.id)
		.then(function(usuario_){
			if(!usuario_) throw new Error(req.i18n.__('parametro_no_valido') + ' id = ' + req.params.id_usuario);
			usuario = usuario_;
			console.log('usuario :' + JSON.stringify(usuario));
			return db.any(consultas.obtener_denuncias_usuario, usuario._id);
		})
		.then (function(denuncias_user_){
			denuncias_user = denuncias_user_;
			denuncias_user.forEach(function(denuncia){
				denuncia.geometria = denuncia.geometria_pt || denuncia.geometria_li || denuncia.geometria_po;
			});
			return db.any(consultas.usuario_denuncias_favoritas, usuario._id);
		})
		.then(function(denuncias_fav){
			denuncias_fav.forEach(function(denuncia){
				denuncia.geometria = denuncia.geometria_pt || denuncia.geometria_li || denuncia.geometria_po;
			});
			res.render('perfil_otro.jade', {user_otro: usuario, denuncias : denuncias_user, denuncias_fav : denuncias_fav});
		})
		.catch(function(error){
			error.status = 500;
			next(error);
			//res.status(500).send(error);
		});
	
};

/*
 * Renderizamos el Perfil del usuario
 */
Usuario.prototype.mi_perfil = function(req, res, next) {
	// En cualquier otro caso renderizamos
	console.log('mi PErfil');
	var denuncias_user = [];
	db.query(consultas.obtener_denuncias_usuario, req.user._id)
		.then (function(denuncias){
			
			denuncias.forEach(function(denuncia){
				denuncia.geometria = denuncia.geometria_pt || denuncia.geometria_li || denuncia.geometria_po;
			});

			denuncias_user = denuncias;
			return db.any(consultas.usuario_denuncias_favoritas, req.user._id);
		})
		.then (function(denuncias_fav){
			denuncias_fav.forEach(function(denuncia){
				denuncia.geometria = denuncia.geometria_pt || denuncia.geometria_li || denuncia.geometria_po;
			});
			console.log('rendering profile...');
			//res.send('perfil');
			res.render('profile', { misDenuncias: denuncias_user, denuncias_fav : denuncias_fav });
		})
		.catch (function(error){
			error.status = 500;
			next(error);
			//res.status(500).send(error.toString());
		});

};

Usuario.prototype.pagina_actualizar_perfil = function(req, res){
	res.render('editarPerfil.jade', {user: req.user});
}

Usuario.prototype.actualizar_perfil = function(req, res){
	
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
		return res.status(500).send({error: true, msg: req.i18n.__('contraseña_parametros')});
	}
	
	if(nueva_password != nueva_password_rep){
		return res.status(500).send({error: true, msg: req.i18n.__('contraseña_coincidir')});	
	}
	else if(nueva_password){
		user.password = User.generateHash(nueva_password);
		changedPassword = true;
	}
	
	if(nombre && !validator.isLength(nombre, 2, 10)){
		return res.status(500).send({error: true, msg: req.i18n.__('nombre_params')});
	}
	else if(nombre){
		user.profile.nombre = nombre;
		changedProfile = true;
	}
	
	if(apellidos && !validator.isLength(apellidos, 3, 15)){
		return res.status(500).send({error: true, msg: req.i18n.__('apellidos_params')});

	}
	else if(apellidos){
		user.profile.apellidos = apellidos;
		changedProfile = true;
	}
	
	if(nombre_usuario && !validator.isLength(nombre_usuario, 5, 15)){
		return res.status(500).send({error: true, msg: req.i18n.__('nombre_usuario_params')});

	}
	
	var aux = nombre_usuario || '1';
	db.query(consultas.usuario_por_username, aux)
		.then(function(usuario){
			if(usuario[0]) throw new Error(req.i18n.__('nombre_usuario_existe'));
			user.profile.username = nombre_usuario || user.profile.username;
			return db.none(consultas.actualizar_info_usuario, [user.password, JSON.stringify(user.profile), user._id]);
		})
		.then(function(){
			res.send({error: false, msg: req.i18n.__('perfil_actualizado')});
		})
		.catch(function(error){
			res.status(500).send({error: true, msg: error.toString()})
		});
	
}

Usuario.prototype.cambiar_imagen_perfil = function(req, res) {
	
	multer_imagen_perfil(req, res, function(error){
		
		if(error) return res.status(500).send({type: 'error', msg: req.i18n.__('error_subiendo_archivo') + error});
		
		// La imagen se subió correctamente
		//console.log('imagen subida guay ' + JSON.stringify(req.files.file));
		var file = req.file;
		var extension = path.extname(file.path);
		
		console.log('patttth ' + file.path);
		
		if(!extension.match(formatsAllowed)){
			// Eliminamos la imagen subida si no es de uno de los formatos permitidos
			fs.unlink(path.join('./public/files/usuarios', path.basename(file.path)), function(error_){
				if(error_) console.log('error unlink ' + error_);
				return res.status(413).send({type: 'error', msg: req.i18n.__('formato_no_permitido')});
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
	        			msg: req.i18n.__('imagen_perfil_actualizada'),
	        			path: user.profile.picture
	        		});
	        	})
	        	.catch(function(error){
	        		res.status(500).send(error);
	        	});
		}
		
	});
		
};


Usuario.prototype.pagina_editar_localizacion = function(req,res, next){
	
	db.one(consultas.obtener_loc_preferida, req.user._id)
		.then(function(location){
			res.render('editarLoc.jade', {loc_pref: location.loc_pref});
		})
		.catch(function(error){
			error.status = 500;
			next(error);
			//res.status(500).send(error);
		});
}

Usuario.prototype.editar_localizacion = function(req, res){
	
	var wkt = req.body.wkt;
	
	console.log(wkt + " WKTTTTTTTTTTTTT");
	
	dbCarto.one(consultas.comprobar_geometria(wkt), wkt)
		.then(function(check_geom){
			if(!check_geom.st_contains) throw new Error(req.i18n.__('denuncia_geometria_dentro'));
			
			return db.none(consultas.actualizar_loc_pref, [wkt, req.body.distancia, req.user._id]);
			
		})
		.then(function(){
			res.send({error: false, msg: req.i18n.__('ubicacion_preferida_actualizada')});
		})
		.catch(function(error){
			res.status(500).send({error: true , msg : error.toString()});
		});
	
}

Usuario.prototype.editar_distancia_aviso = function(req, res){
	
}

Usuario.prototype.cambiar_imagen_perfil_gravatar = function(req, res){
	
	var user = req.user;
	var sub = '/files/usuarios';
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
			res.send({msg: req.i18n.__('imagen_perfil_actualizada'), path: req.body.gravatar});
		})
		.catch(function(error){
			res.status(500).send(error);
		});	
}




module.exports = Usuario;