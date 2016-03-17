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
/*
 * Constructor
 */

function Passport(crypto_, nodemailer_, validator_, User_, db_, q_){
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
Passport.prototype.getChangePass = function(req, res){
	if(!req.user || !req.user.local.valid)
	{
		req.flash('error', 'Debe estar loggeado');
		return res.redirect('/app#iniciar')
	}
	res.render('cambiarPass.jade');
};

Passport.prototype.postChangePass = function(req, res){
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
Passport.prototype.postResetToken = function(req, res) {
	
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
					user: 'joherro123',
					pass: '321:Hermo'
				}
			});
			var mailOptions = {
				to: email,
				from: 'joherro123@gmail.com',
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
Passport.prototype.getResetToken = function(req, res) {
	
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
Passport.prototype.getForgot = function(req, res){
	res.redirect('/app#olvidaste');
}

/*
 * POST Forgot -- Envía un mail para cambiar contraseña
 */
Passport.prototype.postForgot = function(req, res, next) {
	
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
                  user: 'joherro123@gmail.com',
                  pass: '321:Hermo'
                }
              });
              var mailOptions = {
                to: email,
                from: 'joherro123@gmail.com',
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
Passport.prototype.unlinkTW = function(req, res) {
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
Passport.prototype.unlinkFB = function(req, res) {
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
//Passport.prototype.unlinkLocal = function(req, res) {
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
Passport.prototype.connectTWCallback = passport.authorize('twitter', {
    successRedirect : '/app/perfil',
    failureRedirect : '/app/perfil'
});

/*
 * Conectar una cuenta de Twitter con otra existente
 */
Passport.prototype.connectTW = passport.authorize('twitter', { scope : 'email' });

/*
 * Conectar una cuenta de Facebook con otra existente -- Callback
 */
Passport.prototype.connectFBCallback = passport.authorize('facebook', {
    successRedirect : '/app/perfil',
    failureRedirect : '/app/perfil'
});

/*
 * Conectar una cuenta de Facebook a otra existente
 */
Passport.prototype.connectFB = passport.authorize('facebook', { scope : 'email' });

/*
 * Lincar una Cuenta Local a otra existente
 */
//Passport.prototype.connectLocal = passport.authenticate('local-signup', {
//    successRedirect : '/app/profile', // redirect to the secure profile section
//    failureRedirect : '/app/profile', // redirect back to the signup page if there is an error
//    failureFlash : true // allow flash messages
//})

/*
 * Twitter Auth -- Callback de Twitter una vez autentificcados
 */
Passport.prototype.getTWCallback = passport.authenticate('twitter', {
    successRedirect : '/app/perfil',
    failureRedirect : '/app#iniciar'
})

/*
 * Twitter Auth -- Twitter renderiza la página de inicio de Sesión
 */
Passport.prototype.getTWAuth = passport.authenticate('twitter', { scope : 'email' });

/*
 *  Facebook Auth -- Callback de Facebook una vez autentificados
 */
Passport.prototype.getFBCallback = passport.authenticate('facebook', {
    successRedirect : '/app/perfil',
    failureRedirect : '/app#iniciar'
});

/*
 * Facebook Auth -- Facebook Renderiza la página de Inicio de Sesión
 */
Passport.prototype.getFBAuth = passport.authenticate('facebook', { scope : 'email' });

/*
 * Post Login
 */
Passport.prototype.postLogin = passport.authenticate('local-login', {
    successRedirect : '/app/perfil', // redirect to the secure profile section
    failureRedirect : '/app#iniciar', // redirect back to the signup page if there is an error
    failureFlash : true // allow flash messages
});
/*
 * POST SignUp
 */
Passport.prototype.postSignUp = passport.authenticate('local-signup', {
    successRedirect : '/app', // redirect to the secure profile section
    failureRedirect : '/app', // redirect back to the signup page if there is an error
    failureFlash : true // allow flash messages
});

/*
 * Renderizamos SignUp
 */
Passport.prototype.getSignUp = function(req, res) {
	res.redirect('/app#registrarse');
}

/*
 * Renderizamos LogIn
 */
Passport.prototype.getLogin = function(req, res) {
	res.redirect('/app#iniciar');
}


/*
 * Cerramos la sesión del usuario
 */
Passport.prototype.logout = function(req, res) {
    req.logout();
    res.redirect('/app');
}

/*
 * Perfil visible de los usuarios
 */
Passport.prototype.getUserProfile = function(req, res){
	// Perfil que será visible para los demás usuarios
	// solo podemos acceder si estamos loggeados
	
	db.oneOrNone(consultas.perfil_otro_usuario, req.params.id_usuario)
		.then(function(usuario){
			if(!usuario) throw new Error('No existe el usuario con id = ' + req.params.id_usuario);
			res.render('perfil_otro.jade', {user_otro: usuario});
		})
		.catch(function(error){
			res.status(500).send(error);
		});
	
};

/*
 * Confirmar Usuario Ruta: /app/confirmar/:id_usuario
 */

Passport.prototype.confirmUser = function(req, res){
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

module.exports = Passport;