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
var config = require('../../config/mailer.js')
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
		req.flash('error', 'Debe estar loggeado');
		return res.redirect('/app#iniciar')
	}
	res.render('cambiarPass.jade');
};

Usuario.prototype.post_cambiar_pass = function(req, res){
	if(!req.user || !req.user.local.valid)
	{
		req.flash('error', 'Debe estar loggeado');
		return res.redirect('/app#iniciar')
	}
	
	if (req.body.password_nueva != req.body.password_nueva_repeat){
		req.flash('error', 'Los campos "contraseña" y "repetir contraseña" deben tener el mismo valor.');
		return res.redirect('back');
	}
	
	var password_original = req.body.password_original;
	var password_nueva = req.body.password_nueva;
	var password_nueva_repeat = req.body.password_nueva_repeat;
	
	db.one(consultas.usuario_por_email, req.user.local.email)
		.then(function(user){
			console.log('password_original: ' + password_original);
			console.log('password_original_verdadera: ' + user.password);
			if(!User.validPassword(password_original, user.password))
				throw new Error('La contraseña introducida no coincide con la original');
			user.local.password = User.generateHash(password_nueva);
			return db.none(consultas.actualizar_local_usuario, [JSON.stringify(user.local), user._id]);
		})
		.then(function(){
			req.flash('success', 'La contraseña se actualizó correctamente');
		})
		.catch(function(error){
			res.status(500).send(error);
		});
};


/*
 * POST reset/:token
 */
Usuario.prototype.cambiar_pass_token = function(req, res) {
	
    if (req.body.password != req.body.passwordRepeat){
        req.flash('error', 'Las contraseñas deben coincidir.');
        return res.redirect('back');
    }
	
    var user_;
	db.oneOrNone(consultas.usuario_por_password_reset_token, req.params.token)
		.then(function(user){
			user_ = user;
			if(!user)
				throw new Error('La URL solicitada no es válida o ha expirado.');
			db.none(consultas.actualizar_password_reset_token, [User.generateHash(req.body.password), user._id]);
		})
		.then(function(){
			req.flash('Contraseña actualizada correctamente.');
			req.logIn(user_, function(err) {
				if(err) throw err;
				enviar_email(user_.local.email)
		    });
		})
		.catch(function(error){
			res.status(500).send(error.toString());
		});
	
		var enviar_email = function(email){
		
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
				subject: 'informaTorrent! - Contraseña Actualizada',
				text: 'Querido usuario,\n\n' +
					'Este mensaje se ha generado automáticamente para avisarte de que la contraseña de la cuenta vinculada al e-mail ' + email + ' ha sido actualizada satisfactoriamente.\n Gracias por usar nuestra aplicación!'
			};
			smtpTransport.sendMail(mailOptions, function(err) {
				return res.redirect('/app');
			});
		}
};

/*
 * GET reset/:token
 */
Usuario.prototype.get_cambiar_pass_token = function(req, res) {
	
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
			res.status(500).send(error);
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
		req.flash('error', 'Debe introducir un e-mail válido.');
		res.redirect('back');
	}

    crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        var user_;
        db.oneOrNone(consultas.usuario_por_email_o_username, req.body.email.toLowerCase())
        	.then(function(user){
        		if(!user) {
        			req.flash('error', 'No existe ninguna cuenta con el username o e-mail ' + req.body.email);
        			return res.redirect('back');
        		}
        		user_ = user;
        		db.none(consultas.set_token_1_hora , [token, user._id]);
        		
        	})
        	.then(function(){
        		enviar_email(token, user_.local.email);
        	})
        	.catch(function(error){
        		res.status(500).send(error);
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
                subject: 'informaTorrent! - Recupera tu contraseña',
                text: 'Si has recibido este correo es porque usted (u otra persona) ha olvidado sus credenciales.\n\n' +
                  'Si desea completar el proceso para cambiar su contraseña, por favor, diríjase al siguiente enlace:\n\n' +
                  'http://' + req.headers.host + '/app/reset/' + token + '\n\n' +
                  'Si por el contrario usted no solicitó esta acción, ignore el mensaje y su contraseña seguirá siendo la misma.\n'
              };
              smtpTransport.sendMail(mailOptions, function(err) {
                req.flash('info', 'Se ha enviado un e-mail a ' + email + ' con las instrucciones convenientes.');
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
    		req.flash('success', 'Cuenta de Twitter deslinqueada correctamente.');
    		res.redirect('/app/perfil');
    	})
    	.catch(function(error){
    		res.status(500).send(error);
    	});
};


/*
 * Desconectar - Deslinkear cuenta FB Asociada
 */
Usuario.prototype.unlink_facebook = function(req, res) {
    var user           = req.user;
    
    db.none(consultas.deslincar_facebook, user._id)
    	.then(function(){
    		req.flash('success', 'Cuenta de Facebook deslinqueada correctamente.');
    		res.redirect('/app/perfil');
    	})
    	.catch(function(error){
    		res.status(500).send(error);
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

Usuario.prototype.confirmar = function(req, res){
	var iduser = req.params.idUsuario;
	var user_;
	db.oneOrNone(consultas.usuario_por_id , iduser)
		.then(function(user){
			if(user.local.valid) 
				throw new Error('El usuario ya es válido.');
			user.local.valid = true;
			user_ = user;
			return db.none(consultas.actualizar_local_usuario, [JSON.stringify(user.local) , user._id]);
		})
		.then(function(){
			req.logIn(user_, function(error){
				req.flash('success', 'Tu cuenta se ha confirmado correctamente.');
				return res.redirect('/app/perfil');
			});
		})
		.catch(function(error){
			res.status(500).send(error);
		});
};

/*
 * Perfil visible de los usuarios
 */
Usuario.prototype.perfil_visible = function(req, res){
	// Perfil que será visible para los demás usuarios
	// solo podemos acceder si estamos loggeados
	var usuario, denuncias_user;

	if(!req.query.id) return res.status(500).send('Debe introducir el parámetro id');

	db.oneOrNone(consultas.perfil_otro_usuario, req.query.id)
		.then(function(usuario_){
			if(!usuario_) throw new Error('No existe el usuario con id = ' + req.params.id_usuario);
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
			res.status(500).send(error);
		});
	
};

/*
 * Renderizamos el Perfil del usuario
 */
Usuario.prototype.mi_perfil = function(req, res) {
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
			res.render('profile', { misDenuncias: denuncias_user, denuncias_fav : denuncias_fav });
		})
		.catch (function(error){
			res.status(500);
			res.send(error.toString());
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
	db.query(consultas.usuario_por_username, aux)
		.then(function(usuario){
			if(usuario[0]) throw new Error('El nombre de usuario ya existe');
			user.profile.username = nombre_usuario || user.profile.username;
			return db.none(consultas.actualizar_info_usuario, [user.password, JSON.stringify(user.profile), user._id]);
		})
		.then(function(){
			res.status(200).send({error: false, msg: 'Perfil actualizado correctamente'});
		})
		.catch(function(error){
			res.send({error: true, msg: error.toString()})
		});
	
}



var formatsAllowed = 'png|jpg|jpeg|gif'; // Podríamos poner más

Usuario.prototype.cambiar_imagen_perfil = function(req, res) {
	
	multer_imagen_perfil(req, res, function(error){
		
		if(error) return res.status(500).send({type: 'error', msg: 'Error subiendo archivo. ' + error});
		
		// La imagen se subió correctamente
		//console.log('imagen subida guay ' + JSON.stringify(req.files.file));
		var file = req.file;
		var extension = path.extname(file.path);
		
		console.log('patttth ' + file.path);
		
		if(!extension.match(formatsAllowed)){
			// Eliminamos la imagen subida si no es de uno de los formatos permitidos
			fs.unlink(path.join('./public/files/usuarios', path.basename(file.path)), function(error_){
				if(error_) console.log('error unlink ' + error_);
				return res.status(413).send({type: 'error', msg: 'Formato no permitido'});
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
	        			msg: 'Imagen de Perfil cambiada correctamente.',
	        			path: user.profile.picture
	        		});
	        	})
	        	.catch(function(error){
	        		res.status(500).send(error);
	        	});
		}
		
	});
		
};


Usuario.prototype.pagina_editar_localizacion = function(req,res){
	
	db.one(consultas.obtener_loc_preferida, req.user._id)
		.then(function(location){
			res.render('editarLoc.jade', {loc_pref: location.loc_pref});
		})
		.catch(function(error){
			res.status(500).send(error);
		});
}

Usuario.prototype.editar_localizacion = function(req, res){
	
	var wkt = req.body.wkt;
	
	console.log(wkt + " WKTTTTTTTTTTTTT");
	
	dbCarto.one(consultas.comprobar_geometria(wkt), wkt)
		.then(function(check_geom){
			if(!check_geom.st_contains) throw new Error('La geometría debe estar en torrent');
			
			return db.none(consultas.actualizar_loc_pref, [wkt, req.body.distancia, req.user._id]);
			
		})
		.then(function(){
			res.send({error: false, msg: 'Ubicación preferida cambiada correctamente'});
		})
		.catch(function(error){
			res.status(500).send({error: true , msg : error.toString()});
		});
	
}

Usuario.prototype.cambiar_imagen_perfil_gravatar = function(req, res){
	
	var user = req.user;
	var sub = '/files/usuarios'
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
			res.send({msg: 'Imagen de perfil actualizada correctamente', path: req.body.gravatar});
		})
		.catch(function(error){
			res.status(500).send(error);
		});	
}




module.exports = Usuario;