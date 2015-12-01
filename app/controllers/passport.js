/**
 * Controlador Passport
 */
var passport = require('passport'); // Passport
var User; // Modelo de Usuario
var bcrypt;
var async;
var crypto;
var nodemailer;
var contHome;
var validator;


/*
 * Constructor
 */

function Passport(passport_, User_, bcrypt_, async_, crypto_, nodemailer_, contHome_, validator_){
	//passport = passport_;
	User = User_;
	bcrypt = bcrypt_;
	async = async_;
	crypto = crypto_;
	nodemailer = nodemailer_;
	contHome = contHome_;
	validator = validator_;
}


/*
 * cambiarContraseña 
 */
Passport.prototype.getChangePass = function(req, res){
	if(!req.user || !req.user.local.valid)
	{
		req.flash('error', 'Debe estar loggeado');
		return res.redirect('/app/login#scroll')
	}
	res.render('cambiarPass.jade');
}

Passport.prototype.postChangePass = function(req, res){
	if(!req.user || !req.user.local.valid)
	{
		req.flash('error', 'Debe estar loggeado');
		return res.redirect('/app/login#scroll')
	}
	async.waterfall([function(done){
		var password_original = req.body.password_original;
		var password_nueva = req.body.password_nueva;
		var password_nueva_repeat = req.body.password_nueva_repeat;
		
	    User.findOne({ '_id': req.user._id}, function(err, user) {
	    	if(err) done(err, user);
	    	
	    	if(user){
	    		if(!user.validPassword(password_original)){
	    			req.flash('error', 'Contraseña errónea');
	    			return res.redirect('back');
	    		}
	    		else if (req.body.password_nueva != req.body.password_nueva_repeat){
			          req.flash('error', 'Las contraseñas deben coincidir');
			          return res.redirect('/app/changePass');
		        }
	    		else{
	    			user.local.password = user.generateHash(password_nueva);
	    			user.save(function(err) {
                        if (err)
                            return done(err, user);
                        req.flash('success', 'Contraseña actualizada correctamente');
                        return res.redirect('/app/profile');
                    });
	    		}
	    		
	    	}
	    	
	    });

		
		
		
	}],
	function(err){
		
	}
	);
}


/*
 * POST reset/:token
 */
Passport.prototype.postResetToken = function(req, res) {
	  async.waterfall([
	    function(done) {
	      User.findOne({ 'local.resetPasswordToken': req.params.token, 'local.resetPasswordExpires': { $gt: Date.now() } }, function(err, user) {
	        if (!user) {
	          req.flash('error', 'La URL solicitada no es válida o ha expirado.');
	          return res.redirect('/app/forgot#scroll')
	        }
	        if (req.body.password != req.body.passwordRepeat){
		          req.flash('error', 'Las contraseñas deben coincidir.');
		          return res.redirect('/app/reset/' + req.params.token + '#scroll');
	        }
	        var newUser = new User();
	        
	        user.local.password = newUser.generateHash(req.body.password);
	        user.local.resetPasswordToken = undefined;
	        user.local.resetPasswordExpires = undefined;

	        user.save(function(err) {
	          req.logIn(user, function(err) {
	            done(err, user);
	          });
	        });
	      });
	    },
	    function(user, done) {
	      var smtpTransport = nodemailer.createTransport('SMTP', {
	        service: 'gmail',
	        auth: {
	          user: 'joherro123',
	          pass: '321:Hermo'
	        }
	      });
	      var mailOptions = {
	        to: user.local.email,
	        from: 'joherro123@gmail.com',
	        subject: 'informaTorrent! - Contraseña Actualizada',
	        text: 'Querido usuario,\n\n' +
	          'Este mensaje se ha generado automáticamente para avisarte de que la contraseña de la cuenta vinculada al e-mail ' + user.email + ' ha sido actualizada satisfactoriamente.\n Gracias por usar nuestra aplicación!'
	      };
	      smtpTransport.sendMail(mailOptions, function(err) {
	        req.flash('success', '¡Genial! Tu contraseña se actualizó correctamente.');
	        res.redirect('/app#scroll');
	        done(err);
	      });
	    }
	  ], 
	  function(err) {
		  contHome.datos(req, res, 'indexapp', 'cambiarPass', {token : req.params.token});
	  });
}
/*
 * GET reset/:token
 */
Passport.prototype.getResetToken = function(req, res) {
  User.findOne({ 'local.resetPasswordToken': req.params.token, 'local.resetPasswordExpires': { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      req.flash('error', 'La URL solicitada no es válida o ha expirado.');
      return res.redirect('/app/forgot#scroll')
    }
    else
    	contHome.datos(req, res, 'indexapp', 'cambiarPass', {token: req.params.token});
  });
}

/*
 * GET /app/forgot
 */
Passport.prototype.getForgot = function(req, res){
	contHome.datos(req, res, 'indexapp', 'forgot');
}

/*
 * POST Forgot -- Envía un mail para cambiar contraseña
 */
Passport.prototype.postForgot = function(req, res, next) {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
    	console.log(req.body.email);
      User.findOne({ 'local.email': req.body.email }, function(err, user) {
        if (!user) {
          req.flash('error', 'No existe ninguna cuenta con el e-mail ' + req.body.email);
          return res.redirect('/app/forgot#scroll');
        }

        user.local.resetPasswordToken = token;
        user.local.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var smtpTransport = nodemailer.createTransport('SMTP', {
        service: 'Gmail',
        auth: {
          user: 'joherro123@gmail.com',
          pass: '321:Hermo'
        }
      });
      var mailOptions = {
        to: user.local.email,
        from: 'joherro123@gmail.com',
        subject: 'informaTorrent! - Recupera tu contraseña',
        text: 'Si has recibido este correo es porque usted (u otra persona) ha olvidado sus credenciales.\n\n' +
          'Si desea completar el proceso para cambiar su contraseña, por favor, diríjase al siguiente enlace:\n\n' +
          'http://' + req.headers.host + '/app/reset/' + token + '\n\n' +
          'Si por el contrario usted no solicitó esta acción, ignore el mensaje y su contraseña seguirá siendo la misma.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('info', 'Se ha enviado un e-mail a ' + user.local.email + ' con las instrucciones convenientes.');
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/app/forgot#scroll');
  });
}

/*
 * Desconectar - Deslinkear cuenta TW Asociada
 */
Passport.prototype.unlinkTW = function(req, res) {
    var user           = req.user;
    user.twitter.token = undefined;
    user.save(function(err) {
        res.redirect('/app/profile#scroll');
    });
}


/*
 * Desconectar - Deslinkear cuenta FB Asociada
 */
Passport.prototype.unlinkFB = function(req, res) {
    var user            = req.user;
    user.facebook.token = undefined;
    user.save(function(err) {
        res.redirect('/app/profile#scroll');
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
    successRedirect : '/app/profile#scroll',
    failureRedirect : '/app/profile#scroll'
});

/*
 * Conectar una cuenta de Twitter con otra existente
 */
Passport.prototype.connectTW = passport.authorize('twitter', { scope : 'email' });

/*
 * Conectar una cuenta de Facebook con otra existente -- Callback
 */
Passport.prototype.connectFBCallback = passport.authorize('facebook', {
    successRedirect : '/app/profile#scroll',
    failureRedirect : '/app/profile#scroll'
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
    successRedirect : '/app/profile#scroll',
    failureRedirect : '/app/login#scroll'
})

/*
 * Twitter Auth -- Twitter renderiza la página de inicio de Sesión
 */
Passport.prototype.getTWAuth = passport.authenticate('twitter', { scope : 'email' });

/*
 *  Facebook Auth -- Callback de Facebook una vez autentificados
 */
Passport.prototype.getFBCallback = passport.authenticate('facebook', {
    successRedirect : '/app/profile#scroll',
    failureRedirect : '/app/login#scroll'
});

/*
 * Facebook Auth -- Facebook Renderiza la página de Inicio de Sesión
 */
Passport.prototype.getFBAuth = passport.authenticate('facebook', { scope : 'email' });

/*
 * Post Login
 */
Passport.prototype.postLogin = passport.authenticate('local-login', {
    successRedirect : '/app/profile#scroll', // redirect to the secure profile section
    failureRedirect : '/app/login#scroll', // redirect back to the signup page if there is an error
    failureFlash : true // allow flash messages
});
/*
 * POST SignUp
 */
Passport.prototype.postSignUp = passport.authenticate('local-signup', {
    successRedirect : '/app#scroll', // redirect to the secure profile section
    failureRedirect : '/app/signup#scroll', // redirect back to the signup page if there is an error
    failureFlash : true // allow flash messages
});

/*
 * Renderizamos SignUp
 */
Passport.prototype.getSignUp = function(req, res) {
	contHome.datos(req, res, 'indexapp.jade', 'signup');
}

/*
 * Renderizamos LogIn
 */
Passport.prototype.getLogin = function(req, res) {
	contHome.datos(req, res, 'indexapp.jade', 'login');
}


/*
 * Cerramos la sesión del usuario
 */
Passport.prototype.logout = function(req, res) {
    req.logout();
    res.redirect('/app#scroll');
}

/*
 * Perfil visible de los usuarios
 */
Passport.prototype.getUserProfile = function(req, res){
	// Perfil que será visible para los demás usuarios
	// solo podemos acceder si estamos loggeados
	if(!req.user) res.redirect('/app');
	User.findOne({ '_id' :  req.params.id_usuario }, function(err, user) {
		if (err) res.send(404);
		else res.send(user);
	});
	
}

/*
 * Función para saber si estamos autentificados
 */
//Passport.prototype.isLoggedIn = function(req, res, next) {
//	console.log('is logged in?');
//    if (req.isAuthenticated()){
//    	var error = new Error('Debes estar loggeado para acceder');
//    	error.status = 401; // Unauthorized
//        next(error);
//    }
////
////    res.redirect('/app');
//}

/*
 * Confirmar Usuario Ruta: /app/confirmar/:id_usuario TODO :confirm_token
 */

Passport.prototype.confirmUser = function(req, res){
	var iduser = req.params.idUsuario;
	var msg = '';
	User.findOne({ '_id' : iduser }, function(err, user) {
		if(err){req.flash('error', 'Usuario no encontrado'); res.redirect('/app');}
		console.log(user.local.valid)
		if(!user.local.valid){
			user.local.valid = true;
			user.save(function(error){
				if(error){
					req.flash('error', 'Error confirmando tu cuenta, inténtelo de nuevo.'); 
					return res.redirect('/app');
				}
				 
				req.logIn(user, function(error){
					req.flash('success', 'Tu cuenta se ha confirmado correctamente.');
					return res.redirect('/app/profile');
				});
				
			});
			
		}
		else{
			req.flash('error', 'Error confirmando tu cuenta, ya está activada.'); 
			return res.redirect('/app');
		}
	});
};

module.exports = Passport;

