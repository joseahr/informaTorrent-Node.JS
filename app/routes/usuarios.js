/**
 * Rutas Usuario
 */
var passport = require('passport'); // Passport

var multer = require('../../config/multer.js');
var multer_imagen_perfil = multer.crear_multer('./public/files/usuarios', multer.filename_perfil_img).single('file');

var usuarioModel = new require('../models/usuario.js');
	usuarioModel = new usuarioModel();

var isLoggedIn = require('../middlewares/logged.js');

var router = require('express').Router();

router.use(require('../middlewares/datos.js'));
/*
 * Perfil visible de los usuarios
 */
router.get('/', function(req, res, next){
	// Perfil que será visible para los demás usuarios
	// solo podemos acceder si estamos loggeados
	if(!req.query.id) 
		return res.status(500).json({type : 'error', status : 500, msg : req.i18n.__('faltan_parametros') + ': id'});
	// Obtenemos la info del usuario
	usuarioModel.perfil_visible(req.query.id, function(error, user){
		if(error){
			if(error.i18n)
				return res.status(500).json({type : 'error', status : 500, msg : req.i18n.__(error.i18n)});
			else
				return res.status(500).json({type : 'error', status : 500, msg : error.msg});
		}
		// Obtenemos las denuncias del usuario
		usuarioModel.get_denuncias(req.query.id, function(error, denuncias){
			if(error)
				return res.status(500).json({type : 'error', status : 500, msg : error.msg});
			// Obtenemos las denuncias favoritas del usuario
			usuarioModel.get_denuncias_fav(req.query.id, function(error, denuncias_fav){
				if(error)
					return res.status(500).json({type : 'error', status : 500, msg : error.msg});
				// Renderizamos la página
				res.render('perfil_otro.jade', {user_otro: user, denuncias : denuncias, denuncias_fav : denuncias_fav});
			})
		});
	});
});

/*
 * Renderizamos el Perfil del usuario
 */
router.get('/perfil', isLoggedIn, function(req, res) {
	// En cualquier otro caso renderizamos
	console.log('error', req.user._id);
	usuarioModel.get_denuncias(req.user._id, function(error, denuncias){
		if(error)
			res.status(500).json({type : 'error', status : 500, msg : error.msg});
		else
			usuarioModel.get_denuncias_fav(req.user._id, function(error, denuncias_fav){
				if(error)
					return res.status(500).json({type : 'error', status : 500, msg : error.msg});
				else
					return res.render('profile', { misDenuncias: denuncias, denuncias_fav : denuncias_fav });
			});
	});
});

router.get('/perfil/update', isLoggedIn, function(req, res){
	res.render('editarPerfil.jade', {user: req.user});
});

router.post('/perfil/update', isLoggedIn, function(req, res){
	
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

	usuarioModel.update({
		user : user,
		new_username : nombre_usuario,
	}, function(error, result){
		if(error){
			if(error.i18n)
				return res.status(500).json({type : 'error', status : 500, msg : req.i18n.__(error.i18n)});
			else
				return res.status(500).json({type : 'error', status : 500, msg : error.msg});
		}
		return res.json({type : 'success', status : 200, msg : req.i18n.__(result.i18n)});
	});
});

/*
Cambiar avatar por gravatar
*/
router.post('/perfil/avatar/gravatar', function(req, res){
	usuarioModel.cambiar_imagen_perfil_gravatar(req.user, function(error, result){
		if(error) return res.status(500).json({type: 'error', msg: error.msg, status : 500});
		return res.json({type: 'success', msg: req.i18n(result.msg), status : 500});
	});
});

/*
Cambiar imagen de perfil
*/
router.post('/perfil/avatar/update', function(req, res) {
	
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
				return res.status(413).json({type: 'error', status : 413, msg: req.i18n.__('formato_no_permitido')});
			});
		}
		else {
			usuarioModel.cambiar_imagen_perfil({
				user : req.user, 
				file : file
			}, function(error, result){
				if(error) return res.status(500).json({type: 'error', msg: error.msg, status : 500});
				return res.json({type: 'success', msg: req.i18n.__(result.i18n), status : 200});
			});
		}
	});
});


router.get('/perfil/localizacion/update', function(req,res, next){
	
	db.one(consultas.obtener_loc_preferida, req.user._id)
	.then(function(location){
		res.render('editarLoc.jade', {loc_pref: location.loc_pref});
	})
	.catch(function(error){
		error.status = 500;
		next(error);
		//res.status(500).send(error);
	});
});

router.post('/perfil/localizacion/update', function(req, res){

	usuarioModel.update_localizacion_preferida({
		wkt : req.body.wkt,
		distancia : req.body.distancia,
		id_usuario : req.user._id
	}, function(error, result){
		if(error){
			if(error.i18n)
				return res.status(500).json({type: 'error', msg: req.i18n.__(error.i18n), status : 500});
			else
				return res.status(500).json({type: 'error', msg: error.msg, status : 500});
		}
		return res.status(500).json({type: 'success', msg: req.i18n.__(result.i18n), status : 200});
	});
});


/*
 * Página para Cambiar contraseña 
 */
router.get('/perfil/password/update', function(req, res, next){
	if(!req.user || !req.user.local.valid)
		return res.status(500).json({type : 'error', status : 500, msg : req.i18n.__('debe_estar_logeado')});
	res.render('cambiarPass.jade');
});

/*
===============================================
Método POST para cambiar contraseña
===============================================
*/
router.post('/perfil/password/update', function(req, res){
	if(!req.user || !req.user.local.valid)
		return res.status(500).json({type : 'error', status : 500, msg : req.i18n.__('debe_estar_logeado')});

	var opciones = {
		email : req.user.local.email,
		password_original : req.body.password_original,
		password_nueva : req.body.password_nueva,
		password_nueva_repeat : req.body.password_nueva_repeat
	};

	usuarioModel.cambiar_pass(opciones, function(error, result){
		if(error){
			if(error.i18n)
				return res.status(500).json({type : 'error', status : 500, msg : req.i18n.__(error.i18n)});
			else
				return res.status(500).json({type : 'error', status : 500, msg : error.msg});
		}
		else 
			return res.json({type : 'success', status : 200, msg : result.i18n});
	});
});


/*
 * POST /app/usuarios/reset/:token
 */
router.post('/reset/:token', function(req, res, next) {

	var opciones = {
		token : req.params.token,
		password : req.body.password,
		passwordRepeat : req.body.passwordRepeat
	};
	
	usuarioModel.cambiar_pass_token(opciones, function(error, user){
		if (error){
			if(error.i18n)
				return res.status(500).json({type : 'error', status : 500, msg : req.i18n.__(error.i18n)});
			else
				return res.status(500).json({type : 'error', status : 500, msg : error.msg});
		}
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
				return res.json({type : 'success', status : 200, msg : req.i18n.__('contraseña_actualizada')});
			});
	    });
	});
});

/*
 * GET /app/usuarios/reset/:token
 */
router.get('/reset/:token', function(req, res, next) {

	usuarioModel.find_by_pass_token(req.params.token, function(error, user){
		if(error){
			if(error.i18n)
				return res.status(500).json({type : 'error', status : 500, msg : req.i18n.__(error.i18n)});
			else
				return res.status(500).json({type : 'error', status : 500, msg : error.msg});
		}
		res.render('cambiarPass.jade', {token: req.params.token, usuario_cambiar: user});
	});
});

/*
 * POST Forgot -- Envía un mail para cambiar contraseña
 */
router.post('/olvidaste', function(req, res, next) {
	console.log(req.body.email);
	if(!req.body.email){
		console.log('noemail');
		return res.status(500).json({type : 'error', status : 500, msg : req.i18n.__('parametro_no_valido') + ': email'});
	}

	usuarioModel.create_random_token(req.body.email, function(error, token){
		console.log(error);
		if(error)
			return res.status(500).json({type : 'error', status : 500, msg : error.msg});
		// Opciones email
		var opciones_email = {
			email : req.body.email,
			subject: req.i18n.__('email_actualizar_contraseña_aviso_titulo'),
			text: req.i18n.__('email_actualizar_contraseña_aviso_contenido_1') + 
            	'http://' + req.headers.host + '/app/reset/' + token + '\n\n' +
            	req.i18n.__('email_actualizar_contraseña_aviso_contenido_2')
		};
		// Enviar email
		usuarioModel.enviar_email(opciones_email, function(error){
			return res.json({type : 'success', status : 200, msg : req.i18n.__('email_enviado') + req.body.email + req.i18n.__('email_instrucciones')});		
		});
	});
});

/*
 * Desconectar - Deslinkear cuenta TW Asociada
 */
router.get('/unlink/twitter', function(req, res) {
	usuarioModel.unlink_twitter(req.user._id, function(error){
		if(error)
			return res.status(500).json({type : 'error', status : 500, msg : error.msg});
		return res.json({type : 'success', status : 200, msg : req.i18n.__('cuenta_de') + ' Twitter ' + req.i18n.__('deslinqueada')});		
	});
});


/*
 * Desconectar - Deslinkear cuenta FB Asociada
 */
router.get('/unlink/facebook', function(req, res, next) {
	usuarioModel.unlink_facebook(req.user._id, function(error){
		if(error)
			return res.status(500).json({type : 'error', status : 500, msg : error.msg});
		return res.json({type : 'success', status : 200, msg : req.i18n.__('cuenta_de') + ' Facebook ' + req.i18n.__('deslinqueada')});				
	});
});

/*
 * Conectar una cuenta de Twitter con otra existente -- Callback
 */
router.get('/conectar/twitter/callback', passport.authorize('twitter', {
    successRedirect : '/app/perfil',
    failureRedirect : '/app/perfil'
}));

/*
 * Conectar una cuenta de Twitter con otra existente
 */
router.get('/conectar/twitter', passport.authorize('twitter', { scope : 'email' }));

/*
 * Conectar una cuenta de Facebook con otra existente -- Callback
 */
router.get('/conectar/facebook/callback', passport.authorize('facebook', {
    successRedirect : '/app/usuarios/perfil',
    failureRedirect : '/app/usuarios/perfil'
}));

/*
 * Conectar una cuenta de Facebook a otra existente
 */
router.get('/conectar/facebook', passport.authorize('facebook', { scope : 'email' }));

/*
 * Twitter Auth -- Callback de Twitter una vez autentificcados
 */
router.get('/auth/twitter/callback', passport.authenticate('twitter', {
    successRedirect : '/app/perfil',
    failureRedirect : '/app#iniciar'
}));

/*
 * Twitter Auth -- Twitter renderiza la página de inicio de Sesión
 */
router.get('/auth/twitter', passport.authenticate('twitter', { scope : 'email' }));

/*
 *  Facebook Auth -- Callback de Facebook una vez autentificados
 */
router.get('/auth/facebook/callback', passport.authenticate('facebook', {
    successRedirect : '/app/perfil',
    failureRedirect : '/app#iniciar'
}));

/*
 * Facebook Auth -- Facebook Renderiza la página de Inicio de Sesión
 */
router.get('/auth/facebook', passport.authenticate('facebook', { scope : 'email' }));

/*
 * Post Login
 */
router.post('/iniciar', passport.authenticate('local-login', {
    successRedirect : '/app/usuarios/perfil', 
    failureRedirect : '/app#iniciar', 
    failureFlash : true 
}));
/*
 * POST SignUp
 */
router.post('/registrarse', passport.authenticate('local-signup', {
    successRedirect : '/app', 
    failureRedirect : '/app',
    failureFlash : true
}));


/*
 * Cerramos la sesión del usuario
 */
router.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/app');
});

/*
 * GET /app/usuarios/forgot
 */
router.get('/olvidaste', function(req, res){
	res.redirect('/app#olvidaste');
});
/*
 * Renderizamos SignUp
 */
router.get('/registrarse', function(req, res) {
	res.redirect('/app#registrarse');
});
/*
 * Renderizamos LogIn
 */
router.get('/iniciar', function(req, res) {
	res.redirect('/app#iniciar');
});

/*
 * Confirmar Usuario Ruta: /app/confirmar/:id_usuario
 */
router.get('/confirmar/:idUsuario', function(req, res, next){
	usuarioModel.confirmar(req.params.idUsuario, function(error, user){
		if(error){
			if(error.i18n)
				return res.status(500).json({type : 'error', status : 500, msg : req.i18n.__(error.i18n)});
			else
				return res.status(500).json({type : 'error', status : 500, msg : error.msg});
		}
		// Logeamos al usuario
		req.logIn(user, function(error){
			return res.json({type : 'success', status : 200, msg : req.i18n.__('cuenta_confirmada')});
		});
	});
});

module.exports = router;