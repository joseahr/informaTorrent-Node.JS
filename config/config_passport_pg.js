var LocalStrategy    = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var TwitterStrategy  = require('passport-twitter').Strategy;

var User       = require('../app/models/user_pg');

var configAuth = require('./auth');

var validator = require('validator');


module.exports = function(passport, db, consultas) {

    // Serializa al usuario para la sesión
    passport.serializeUser(function(user, done) {
        done(null, user._id);
    });

    // Deserializa el usuario
    passport.deserializeUser(function(id, done) {
    	
    	db.one(consultas.usuario_por_id, id)
    		.then(function(user){
    			done(null, user);
    		})
    		.catch(function(error){
    			console.log(error.toString());
    			done(error);
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

        db.oneOrNone(consultas.usuario_por_email_o_username, email)
        	.then(function(user){
        		if(!user) return done(null, false, req.flash('error', 'Usuario no encontrado.'));
        		
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
        		
        	})
        	.catch(function(error){
        		console.log(error.toString());
        		done(error);
        	});

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
        
        db.oneOrNone(consultas.usuario_por_username, username)
        	.then(function(user){
        		if(user) {
        			req.flash('error', 'El nombre de usuario escogido está siendo usado por otro usuario.');
        			throw new Error('Usuario username inválido');
        		}

        		return db.oneOrNone(consultas.usuario_por_email, email)
        		
        	})
    		.then(function(user_mismo_email){
    			if(user_mismo_email){
        			req.flash('error', 'El email escogido está siendo usado por otro usuario.');
        			throw new Error('Usuario mail no válido');    				
    			}
    			
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
                
                return db.one(consultas.crear_usuario, 
                	[newUser.password, JSON.stringify(newUser.local), JSON.stringify(newUser.profile)]);
    			
    		})
    		.then(function(user){
    			User.sendEmailConfirmation(user);
                return done(null, false, req.flash('success', 'Usuario creado correctamente, revise su correo: ' + email + ' para activar su nueva cuenta.'));
    		})
        	.catch(function(error){
        		console.log(error.toString());
        		done(error);
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
    	
    	if(!req.user) {
    		db.oneOrNone(consultas.usuario_por_id_facebook, profile.id)
    			.then(function(user){
    				if(!user){
                        req.flash('error', 'Debes crear una cuenta local y lincar tu cuenta de facebook para poder acceder desde facebook.');
                        throw new Error('Debes crear cuenta local');
    				}
    				
                    return done(null, user); // Usuario encontrado, devuelve el usuario
    				
    			})
    			.catch(function(error){
    				console.log(error.toString());
    				done(error);
    			});
    	}
    	else {
            // Usuario existente y loggeado. Lincamos sus cuentas.
            var user            = req.user; 

            user.facebook = {};
            
            user.facebook.id    = profile.id;
            user.facebook.token = token;
            user.facebook.name  = profile.displayName;
            user.facebook.email = (profile.emails[0].value || '').toLowerCase();
            user.facebook.photo = profile.photos[0].value;
            
            db.oneOrNone(consultas.usuario_por_id_facebook, profile.id)
            	.then(function(user){
            		if(user){
            			req.flash('error', 'Ya existe un usuario usando esta cuenta de facebook.');
            			throw new Error('ya existe usuario con esta cuenta de facebook');
            		}
            		
            		return db.none(consultas.set_facebook_usuario, 
            			[JSON.stringify(user.facebook), user._id]);
            		
            	})
            	.then(function(){
    				req.user = user;
    				return done(null, user);
            	})
            	.catch(function(error){
            		console.log(error.toString());
            		done(error);
            	});
            
    	}

    }));
    
    //TWITTER STRATEGY
    passport.use(new TwitterStrategy({

        consumerKey     : configAuth.twitterAuth.consumerKey,
        consumerSecret  : configAuth.twitterAuth.consumerSecret,
        callbackURL     : configAuth.twitterAuth.callbackURL,
        passReqToCallback : true 

    },
    function(req, token, tokenSecret, profile, done) {

    	if(!req.user) {
    		db.oneOrNone(consultas.usuario_por_id_twitter, profile.id)
    			.then(function(user){
    				if(!user){
                        req.flash('error', 'Debes crear una cuenta local y lincar tu cuenta de facebook para poder acceder desde facebook.');
                        throw new Error('Debes crear cuenta local');
    				}
    				
                    return done(null, user); // Usuario encontrado, devuelve el usuario
    				
    			})
    			.catch(function(error){
    				console.log(error.toString());
    				done(error);
    			});
    	}
    	else {
            // Usuario existente y loggeado. Lincamos sus cuentas.
            var user                 = req.user; 
            user.twitter = {};
            user.twitter.id          = profile.id;
            user.twitter.token       = token;
            user.twitter.username    = profile.username;
            user.twitter.displayName = profile.displayName;
            user.twitter.photo = profile.photos[0].value;
            
            db.oneOrNone(consultas.usuario_por_id_twitter, profile.id)
            	.then(function(user){
            		if(user){
            			req.flash('error', 'Ya existe un usuario usando esta cuenta de facebook.');
            			throw new Error('ya existe usuario con esta cuenta de facebook');
            		}
            		
            		return db.none(consultas.set_twitter_usuario, 
            			[JSON.stringify(user.twitter), user._id]);
            		
            	})
            	.then(function(){
    				req.user = user;
    				return done(null, user);
            	})
            	.catch(function(error){
            		console.log(error.toString());
            		done(error);
            	});
            
    	}

    }));
};
