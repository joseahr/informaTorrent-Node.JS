var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var TwitterStrategy = require('passport-twitter').Strategy;
var usuarioModel = require('../app/models/usuario.js');
    usuarioModel = new usuarioModel();
var configAuth = require('./auth');
var validator = require('validator');
var consultas = require('../app/controllers/queries.js');

module.exports = function(passport) {

    // Serializa al usuario para la sesión
    passport.serializeUser(function(user, done) {
        done(null, user._id);
    });

    // Deserializa el usuario
    passport.deserializeUser(function(id, done) {
        usuarioModel.find_by_id(id, function(error, user){
            if(error) 
                return done(error);
            done(null, user);
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

        usuarioModel.find_by_email_or_username(email, function(error, user){
            if(error) 
                return done(null, false, req.flash('error', 'Usuario no encontrado.'));
            if(!usuarioModel.validPassword(password, user.password))
                return done(null, false, req.flash('error', 'Contraseña erronea.'));
            //Usuario no confirmado su correo
            if (user.local.valid == false)
                return done(null, false, req.flash('error', 'Revisa tu correo: ' + email + ' y activa tu cuenta.'));
            // Si todo es correcto devolvemos el usuario
            else {
                req.user = user;
                return done(null, user);
            }
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
            return done(null, false, req.flash('error', 'El nombre de usuario debe tener entre 5 y 15 caracteres')); 
        if(password != repass)
            return done(null, false, req.flash('error', 'Deben de coincidir las contraseñas.'));
        // Validamos los campos        
        usuarioModel.find_by_username(username, function(error, user_mismo_username){
            if(!error)
                // Si no hay errores es que hemos encontrado un usuario con el mismo username
                return done(null, false,req.flash('error', 'El nombre de usuario escogido está siendo usado por otro usuario.'));
            usuarioModel.find_by_email(email, function(error_, user_mismo_email){
                if(!error)
                    return done(null, false, req.flash('error', 'El email escogido está siendo usado por otro usuario.'));

                var newUser = {};
                newUser.local = {};
                newUser.profile = {};
                newUser.local.email    = email;
                newUser.password = usuarioModel.generateHash(password);
                newUser.local.valid    = false;
                newUser.profile.nombre = name;
                newUser.profile.apellidos = surname;
                newUser.profile.username = username;
                newUser.profile.picture = usuarioModel.gravatar(email);

                usuarioModel.crear(newUser.password, 
                    JSON.stringify(newUser.local), 
                    JSON.stringify(newUser.profile), 
                    function(error, user){
                        if(error)
                            return done(error);
                        usuarioModel.enviar_email({
                            to: user.local.email,
                            subject: 'informaTorrent! - Confirma tu cuenta',
                            text: 'Querido usuario,' + user.local.email + '\n Bienvenido a nuestra aplicación de denuncias.\n Confirma tu cuenta de usuario accediendo a este link:\n http://localhost:3000/app/confirmar/' + user._id 
                        }, function(error){
                            // TODO --> Notificar al usuario que se ha creado pero no enviado email
                            return done(null, false, req.flash('success', 'Usuario creado correctamente, revise su correo: ' + email + ' para activar su nueva cuenta.'));
                        });
                });
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
    	
    	if(!req.user) {
            usuarioModel.find_by_facebook_id(profile.id, function(error, user){
                if(error)
                    return done(null, false, req.flash('error', 'Debes crear una cuenta local y lincar tu cuenta de facebook para poder acceder desde facebook.'));
                return done(null, user); // Usuario encontrado, devuelve el usuario
            });
    	}
    	else {
            // Usuario existente y loggeado. Lincamos sus cuentas.
            var user = req.user; 

            user.facebook = {};
            user.facebook.id    = profile.id;
            user.facebook.token = token;
            user.facebook.name  = profile.displayName;
            user.facebook.email = (profile.emails[0].value || '').toLowerCase();
            user.facebook.photo = profile.photos[0].value;
            
            usuarioModel.find_by_facebook_id(profile.id, function(error, user_){
                if(!error)
                    return done(null, false, req.flash('error', 'Ya existe un usuario usando esta cuenta de facebook.'));
                usuarioModel.set_facebook(user._id, JSON.stringify(user.facebook), function(error){
                    if(error)
                        return done(error);
                    req.user = user;
                    return done(null, user);
                });
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
            usuarioModel.find_by_twitter_id(profile.id, function(error, user){
                if(error)
                    return done(null, false, req.flash('error', 'Debes crear una cuenta local y lincar tu cuenta de twitter para poder acceder desde twitter.'));
                return done(null, user); // Usuario encontrado, devuelve el usuario
            });
    	}
    	else {
            // Usuario existente y loggeado. Lincamos sus cuentas.
            var user = req.user; 
            user.twitter = {};
            user.twitter.id = profile.id;
            user.twitter.token = token;
            user.twitter.username = profile.username;
            user.twitter.displayName = profile.displayName;
            user.twitter.photo = profile.photos[0].value;
            
            usuarioModel.find_by_twitter_id(profile.id, function(error, user_){
                if(!error)
                    return done(null, false, req.flash('error', 'Ya existe un usuario usando esta cuenta de twitter.'));
                usuarioModel.set_twitter(user._id, JSON.stringify(user.twitter), function(error){
                    if(error)
                        return done(error);
                    req.user = user;
                    return done(null, user);
                });
            }); 
    	}

    }));
};
