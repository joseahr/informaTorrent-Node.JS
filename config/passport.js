var LocalStrategy    = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var TwitterStrategy  = require('passport-twitter').Strategy;

var User       = require('../app/models/user');

var configAuth = require('./auth'); // use this one for testing

var validator = require('validator');

module.exports = function(passport) {

    // Serializa al usuario para la sesión
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    // Deserializa el usuario
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
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
            User.findOne({ 'local.email' :  email }, function(err, user) {
                // Si hay algún error, devolvemos el error.
                if (err)
                    return done(err);

                // Si no se encuentra usuario
                if (!user)
                    return done(null, false, req.flash('error', 'Usuario no encontrado.'));

                if (!user.validPassword(password))
                    return done(null, false, req.flash('error', 'Contraseña erronea.'));
                //Usuario no confirmado su correo
                if (user.local.valid == false) return done(null, false, req.flash('error', 'Revisa tu correo: ' + email + ' y activa tu cuenta.'));

                // Si todo es correcto devolvemos el usuario
                else
                    return done(null, user);
            });
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
        // asíncrono
        process.nextTick(function() {
            var repass = req.body.repassword;
            var name = req.body.name;
            var surname = req.body.surname;
            var username = req.body.username;
            var validUserName = true;
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
            
            User.findOne({ 'profile.username' :  username }, function(err_, user_) {
            	if(user_) validUserName = false;
            	if(err_) return done(null, false, req.flash('error', err_));
            });
        	// Comprobamos que no haya otro username igual
        	if(!validUserName)
        		return done(null, false, req.flash('error', 'El nombre de usuario escogido ya existe.'));
        	
            // Si el usuario no está conectado
            if (!req.user) {
                User.findOne({ 'local.email' :  email }, function(err, user) {
                    if (err)
                        return done(err);
                    // Comprobamos que no exista un usuario con ese email
                    if (user) {
                        return done(null, false, req.flash('error', 'Ya existe un usuario con el e-mail ' + email + '.'));
                    } else {

                        // Creamos una instancia de User
                        var newUser            = new User();

                        newUser.local.email    = email;
                        newUser.local.password = newUser.generateHash(password);
                        newUser.local.valid    = false;
                        newUser.profile.nombre = name;
                        newUser.profile.apellidos = surname;
                        newUser.profile.username = username;
                        newUser.profile.picture = newUser.gravatar(300, email);
                        //Rellenamos datos
                        
                        newUser.sendEmailConfirmation(newUser);
                        // Enviamos email de confirmación de cuenta
                        
                        // Finalmente guardamos el usuario en la bdd
                        newUser.save(function(err) {
                            if (err)
                                return done(err);
                            return done(null, false, req.flash('success', 'Usuario creado correctamente, revise su correo: ' + email + ' para activar su nueva cuenta.'));
                        });
                    }
                });
            // Si el usuario está conectado pero no tiene cuenta local...
            }else {
                // usuario loggeado. Ignorar Registro.
                return done(null, req.user);
            }
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

                User.findOne({ 'facebook.id' : profile.id }, function(err, user) {
                    if (err)
                        return done(err);

                    if (user) {
                    	//console.log(profile);
                        // Si hay user.facebook.id pero no user.facebook.token (El usuario tuvo cuentas linqueadas pero las borró)
                        if (!user.facebook.token) {
                            user.facebook.token = token;
                            user.facebook.name  = profile.displayName;
                            user.facebook.email = (profile.emails[0].value || '').toLowerCase();
                            user.facebook.photo = profile.photos[0].value;

                            user.save(function(err) {
                                if (err)
                                    return done(err);
                                    
                                return done(null, user);
                            });
                        }

                        return done(null, user); // Usuario encontrado, devuelve el usuario
                    } else {
                        // Si no existe usuario
                    	//Para el acceso a nuestra aplicación es obligatorio tener cuenta local
                        return done(null, false, req.flash('error', 'Debes crear una cuenta local y lincar tu cuenta de facebook para poder acceder desde facebook.'));

                    }
                });

            } else {
                // Usuario existente y loggeado. Lincamos sus cuentas.
                var user            = req.user; 

                user.facebook.id    = profile.id;
                user.facebook.token = token;
                user.facebook.name  = profile.displayName;
                user.facebook.email = (profile.emails[0].value || '').toLowerCase();
                user.facebook.photo = profile.photos[0].value;
                
                user.save(function(err) {
                    if (err)
                        return done(err);
                        
                    return done(null, user);
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

                User.findOne({ 'twitter.id' : profile.id }, function(err, user) {
                    if (err)
                        return done(err);

                    if (user) {
                        // existe user.twitter.id pero no user.token.id (Usuario tuvo cuentas linqueadas que borró)
                        if (!user.twitter.token) {
                            user.twitter.token       = token;
                            user.twitter.username    = profile.username;
                            user.twitter.displayName = profile.displayName;
                            user.twitter.photo       = profile.photos[0].value;
                            
                            user.save(function(err) {
                                if (err)
                                    return done(err);
                                    
                                return done(null, user);
                            });
                        }

                        return done(null, user); // Usuario encontrado, devolvemos el usuario
                    } else {
                        // Si no existe usuario
                    	//Para el acceso a nuestra aplicación es obligatorio tener cuenta local
                        return done(null, false, req.flash('error', 'Debes crear una cuenta local y lincar tu cuenta de twitter para poder acceder desde twitter.'));

                    }
                });

            } else {
                // Usuario existe y está loggeado, linqueamos sus cuentas
                var user                 = req.user; 

                user.twitter.id          = profile.id;
                user.twitter.token       = token;
                user.twitter.username    = profile.username;
                user.twitter.displayName = profile.displayName;
                user.twitter.photo = profile.photos[0].value;
                
                user.save(function(err) {
                    if (err)
                        return done(err);
                        
                    return done(null, user);
                });
            }

        });

    }));
};
