var LocalStrategy    = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var TwitterStrategy  = require('passport-twitter').Strategy;

var User       = require('../app/models/user_pg');

var configAuth = require('./auth');

var validator = require('validator');

var connectionString = "postgres://jose:jose@localhost/denuncias";

var pg = require('pg');

module.exports = function(passport) {

    // Serializa al usuario para la sesión
    passport.serializeUser(function(user, done) {
        done(null, user._id);
    });

    // Deserializa el usuario
    passport.deserializeUser(function(id, done) {
    	var result;
    	var client = new pg.Client(connectionString);
    	client.connect(function(error){
    		if (error) return console.error('error consultandoPP', error);
    		else {
    			console.log(id);
    			client.query("select * from usuarios where _id ='" + id + "'", 
    			function(e, result_){
    				if (e){
    					client.end();
    					return console.error('error ', e);
    				}
    				client.end();
    				if (result_.rows.length == 0){
    					done(new Error());
    				}
    				else {
    					var user = result_.rows[0];
    					done(e, user);
    				}
    			});
    		}
    	});
    });
    
    // LOGIN LOCAL
    passport.use('local-login', new LocalStrategy({
        // por defecto 'LocalStrategy' utiliza username y password, lo cambiamos para usar el email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // Nos permite pasar el request al callback (saber si el usuario está logeado)
    },
    function(req, email, password, done) {
        if (email)
            email = email.toLowerCase(); // Usamos minúsculas para evitar case-sensitive

        // asíncrono
        process.nextTick(function() {
        	
        	var client = new pg.Client(connectionString);
        	client.connect(function(error){
        		if (error) {
        			done(error);
        		}
        		else {
        			client.query("select * from usuarios where local ->> 'email' ='" + email + "'", 
        			function(e, result){
        				client.end();
        				if (e) {
        					done(e);
        				}
        				if (result.rows.length == 0){
        					// Mostrar mensaje error
        					return done(null, false, req.flash('error', 'Usuario no encontrado.'));
        				}
        				else {
        					var user = result.rows[0]; // usuario
        					
        	                if (!User.validPassword(password, user.password)) {
        	                    return done(null, false, req.flash('error', 'Contraseña erronea.'));
        	                }
        	                //Usuario no confirmado su correo
        	                if (user.local.valid == false){
        	                	return done(null, false, req.flash('error', 'Revisa tu correo: ' + email + ' y activa tu cuenta.'));
        	                }
        	                // Si todo es correcto devolvemos el usuario
        	                else {
        	                	req.user = user;
        	                    return done(null, user);
        	                }
        				}
        			});
        		}
        	});
        }); // PROCESS NEXTTICK

    }));
    
    // REGISTRO LOCAL
    passport.use('local-signup', new LocalStrategy({
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true 
    },
    function(req, email, password, done) {
        if (email)
            email = email.toLowerCase();
        console.log(req.body);
        // asíncrono
        process.nextTick(function() {
            var repass = req.body.repassword;
            var name = req.body.name;
            var surname = req.body.surname;
            var username = req.body.username;

            //Datos del perfil de usuario
            console.log('variables ' + repass + ' ' + name + ' ' + surname + ' ' + ' ' + username );
            
            if(!validator.isEmail(email))
                return done(null, false, req.flash('error', 'Introduce un e-mail válido.'));
            if(!validator.isLength(password, 5, 20))
                return done(null, false, req.flash('error', 'La contraseña debe tener entre 5 y 20 caracteres.'));
            if(!validator.isLength(name, 3, 15))
                return done(null, false, req.flash('error', 'El nombre debe tener entre 3 y 15 caracteres.'));
            if(!validator.isLength(surname, 5, 25))	
                return done(null, false, req.flash('error', 'El campo de apellidos debe tener entre 5 y 25 caracteres'));
            if(!validator.isLength(username, 5, 15))	
                return done(null, false, req.flash('error', 'El nombre de usuario debe tener entre 5 y 25 caracteres')); 
            if(password != repass)
                return done(null, false, req.flash('error', 'Deben de coincidir las contraseñas.'));
            // Validamos los campos
            
            var client = new pg.Client(connectionString);
        	client.connect(function(error){
        		if (error) return console.error('error consultando', error);
        		else {
        			client.query("select * from usuarios where profile ->> 'username' ='" + username + "'", 
        			function(e, result){
        				if (e) return done(null, false, req.flash('error', err_));
        				if (result.rows.length == 0){
        					// Si no existe el usuario lo creamos
        		            // Si el usuario no está conectado
        		            if (!req.user) {
        		            	
        		            	client.query("select * from usuarios where local ->> 'email' ='" + email + "'", 
        		            	function(er, result1){
        		            		if (er) {
        		            			client.end();
        		            			return done(er);
        		            		}
        		            		if (result1.rows.length == 0){
        		            			
        		            			var newUser            = {};
        		            			
        		            			newUser.local = {};
        		            			newUser.profile = {};
        		            			
        		                        newUser.local.email    = email;
        		                        newUser.password = User.generateHash(password);
        		                        newUser.local.valid    = false;
        		                        newUser.profile.nombre = name;
        		                        newUser.profile.apellidos = surname;
        		                        newUser.profile.username = username;
        		                        newUser.profile.picture = User.gravatar(email);
        		            			
        		                        //Rellenamos datos
    		             
        		                        // Enviamos email de confirmación de cuenta
        		                        
        		                        // Finalmente guardamos el usuario en la bdd
        		                        client.query("insert into usuarios(password, local, profile) " +
        		                        "VALUES ('" + newUser.password + "','" + JSON.stringify(newUser.local) + "','" + JSON.stringify(newUser.profile) + "') " +
        		                        		"returning *",
        		                        function(err_, rresult){
        		                        	client.end();
        		                        	if (err_) return done(err_);
        		                        	else {
        		                        		var user = rresult.rows[0];
        		                        		console.log('userrrrrrrrrrrrrr ->> ' + user);
        		                        		User.sendEmailConfirmation(user);
        		                        		client.end();
        		                                return done(null, false, req.flash('success', 'Usuario creado correctamente, revise su correo: ' + email + ' para activar su nueva cuenta.'));
        		                        	}
        		                        });
        		            		}
        		            		else {
        		            			// Hay un usuario con el mismo email
        		            			client.end();
        		                        return done(null, false, req.flash('error', 'Ya existe un usuario con el e-mail ' + email + '.'));
                		            }
        		            	});
        		            	
        		            // Si el usuario está conectado pero no tiene cuenta local...
        		            }else {
        		                // usuario loggeado. Ignorar Registro.
        		            	client.end();
        		                return done(null, req.user);
        		            }
        				} // Hay username ya escogido
        				else {
        					client.end();
        					return done(null, false, req.flash('error', 'El nombre de usuario escogido ya existe.'));
        				}
        			});
        		}
        	});
        });
    }));

    // FACEBOOK STRATEGY
    passport.use(new FacebookStrategy({
        clientID        : configAuth.facebookAuth.clientID,
        clientSecret    : configAuth.facebookAuth.clientSecret,
        callbackURL     : configAuth.facebookAuth.callbackURL,
        passReqToCallback : true, 
        profileFields   : ['email', 'displayName','photos']

    },
    function(req, token, refreshToken, profile, done) {
    	//console.log(profile);
        // asíncrono
        process.nextTick(function() {

            // Usuario no conectado
            if (!req.user) {
            	
            	var client = new pg.Client(connectionString);
            	client.connect(function(e_){
            		if (e_) return done(e_);
            		else {
            			client.query("select * from usuarios where facebook ->> 'id' ='" + profile.id + "'",
            			function(er_, result_){
            				if (er_) { 
            					client.end();
            					done(er_);
            				}
            				if (result_.rows.length == 0){
            					// Si no existe usuario
                            	//Para el acceso a nuestra aplicación es obligatorio tener cuenta local
            					client.end();
                                return done(null, false, req.flash('error', 'Debes crear una cuenta local y lincar tu cuenta de facebook para poder acceder desde facebook.'));            					
            				}
            				else {
            					var user = result_.rows[0];
                                if (!user.facebook.token) {
                                    client.end();
                                    return done(null, false, req.flash('error', 'No existe cuenta asociada a tu cuenta de Facebook. Crea una cuenta local y linquéalas.'));            					
                                }
                                client.end();
                                return done(null, user); // Usuario encontrado, devuelve el usuario
            				}
            			});
            		}
            	});

            } else {
                // Usuario existente y loggeado. Lincamos sus cuentas.
                var user            = req.user; 

                user.facebook = {};
                
                user.facebook.id    = profile.id;
                user.facebook.token = token;
                user.facebook.name  = profile.displayName;
                user.facebook.email = (profile.emails[0].value || '').toLowerCase();
                user.facebook.photo = profile.photos[0].value;
                
                var client = new pg.Client(connectionString);
                client.connect(function(e_){
            		if (e_) return done(e_);
            		else {
            			client.query("select * from usuarios where facebook ->> 'id' ='" + profile.id + "'",
            			function(er_, result_){
            				if (er_) {
            					client.end();
            					done(er_);
            				}
            				if (result_.rows.length == 0){
                        		client.query("update usuarios SET facebook = '" + JSON.stringify(user.facebook) + "'" +
                                "where _id = '" + user._id + "'",
                                function(e, result){
                        			client.end();
                        			if (e) return done(error);
                        			else {
                        				req.user = user;
                        				return done(null, user);
                        			}
                                });		
            				}
            				else {
            					// Si no existe usuario
                            	//Para el acceso a nuestra aplicación es obligatorio tener cuenta local
            					client.end();
                                return done(null, false, req.flash('error', 'Ya hay un usuarios usando esta cuena de facebook.'));            	
            				}
            			});
            		}
                });
                
            }
        });
    }));
    
    //TWITTER STRATEGY
    passport.use(new TwitterStrategy({

        consumerKey     : configAuth.twitterAuth.consumerKey,
        consumerSecret  : configAuth.twitterAuth.consumerSecret,
        callbackURL     : configAuth.twitterAuth.callbackURL,
        passReqToCallback : true 

    },
    function(req, token, tokenSecret, profile, done) {

        // asíncrono
        process.nextTick(function() {

            // Usuario no loggeado
            if (!req.user) {

            	var client = new pg.Client(connectionString);
            	client.connect(function(e_){
            		if (e_) return done(e_);
            		else {
            			client.query("select * from usuarios where twitter ->> 'id' ='" + profile.id + "'",
            			function(er_, result_){
            				if (er_) {
            					client.end();
            					done(er_);
            				}
            				if (result_.rows.length == 0){
            					// Si no existe usuario
                            	//Para el acceso a nuestra aplicación es obligatorio tener cuenta local
            					client.end();
                                return done(null, false, req.flash('error', 'Debes crear una cuenta local y lincar tu cuenta de twitter para poder acceder desde twitter.'));            					
            				}
            				else {
            					var user = result_.rows[0];
                                // existe user.twitter.id pero no user.token.id (Usuario tuvo cuentas linqueadas que borró)
                                if (!user.twitter.token) {
                                    client.end();
                                    return done(null, false, req.flash('error', 'No existe cuenta asociada a tu cuenta de Twitter. Crea una cuenta local y linquéalas.'));            					
                                }
                                ///
                                client.end();
                                return done(null, user); // Usuario encontrado, devuelve el usuario
            				}
            			});
            		}
            	});            	

            } else {
                // Usuario existe y está loggeado, linqueamos sus cuentas
                var user                 = req.user; 
                user.twitter = {};
                user.twitter.id          = profile.id;
                user.twitter.token       = token;
                user.twitter.username    = profile.username;
                user.twitter.displayName = profile.displayName;
                user.twitter.photo = profile.photos[0].value;
                
                var client = new pg.Client(connectionString);

                client.connect(function(e_){
            		if (e_) return done(e_);
            		else {
            			client.query("select * from usuarios where twitter ->> 'id' ='" + profile.id + "'",
            			function(er_, result_){
            				if (er_) {
            					client.end();
            					done(er_);
            				}
            				if (result_.rows.length == 0){
                        		client.query("update usuarios SET twitter = '" + JSON.stringify(user.twitter) + "'" +
                                "where _id = '" + user._id + "'",
                                function(e, result){
                        			client.end();
                        			if (e) return done(error);
                        			else {
                        				req.user = user;
                        				return done(null, user);
                        			}
                                });		
            				}
            				else {
            					// Si no existe usuario
                            	//Para el acceso a nuestra aplicación es obligatorio tener cuenta local
            					client.end();
                                return done(null, false, req.flash('error', 'Ya hay un usuarios usando esta cuena de twitter.'));            	
            				}
            			});
            		}
                });
            }

        });

    }));
};
