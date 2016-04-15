/**
 * Rutas Usuario
 */
var passport = require('passport'); // Passport

var multer = require('../../config/multer.js');
var multer_imagen_perfil = multer.crear_multer('./public/files/usuarios', multer.filename_perfil_img).single('file');

var usuarioModel = require('../models/usuario.js');
	usuarioModel = new usuarioModel();
var denunciaModel = require('../models/denuncia.js');
	denunciaModel = new denunciaModel();

var isLoggedIn = require('../middlewares/logged.js');

var router = require('express').Router();

var validator = require('validator');
var path = require('path');
var fs = require('fs');
var formatsAllowed = 'png|jpg|jpeg|gif';

router.use(require('../middlewares/datos.js'));
router.use(require('../middlewares/usuario.js'));

// Ruta /perfil
router.route('/perfil')
// Página perfil de usuario -- OK
.get(isLoggedIn, function(req, res) {
	// En cualquier otro caso renderizamos
	//console.log('error', req.user._id);
	usuarioModel.get_denuncias(req.user._id, function(error, denuncias){
		if(error)
			next(error);
		else
			usuarioModel.get_denuncias_fav(req.user._id, function(error, denuncias_fav){
				if(error)
					return next(error);
				else
					return res.render('usuarios/perfil', { misDenuncias: denuncias, denuncias_fav : denuncias_fav });
			});
	});
})
// Método para editar perfil -- OK
.put(isLoggedIn, function(req, res){
	
	var user = req.user;
	
	var nombre_usuario = req.body.username;
	var nombre = req.body.nombre;
	var apellidos = req.body.apellidos;
	
	if(nombre && !validator.isLength(nombre, 3, 15))
		return res.status(500).send({type : 'error', msg : req.i18n.__('nombre_params')});
	else if(nombre)
		user.profile.nombre = nombre;
	
	if(apellidos && !validator.isLength(apellidos, 5, 25))
		return res.status(500).send({type : 'error', msg : req.i18n.__('apellidos_params')});
	else if(apellidos)
		user.profile.apellidos = apellidos;
	
	if(nombre_usuario && !validator.isLength(nombre_usuario, 5, 15))
		return res.status(500).send({type : 'error', msg : req.i18n.__('nombre_usuario_params')});

	var nombre_usuario_aux = nombre_usuario || '1';

	usuarioModel.find_by_username(nombre_usuario_aux, function(error, user_){
		if(!error && user_)
			return res.status(500).json({type : 'error', msg : req.i18n.__('nombre_usuario_existe')});

		user.profile.username = nombre_usuario || user.profile.username;

		usuarioModel.update(user, function(error, result){
			if(error)
				return res.status(500).json(error);
			return res.json({type : 'success', msg : req.i18n.__('perfil_actualizado')});
		});
	});
});

// Página para editar perfil -- OK
router.get('/perfil/actualizar', isLoggedIn, function(req, res){
	res.render('usuarios/editar_perfil', {user: req.user});
});

// Método put cambiar imagen perfil gravatar -- OK
router.put('/perfil/avatar/gravatar', function(req, res){
	var sub = '/files/usuarios';
	if(req.user.profile.picture.indexOf(sub) > -1){
    	fs.unlink(path.join('./public', req.user.profile.picture), function(err){
    		//console.log('imagen anterior eliminada');
    		if(err) console.log(err); // No debería ocurrir
    	});
	}
	req.user.profile.picture = usuarioModel.gravatar(req.user.local.email);
	usuarioModel.cambiar_imagen_perfil(req.user, function(error, path){
		if(error) 
			return res.status(500).json(error);
		return res.json({type: 'success', msg: req.i18n.__('imagen_perfil_actualizada'), path : path});
	});
});

// Método PUT actualizar imagen de perfil -- OK
router.put('/perfil/avatar', function(req, res) {
	multer_imagen_perfil(req, res, function(error){
		if(error) 
			return res.status(500).send({type: 'error', msg: req.i18n.__('error_subiendo_archivo') + ': ' + error.toString()});
		// La imagen se subió correctamente
		//console.log('imagen subida guay ' + JSON.stringify(req.files.file));
		var file = req.file;
		var extension = path.extname(file.path);
		var sub = '/files/usuarios';
		
		if(!extension.match(formatsAllowed)){
			// Eliminamos la imagen subida si no es de uno de los formatos permitidos
			fs.unlink(path.join('./public/files/usuarios', path.basename(file.path)), function(error_){
				if(error_) console.log('error unlink ' + error_);
				return res.status(413).json({type: 'error', msg: req.i18n.__('formato_no_permitido')});
			});
		}
		else {
		    if(req.user.profile.picture.indexOf(sub) > -1){
		    	console.log('eliminando imagen anterior');
		    	// Tenía una imagen subida
		    	fs.unlink(path.join('./public', req.user.profile.picture), function(err){
		    		if(err) console.log(err); // No debería ocurrir
		    	});
		    }
			req.user.profile.picture = path.join('/files/usuarios', path.basename(file.path));
			usuarioModel.cambiar_imagen_perfil(req.user, function(error, path_){
				if(error) 
					return res.status(500).json(error);
				return res.json({type: 'success', msg: req.i18n.__('imagen_perfil_actualizada'), path : path_});
			});
		}
	});
});

// Ruta /perfil/localizacion
router.route('/perfil/localizacion')
// Página para actualizar localización -- OK
.get(isLoggedIn, function(req,res, next){
	usuarioModel.get_localizacion_preferida(req.user._id, function(error, location){
		if(error)
			return next(error);
		res.render('usuarios/editar_loc', {type : 'success', location_pref : location});
	});
})
// Método PUT actualizar localización -- OK
.put(isLoggedIn, function(req, res){

	if(!req.body.wkt || !req.body.distancia)
		return res.status(500).json({type : 'error', msg : req.i18n.__('faltan_parametros')});

	denunciaModel.comprobar_geometria(req.body.wkt, function(error, geom_check){
		if(error)
			return res.status(500).json(error);
		// Si la geometría no está en torrent 
		if (geom_check.st_contains == false)
			return res.status(500).json({type : 'error', msg : req.i18n.__('denuncia_geometria_dentro')});

		usuarioModel.update_localizacion_preferida({
			wkt : req.body.wkt,
			distancia : req.body.distancia,
			id_usuario : req.user._id
		}, function(error, result){
			if(error)
				return res.status(500).json(error);
			return res.json({type : 'success', msg : req.i18n.__('ubicacion_preferida_actualizada')});
		});
	});
});

// Rutas para cambiar la contraseña
router.route('/perfil/password')
// Página para cambiar -- OK
.get(isLoggedIn, function(req, res){
	//console.log('/perfil/password', req.user.local.valid);
	if(!req.user || !req.user.local.valid)
		return next({type : 'error', msg : req.i18n.__('debe_estar_logeado')});
	res.render('usuarios/editar_pass', {usuario_cambiar : req.user});
})
// Método PUT para actualizar la contraseña -- OK
.put(isLoggedIn, function(req, res){
	if (req.body.password_nueva != req.body.password_nueva_repeat)
		return res.status(500).json({type : 'error', msg : req.i18n.__('contraseña_coincidir')});
	if(!validator.isLength(req.body.password_nueva, 5, 20))
		return res.status(500).json({type : 'error', msg : 'LA contraseña debe tener entre 5 y 20 caracteres'});
	//console.log('bodyyyy', req.body);
	usuarioModel.find_by_email(req.user.local.email, function(error, user){
		if(error)
			return res.status(500).json(error);
		if(!usuarioModel.validPassword(req.body.password_original, user.password))
			return res.status(500).json({type : 'error', msg : req.i18n.__('contraseña_coincide_original')});
		// Actualizamos contraseña
		usuarioModel.cambiar_pass(req.body.password_nueva, req.user._id, function(error, result){
			if(error)
				return res.status(500).json(error);
			return res.json({type : 'success', msg : req.i18n.__('contraseña_actualizada')});
		});
	});
});

// Ruta /app/usuarios/olvidaste
router.route('/olvidaste')
// Página olvidaste -- OK
.get(function(req, res){
	res.redirect('/app#olvidaste');
})
// Método POST olvidaste -- OK
.post(function(req, res, next) {
	//console.log(req.body.email);
	if(!req.body.email){
		//console.log('noemail');
		return res.status(500).json({type : 'error', msg : req.i18n.__('parametro_no_valido') + ': email'});
	}

	usuarioModel.create_random_token(req.body.email, function(error, token){
		//console.log(error);
		if(error)
			return res.status(500).json(error);
		// Opciones email
		var opciones_email = {
			email : req.body.email,
			subject: req.i18n.__('email_actualizar_contraseña_aviso_titulo'),
			text: req.i18n.__('email_actualizar_contraseña_aviso_contenido_1') + 
            	'http://' + req.headers.host + '/app/usuarios/resetear/' + token + '\n\n' +
            	req.i18n.__('email_actualizar_contraseña_aviso_contenido_2')
		};
		// Enviar email
		usuarioModel.enviar_email(opciones_email, function(error){
			return res.json({type : 'success', msg : req.i18n.__('email_enviado') + req.body.email + req.i18n.__('email_instrucciones')});		
		});
	});
});

//Desconectar - Deslinkear cuenta TW Asociada
router.get('/unlink/twitter', function(req, res) {
	usuarioModel.unlink_twitter(req.user._id, function(error){
		if(error)
			return res.status(500).json(error);
		return res.json({type : 'success', msg : req.i18n.__('cuenta_de') + ' Twitter ' + req.i18n.__('deslinqueada')});		
	});
});


//Desconectar - Deslinkear cuenta FB Asociada
router.get('/unlink/facebook', function(req, res, next) {
	usuarioModel.unlink_facebook(req.user._id, function(error){
		if(error)
			return res.status(500).json(error);
		return res.json({type : 'success', msg : req.i18n.__('cuenta_de') + ' Facebook ' + req.i18n.__('deslinqueada')});				
	});
});

//Conectar una cuenta de Twitter con otra existente -- Callback
router.get('/conectar/twitter/callback', passport.authorize('twitter', {
    successRedirect : '/app/usuarios/perfil',
    failureRedirect : '/app/usuarios/perfil'
}));

//Conectar una cuenta de Twitter con otra existente
router.get('/conectar/twitter', passport.authorize('twitter', { scope : 'email' }));

//Conectar una cuenta de Facebook con otra existente -- Callback
router.get('/conectar/facebook/callback', passport.authorize('facebook', {
    successRedirect : '/app/usuarios/perfil',
    failureRedirect : '/app/usuarios/perfil'
}));

//Conectar una cuenta de Facebook a otra existente
router.get('/conectar/facebook', passport.authorize('facebook', { scope : 'email' }));

//Twitter Auth -- Callback de Twitter una vez autentificcados -- OK
router.get('/auth/twitter/callback', passport.authenticate('twitter', {
    successRedirect : '/app/usuarios/perfil',
    failureRedirect : '/app#iniciar'
}));

//Twitter Auth -- Twitter renderiza la página de inicio de Sesión -- OK
router.get('/auth/twitter', passport.authenticate('twitter', { scope : 'email' }));

//Facebook Auth -- Callback de Facebook una vez autentificados
router.get('/auth/facebook/callback', passport.authenticate('facebook', {
    successRedirect : '/app/usuarios/perfil',
    failureRedirect : '/app#iniciar'
}));

//Facebook Auth -- Facebook Renderiza la página de Inicio de Sesión
router.get('/auth/facebook', passport.authenticate('facebook', { scope : 'email' }));

// Rutas iniciar sesión
router.route('/iniciar')
// Página iniciar sesión -- OK
.get(function(req, res) {
	res.redirect('/app#iniciar');
})
// Método POST iniciar sesión -- OK
.post(passport.authenticate('local-login', {
    successRedirect : '/app/usuarios/perfil', 
    failureRedirect : '/app#iniciar', 
    failureFlash : true 
}));

// Rutas registrarse
router.route('/registrarse')
// Página registrarse -- OK
.get(function(req, res) {
	res.redirect('/app#registrarse');
})
// Método POST registrarse -- OK
.post(passport.authenticate('local-signup', {
    successRedirect : '/app', 
    failureRedirect : '/app',
    failureFlash : true
}));

// Cerrar sesión -- OK
router.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/app');
});

// Perfil visible de un usuario -- OK
router.get('/:id_usuario', function(req, res, next){
	// Perfil que será visible para los demás usuarios
	// solo podemos acceder si estamos loggeados

	// Obtenemos la info del usuario
	usuarioModel.perfil_visible(req.params.id_usuario, function(error, user){
		if(error)
			return next({type : 'error', msg : req.i18n.__('parametro_no_valido') + ': id_usuario = ' + req.params.id_usuario});
		// Obtenemos las denuncias del usuario
		usuarioModel.get_denuncias(req.params.id_usuario, function(error, denuncias){
			if(error)
				return next(error);
			// Obtenemos las denuncias favoritas del usuario
			usuarioModel.get_denuncias_fav(req.params.id_usuario, function(error, denuncias_fav){
				if(error)
					return next(error);
				// Renderizamos la página
				res.render('usuarios/perfil_visible', {user_otro: user, denuncias : denuncias, denuncias_fav : denuncias_fav});
			})
		});
	});
});

// Ruta para confirmar la cuenta de un usuario -- OK
router.get('/:id_usuario/confirmar', function(req, res, next){
	usuarioModel.find_by_id(req.params.id_usuario, function(error, user){
		if(error)
			return next({type : 'error', msg : 'No existe usuario'});
		if (user.local.valid)
			return next({type : 'error', msg : req.i18n.__('usuario_valido')});

		usuarioModel.confirmar(user, function(error, user){
			if(error)
				return res.status(500).json(error);
			// Logeamos al usuario
			req.logIn(user, function(error){
				req.flash('success', req.i18n.__('cuenta_confirmada'));
				return res.redirect('/app/usuarios/perfil');
				//return res.json({type : 'success', msg : req.i18n.__('cuenta_confirmada')});
			});
		});
	});
});

// Middleware que se ejecuta para todas las rutas con el parámetro token
router.param('token', function(req, res, next, token){
	usuarioModel.find_by_pass_token(req.params.token, function(error, user){
		if(error && req.method.toLowerCase() == 'put')
			return res.status(500).json({type : 'error', msg : req.i18n.__('url_no_valida_expirada')});
		else if(error)
			return next({type : 'error', msg : req.i18n.__('url_no_valida_expirada')});
		req.user_token = user;
		next();
	});
});
// Ruta reset token
router.route('/resetear/:token')
// Página reset token -- OK
.get(function(req, res, next) {
	res.render('usuarios/cambiar_pass_token', {token: req.params.token, usuario_cambiar: req.user_token});
})
// Método PUT actualizar contraseña mediante token -- OK
.put(function(req, res, next) {
    if (req.body.password != req.body.passwordRepeat)
		return res.status(500).json({type : 'error', msg : req.i18n.__('contraseña_coincidir')});
	// Validar tamaño contraseña
	if(!validator.isLength(req.body.password, 5, 20))
		return res.status(500).json({type : 'error', msg : 'LA contraseña debe tener entre 5 y 20 caracteres'});

	var user = req.user_token;
	user.password = req.body.password;
	usuarioModel.cambiar_pass_token(req.body.password, user._id,  function(error){
		if (error)
			return res.status(500).json(error);
		// Iniciamos sesión
		req.logIn(user, function(error) {
			// Opciones email
			var opciones_email = {
				email : user.local.email,
				subject: req.i18n.__('email_actualizar_contraseña_titulo'),
				text:  req.i18n.__('email_actualizar_contraseña_contenido_1') + user.local.email + req.i18n.__('email_actualizar_contraseña_contenido_2')
			};
			// Enviamos emai
			usuarioModel.enviar_email(opciones_email, function(error, result){
				return res.json({type : 'success', msg : req.i18n.__('contraseña_actualizada')});
			});
	    });
	});
});

module.exports = router;