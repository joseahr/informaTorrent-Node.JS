/**
 * Controlador Passport
 */
var passport = require('passport'); // Passport
var pg; // Modelo de Usuario
var bcrypt;
var async;
var crypto;
var nodemailer;
var contHome;
var validator;
var connectionString = "postgres://jose:jose@localhost/denuncias";
var User;
var client;
/*
 * Constructor
 */

function Passport(passport_, pg_, bcrypt_, async_, crypto_, nodemailer_, contHome_, validator_, User_){
	//passport = passport_;
	pg = pg_;
	bcrypt = bcrypt_;
	async = async_;
	crypto = crypto_;
	nodemailer = nodemailer_;
	contHome = contHome_;
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
		return res.redirect('/app/login#scroll')
	}
	res.render('cambiarPass.jade');
};

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
		
		client = new pg.Client(connectionString);
		client.connect(function(e){
			if (e) console.error('error conectando a la bddd', e);
			else {
				client.query("select * from usuarios where local ->> 'email' ='" + req.user.local.email + "'",
				function(err, result){
					if(err) {
						client.end();
						console.error('error consultando', err);
					}
					else {
						if (result.rows.length == 0) {
							// Mostrar mensaje de error, No debe pasar
						}
						else {
							var user = result.rows[0];
							
							if(!User.validPassword(password_original, user.local.password)){ 
								client.end();
				    			req.flash('error', 'Contraseña errónea');
				    			done(new Error());
				    			
				    		}
				    		else if (req.body.password_nueva != req.body.password_nueva_repeat){
				    			client.end();
						          req.flash('error', 'Las contraseñas deben coincidir');
						          done(new Error());
					        }
				    		else{
				    			user.local.password = User.generateHash(password_nueva);
				    			
				    			client.query("UPDATE usuarios SET local='" + JSON.stringify(user.local) + "' " +
				    			"where local ->> 'email' ='" + user.local.email + "'", 
				    			function(error, result){
				    				client.end();
				    				if (!error){
				                        req.flash('success', 'Contraseña actualizada correctamente');
				                        done(null, '');
				    				}
				    				done(new Error());
				    			});
				    			
				    		}					
							
						}
					}
				});
			}
		});
	}, function(ok, done){
		res.redirect('/app/profile');
		done(null);
	}],
	function(err){
		res.redirect('back');
	});
};


/*
 * POST reset/:token
 */
Passport.prototype.postResetToken = function(req, res) {
	  async.waterfall([
	    function(done) {
	    	
	    	client = new pg.Client(connectionString);
	    	client.connect(function(error){
	    		if(error) console.error('error conectando a la bdd', error);
	    		else {
	    			client.query("select * from usuarios where " +
	    			"resetPasswordToken='" + req.params.token + "' and " +
	    			"resetPasswordExpires > CURRENT_TIMESTAMP",
	    			function(e, result){
	    				if (e) {
	    					client.end();
	    					console.error('error consultando', e);
	    				}
	    				else {
	    					if (result.rows.length == 0){
	    						// Mensaje de error
	    						client.end();
	    				        req.flash('error', 'La URL solicitada no es válida o ha expirado.');
	    				        var Error = new Error('0');
	    				        done(Error);
	    					}
	    					else {
	    						var user = result.rows[0];
	    				        if (req.body.password != req.body.passwordRepeat){
	    				        	client.end();
	    					        req.flash('error', 'Las contraseñas deben coincidir.');
	    					        var Error = new Error('0');
	  	    				        done(Error);
	    				        }
	    				        
	    				        user.local.password = User.generateHash(req.body.password);
	    				        user.resetPasswordToken = undefined;
	    				        user.resetPasswordExpires = undefined;
	    				        
	    				        client.query("UPDATE usuarios SET (local,resetPasswordToken,resetPasswordExpires) " +
	    				        "= ('" + JSON.stringify(user.local) + "', NULL, NULL) " +
	    				        "WHERE _id = '" + user._id +"'",
	    				        function(error, result1){
				        			client.end();
				        			if (error) console.error('error consultando', error);
				        			else {
				        				req.logIn(user, function(err) {
				        					done(error, user);
				        			    });
				        			}
	    				        	
	    				        });
	    				        
	    						
	    					}
	    				}
	    			});
	    		}
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
		  if (err)
			  return res.redirect('back');

	  });
}
/*
 * GET reset/:token
 */
Passport.prototype.getResetToken = function(req, res) {
	
	client = new pg.Client(connectionString);
	client.connect(function(error){
		if(error) console.error('error conectando a la bdd', error);
		else {
			client.query("select * from usuarios where " +
			"resetPasswordToken='" + req.params.token + "' and " +
			"resetPasswordExpires > CURRENT_TIMESTAMP",
			function(e, result){
				client.end();
				if (error) {
					return console.error('error consultando', error)
				}
				if (result.rows.length == 0){
					req.flash('error', 'La URL solicitada no es válida o ha expirado.');
				    return res.redirect('/app/forgot#scroll')
				}
				else {
					contHome.datos(req, res, 'indexapp', 'cambiarPass', {token: req.params.token});
				}
			});
		}
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
    	
    	client = new pg.Client(connectionString);
    	client.connect(function(e){
			if (e) done(e);
			else {
				client.query("select * from usuarios where local ->> 'email' ='" + req.body.email + "'",
				function(err, result){
					if(err) {
						client.end();
						console.error('error consultando', err);
					}
					else {
						if (result.rows.length == 0) {
							client.end();
					        req.flash('error', 'No existe ninguna cuenta con el e-mail ' + req.body.email);
					        done(new Error());
						}
						else {
							var user = result.rows[0];
							client.query("update usuarios SET (resetPasswordToken, resetPasswordExpires) " +
									"= ('" + token + "', CURRENT_TIMESTAMP + interval '1 hour') " +
									"WHERE _id='" + user._id + "'", 
							function(error, result1){
								client.end();
								done(error, token, user);
							});
						}
					}
				});
			}
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
    return res.redirect('/app/forgot#scroll');
  });
}

/*
 * Desconectar - Deslinkear cuenta TW Asociada
 */
Passport.prototype.unlinkTW = function(req, res) {
    var user           = req.user;
    
    client = new pg.Client(connectionString);
    client.connect(function(error){
    	if (error) return console.error('error conectando la bdd', error);
    	else {
    		client.query("UPDATE usuarios SET twitter = NULL " + 
    		"WHERE _id ='" + user._id + "'", 
    		function(e, result){
    			client.end();
    			if (e) return console.error('error consultando', e);
    			else {
    				res.redirect('/app/profile#scroll');
    			}
    		});
    	}
    });
}


/*
 * Desconectar - Deslinkear cuenta FB Asociada
 */
Passport.prototype.unlinkFB = function(req, res) {
    var user            = req.user;
    
    client = new pg.Client(connectionString);
    client.connect(function(error){
    	if (error) return console.error('error conectando la bdd', error);
    	else {
    		client.query("UPDATE usuarios SET facebook = NULL " + 
    		"WHERE _id ='" + user._id + "'", 
    		function(e, result){
    			client.end();
    			if (e) return console.error('error consultando', e);
    			else {
    				res.redirect('/app/profile#scroll');
    			}
    		});
    	}
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
	
	client = new pg.Client(connectionString);
    client.connect(function(error){
    	if (error) return console.error('error conectando la bdd', error);
    	else {
    		client.query("select * from usuarios where _id='" + req.params.id_usuario + "'", 
    		function(e, result){
    			client.end();
    			if (e) return console.error('error consultando', e);
    			else {
    				if (result.rows.length == 0)
    					res.send(404);
    				else {
    					var user = result.rows[0];
    					res.send(user);
    				}
    			}
    		});
    	}
    });
	
}

/*
 * Confirmar Usuario Ruta: /app/confirmar/:id_usuario
 */

Passport.prototype.confirmUser = function(req, res){
	var iduser = req.params.idUsuario;
	var msg = '';
	
	client = new pg.Client(connectionString);
    client.connect(function(error){
    	if (error) return console.error('error conectando la bdd', error);
    	else {
    		client.query("select * from usuarios where _id='" + iduser + "'", 
    		function(e, result){
    			if (e) {
    				client.end();
    				return console.error('error consultando1', e);
    			}
    			else {
    				if (result.rows.length == 0){
    					client.end();
    					res.send(404);
    				}
    				else {
    					var user = result.rows[0];
    					
    					if(user.local.valid == false){
    						user.local.valid = true;
    						
    						client.query("update usuarios SET local = '" + 
    						JSON.stringify(user.local) + "' where _id='" + user._id + "'", 
    						function(e_, res_){
    							client.end();
    							if (e_) console.error('error consultando2', e_);
    							else {
    								req.logIn(user, function(error){
    									console.log(error + ' error autenticando')
    									req.flash('success', 'Tu cuenta se ha confirmado correctamente.');
    									return res.redirect('/app/profile');
    								});
    							}
    						});
    						
    					}
    					else{
    						client.end();
    						req.flash('error', 'Error confirmando tu cuenta, ya está activada.'); 
    						return res.redirect('/app');
    					}
    					
    				}
    			}
    		});
    	}
    });
};

module.exports = Passport;