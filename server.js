/*
 * server.js
 */

// Set Up
var http = require('http'); // Módulo http
var morgan = require('morgan'); // Loggea cada petición en consola
var express  = require('express'); // Framework Express
var app      = express(); // Aplicación empaquetada en express
var port     = process.env.PORT || 3000; // Puerto usado por nuestra aplicación
var passport = require('passport'); // Passport - Sistema de Logins
var flash    = require('connect-flash'); // Flash - Emitir mensajes al request


var promiseLib = require('bluebird'); // Librería de Promises - Especificación ES6
var configDB = require('./config/database.js'); // Datos de la BDD

// Opciones de la bdd - Recibe la librería de Promises
var pg_options = {
	promiseLib : promiseLib
};

var pgp = require('pg-promise')(pg_options); // Objeto pg-promise

var db = pgp(configDB.denuncias); // Objeto bdd - denuncias
var dbCarto = pgp(configDB.carto); // Objeto bbd - cartografía

var queries = require('./app/controllers/queries.js'); // Consultas

// Hace logs en la consola de la consultas, errores, conexiones...
require('pg-monitor').attach(pg_options, ['query', 'error', 'connect', 'disconnect', 'task', 'transact']);

var fs = require('fs'); // Módulo fs
var path = require('path'); // Módulo path

var cookieParser = require('cookie-parser'); // Módulo cookieParser - Se encarga de manejar las cookies
var session      = require('express-session'); // Módulo de sesiones de express
var bodyParser = require('body-parser'); // BodyParser - Se encarga de parsear el cuerpo de las peticiones

var i18n = require('i18n-2'); // i18n
var locales = require(__dirname + '/app/controllers/locales.js'); // traducciones
var multer = require('multer');

//process.on('uncaughtException', function (err) {
//    console.log(err);
//});

//http.globalAgent.maxSockets = Infinity;

// Express

app.use(morgan('dev')); // Log cada request en la consola
app.use(cookieParser()); // Usa el cookie parser de express
app.use(bodyParser.json()); // Body JSON
app.use(bodyParser.urlencoded({extended: true})); // Codifica la URL
app.use(express.static(path.join(__dirname, 'public'))); // Servir archivos estáticos
app.set('view engine', 'jade'); // Motor de renderizado de vista - Jade
app.set('port', process.env.PORT || 3000); // Que use el puerto 3000

//app.use(require('connect-multiparty')());

// Necesarios para passport
app.use(session({ secret: 'peroqueestasdisiendotu' })); // Almacenar sesiones express 
app.use(passport.initialize()); // Usa passport
app.use(passport.session()); // Sesiones Login Persistentes - Passport
app.use(flash()); // Flashear mensaje almacenados en la sesión

/***** CORS - Orígenes externos**/
/*app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});*/

/*
======================================
===              I18N              ===
======================================
*/

i18n.expressBind(app, {
  // setup some locales - other locales default to vi silently
  locales: ['es', 'val', 'en'],
  // set the default locale
  defaultLocale: 'es',
  // set the cookie name
  cookieName: 'locale',

  directory : __dirname + '/locales'
});

// set up the middleware
app.use(function(req, res, next) {
  req.i18n.setLocaleFromCookie();
  if(req.query.lang){
  	req.i18n.setLocaleFromQuery();
  	if(req.query.lang == 'es' || req.query.lang == 'en' || req.query.lang == 'val')
  		res.cookie('locale', req.query.lang);
  }

  //locales.getTranslations(req, res);

  next();
});

var os = require('os');
console.log(os.networkInterfaces()['ens33'][0]['address']);

var IP = os.networkInterfaces()['ens33'][0]['address']; // IP desde donde ejecuto la aplicación

//var IP = 'http://localhost:3000/'

var server = http.createServer(app);
//socket io
var io = require('socket.io').listen(server);

// Requires para controladores
var dir = require('node-dir'),
	exec = require('child_process').exec,
	configUploadImagenes = require('./config/upload.js'),
	crypto = require('crypto'),
	mkdirp = require('mkdirp'),
	User = require('./app/models/user_pg')
	bcrypt = require('bcrypt-nodejs'),
	async = require('async'),
	validator = require('validator'),
	nodemailer = require('nodemailer');

require('./config/config_passport_pg')(passport, db, queries); // pass passport for configuration
require('./app/controllers/sockets.js')(io, path, mkdirp, exec, configUploadImagenes, validator, db, queries, pgp); // SOCKET.IO LADO DEL SERVIDOR

var contHome = require('./app/routes/home.js'), // Página principal, manejo de mensajes
	Usuario = require('./app/routes/usuarios.js'), 
	Denuncia = require('./app/routes/denuncias.js'),
	Geoportal = require('./app/routes/geoportal.js');

Geoportal = new Geoportal(db, dbCarto);
Usuario = new Usuario(crypto, nodemailer, validator, User, db, queries);
Denuncia = new Denuncia(fs, path, dir, exec, User, validator, 
		db, dbCarto, queries, 
		crearMulter('./public/files/usuarios', filename_perfil_img), 
		crearMulter('./public/files/temp', filename_temp_img)); // Guardar, editar, eliminar denuncia, coments, imgs...


/*
 * Geoportal, lo servimos como archivos estáticos
 */

// XHR
app.get('/xhr', Geoportal.request);

// Index
app.get('/', Geoportal.index);

// Visor
app.get('/visor', Geoportal.visor);

// Descargas
app.get('/descargas', Geoportal.descargas);

app.get('/app/getInfoTabla', Geoportal.info_tabla);



app.get('/app', middle_datos, contHome.pagina_principal); // Página de Inicio de la aplicación

app.get('/app/perfil', middle_datos, isLoggedIn, Usuario.mi_perfil); // Perfil de usuario
app.get('/app/usuarios', middle_datos, isLoggedIn, Usuario.perfil_visible);
app.get('/app/logout', Usuario.cerrar_sesion); // Logout
app.get('/app/login', middle_datos, Usuario.pagina_login); // Página de Login
app.post('/app/login', Usuario.autenticar_local); // POST Login
app.get('/app/signup', middle_datos, Usuario.pagina_registro); // Página de Registro
app.post('/app/signup', Usuario.registrarse_local); // POST SignUP

app.get('/app/auth/facebook', Usuario.autenticar_facebook); // Inicio de Sesión con FB
app.get('/app/auth/facebook/callback', Usuario.autenticar_facebook_callback); // Callback Passport FB

app.get('/app/auth/twitter', Usuario.autenticar_twitter); // Inicio de Sesión con TW
app.get('/app/auth/twitter/callback', Usuario.autenticar_twitter_callback); //Callbacl Passport TW

//app.post('/app/connect/local', contPass.connectLocal); // Linkear cuenta local

app.get('/app/connect/facebook', Usuario.conectar_facebook); // Linkear Cuenta FB
app.get('/app/connect/facebook/callback', Usuario.conectar_facebook_callback); // Linkear Cuenta FB Callback

app.get('/app/connect/twitter', isLoggedIn, Usuario.conectar_twitter); //Linkear una cuenta TW
app.get('/app/connect/twitter/callback', isLoggedIn, Usuario.conectar_twitter_callback); // Linkear una cuenta TW Callback

//app.get('/app/unlink/local', contPass.isLoggedIn, contPass.unlinkLocal); // Unlink Cuenta Local
app.get('/app/unlink/facebook', isLoggedIn, Usuario.unlink_facebook); // Unlink Cuenta FB
app.get('/app/unlink/twitter', isLoggedIn, Usuario.unlink_twitter); // Unlink cuenta TW

app.post('/app/forgot', Usuario.olvidaste_pass); // Envía un mail para elegir nueva contraseña
app.post('/app/reset/:token', middle_datos, Usuario.cambiar_pass_token); // Cambia la contraseña del usuario que la haya olvidado

app.get('/app/reset/:token', middle_datos, Usuario.get_cambiar_pass_token); // Formulario para cambiar la contraseña de un usuario qu la haya olvidado
app.get('/app/forgot', middle_datos, Usuario.get_olvidaste_pass); // Formulario para recuperar la contraseña

app.get('/app/changePass', middle_datos, isLoggedIn, Usuario.get_cambiar_pass);
app.post('/app/changePass', isLoggedIn, Usuario.post_cambiar_pass); // Cambiar contraseña

app.get('/app/confirmar/:idUsuario', middle_datos, Usuario.confirmar);

app.post('/app/perfil/editar', isLoggedIn, Usuario.actualizar_perfil);

app.get('/app/perfil/editar', middle_datos, isLoggedIn, Usuario.pagina_actualizar_perfil);

app.post('/app/perfil/cambiar_imagen', isLoggedIn, Usuario.cambiar_imagen_perfil);

app.get('/app/perfil/editar_loc', middle_datos, isLoggedIn, Usuario.pagina_editar_localizacion);

app.post('/app/perfil/editar_loc', isLoggedIn, Usuario.editar_localizacion);

app.post('/app/perfil/gravatar', isLoggedIn, Usuario.cambiar_imagen_perfil_gravatar);


app.post('/app/fileUpload', isLoggedIn, Denuncia.subir_imagen_temporal); // Subir imagen de una denuncia a una carpeta temporal Random
app.get('/app/deleteFile', isLoggedIn, Denuncia.eliminar_imagen_temporal); // Elimina una imagen de la carpeta temporal
app.get('/app/denuncias/nueva', middle_datos, isLoggedIn, Denuncia.pagina_nueva_denuncia);

app.all('/app/denuncia', middle_datos, isLoggedIn, Denuncia.denuncia);

app.post('/app/denuncias/nueva/save', isLoggedIn, Denuncia.guardar);

app.get('/app/denuncias', middle_datos, isLoggedIn, Denuncia.pagina_denuncias);//Ruta que nos mostrará las denuncias ordenadas por fecha

app.get('/app/deleteImagen', Denuncia.eliminar_imagen);

app.get('/app/visor', middle_datos, Denuncia.pagina_visor);

/* Ruta no encontrada 404 */
app.use(function(req, res, next){
	console.log('wiiii');
	var error = new Error('Ruta ' + req.url + ' no encontrada');
	error.status = 404;
	next(error);
});

/* Ruta para manejar errores */
app.use(function(err, req, res, next){
	//console.log('weeee');
	if(err.status)
		res.status(err.status).send(err.toString());
});


/*
======================================
===      INICIO DEL SERVIDOR       ===
======================================
*/
server.listen(port);
console.log('Servidor Node escuchando en el puerto ' + port);


/**
 * Función que se ejecutará en la mayoría de las peticiones para saber si 
 * un cliente está conectado como usuarios
**/
function isLoggedIn(req, res, next) {

	console.log(req.url.split('?')[0]);
	var action = req.query.action;
	if(req.url.split('?')[0] == '/app/denuncia' && 
		(action == 'get_denuncia_page' || !action || 
			!(action == 'edit' || action == 'delete' || action == 'get_edit_page' || action == 'add_coment')
		)
	){
		console.log(req.url + ' isloggedIn --> vas a la pagina de una denuncia no hace falta estar conectao');
		return next();
	}

    if (req.isAuthenticated()){
    	if(req.user.local.valid)
    		next();
    	else{
    		req.flash('error', 'Revisa tu correo:"' + req.user.local.email + '" y activa tu cuenta.');
    		res.redirect('/app');
    	}
    }
    else{
    	console.log('no');

    	req.flash('error', 'Debes estar loggeado');
    	res.redirect('/app/login');
    }
};

/**
 * Función que se ejecutará en la mayoría de las peticiones para devolver al cliente
 * datos de su cuenta como notificaciones y datos de la app como nº de denuncias...
**/
function middle_datos (req, res, next){

	var traducciones = locales.getTranslations(req, res);

	if(req.method.toLowerCase() == 'post'){
		console.log('middle datos method post continue');
		return next();
	}
	
	var id_usuario = req.user ? req.user._id : 'undefined';

	var variables_locales = {
		ip: IP,
		contenido : traducciones,
		message: {
			error: req.flash('error'),
			success: req.flash('success'),
			info : req.flash('info'),
		},
		title: 'Informa Torrent',
		subtitle: 'La app con la que podrás contribuir a la mejora de Torrent.',
		user: req.user, 
		id_usuario: id_usuario
	};
	
	db.one(queries.obtener_datos_app) // consultamos los datos de la app
		.then (function(datos_app){
			
			variables_locales.datos_app = datos_app; // obtenemos datos app
			
			if (! req.user) throw new Error('no estás loggeado'); // Si no hay usuario conectado --> Continuamos adelante
											   // ya que no consultamos notificaciones ni acciones	
			
			return db.query(queries.obtener_notificaciones, req.user._id); // consultamos notificaciones
			
		})
		.then(function(notificaciones){
			// obtenemos notificaciones
			
			notificaciones.forEach(function(n){
				n.denuncia = n.denuncia[0];
				n.denuncia.geometria = n.denuncia.geometria_pu || n.denuncia.geometria_li || n.denuncia.geometria_po;
				//console.log(n.denuncia, 'tipossss');
			});
			
			variables_locales.mis_notificaciones = notificaciones; // ls pasamos al objeto res.locals
			
			return db.query(queries.obtener_acciones, req.user._id); // consultamos acciones
			
		})
		.then (function(acciones){
			// obtenemos acciones
			acciones.forEach(function(n){
				n.denuncia = n.denuncia[0];
				n.denuncia.geometria = n.denuncia.geometria_pu || n.denuncia.geometria_li || n.denuncia.geometria_po;				
				//console.log(n.denuncia, 'tipossss');
			});
			
			variables_locales.mis_acciones = acciones;
			res.locals = variables_locales;
			console.log(variables_locales);
			next(); // siguiente ruta o middleware
		})
		.catch(function (error) {
			console.log('Error middleware ' + error); 
			res.locals = variables_locales;
			next(); // siguiente ruta o middleware
		});
	
};

/*
 * Tarea que va a hacer cada hora en busca de archivos en la carpeta temporal desfasados
 */
var tarea = require('node-schedule');
var regla = new tarea.RecurrenceRule();

regla.minute = 0;

tarea.scheduleJob(regla, function(){
	console.log('ejecutando limpieza de carpeta temporal ');
	fs.readdir(configUploadImagenes.TEMPDIR, function(error, files){
		if(error) console.log('error recorriendo dir : ', error);
		files.forEach(function(file){
			console.log(file);
			var estadisticas = fs.lstatSync(path.join(configUploadImagenes.TEMPDIR, file)); 
			//console.log('estadisticas : ', estadisticas, 'ctime', estadisticas.ctime);
			var ahora = new Date().getTime();
			var fecha_archivo_mas_una_hora = new Date(estadisticas.ctime).getTime() + 3600000;
			
			if(ahora >= fecha_archivo_mas_una_hora){
				// Borrar archivo que está en carpeta temporal mas de una hora
				console.log('archivo/directorio viejo ' + file);
				exec("rm -r '" + path.join(configUploadImagenes.TEMPDIR, file) + "'", function(error_){
					if(error_) console.log(error_);
					else console.log(' archivo ' + file + ' eliminado por ser viejo ' + estadisticas.ctime);
				});
				
			} else {
				console.log('archivo/directorio aun joven para eliminar ' + file + ' XD ctime ' + estadisticas.ctime);
			}
			
		});
	});
});

//Multer - Subida de Imágenes

function filename_perfil_img(req, file, cb){
	console.log('fileeeee' + JSON.stringify(file));
	var random = Math.floor(Math.random() * 1000);
	cb(null, req.user._id + '-' + random + path.extname(file.originalname));
};

function filename_temp_img(req, file, cb){
	console.log(req.query.tempdir);
	if(!req.query.tempdir) req.query.tempdir = '';
	console.log('fileeeee' + JSON.stringify(file));
	cb(null, path.join(req.query.tempdir, file.originalname));
};

function crearMulter(dest, filename){
	return multer({
		limits: {
			fileSize: 3 * 1024 * 1024 // 3 mb
		},
		storage: multer.diskStorage({
			destination: function(req, file, cb){
				console.log('destttttttttttt' + dest);
				cb(null, dest);
			},
			filename: filename,
		})
	});
};