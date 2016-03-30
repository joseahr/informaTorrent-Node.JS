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
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

var os = require('os');
console.log(os.networkInterfaces()['ens33'][0]['address']);

var IP = os.networkInterfaces()['ens33'][0]['address']; // IP desde donde ejecuto la aplicación

//var IP = 'http://localhost:3000/'

var server = http.createServer(app);
server.listen(port);
console.log('The magic happens on port ' + port);

// multer

//socket io
var io = require('socket.io').listen(server);

// Requires para controladores
var dir = require('node-dir'),
	exec = require( 'child_process' ).exec,
	configUploadImagenes = require('./config.js'),
	crypto = require('crypto'),
	mkdirp = require('mkdirp'),
	User = require('./app/models/user_pg')
	bcrypt = require('bcrypt-nodejs'),
	async = require('async'),
	validator = require('validator'),
	nodemailer = require('nodemailer');

require('./config/config_passport_pg')(passport, db, queries); // pass passport for configuration
require('./app/controllers/sockets.js')(io, path, mkdirp, exec, configUploadImagenes, validator, db, queries, pgp); // SOCKET.IO LADO DEL SERVIDOR

/*
 * Tarea que va a hacer cada hora en busca de archivos en la carpeta temporal desfasados
 */
var tarea = require('node-schedule');
var regla = new tarea.RecurrenceRule();

regla.minute = 0;

var limpiador_directorio = tarea.scheduleJob(regla, function(){
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
var multer = require('multer');

var filename_perfil_img = function(req, file, cb){
	console.log('fileeeee' + JSON.stringify(file));
	var random = Math.floor(Math.random() * 1000);
	cb(null, req.user._id + '-' + random + path.extname(file.originalname));
};

var filename_temp_img = function(req, file, cb){
	console.log(req.query.tempdir);
	if(!req.query.tempdir) req.query.tempdir = '';
	console.log('fileeeee' + JSON.stringify(file));
	cb(null, path.join(req.query.tempdir, file.originalname));
}

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
}

var contHome = require('./app/controllers/home.js'); // Página principal, manejo de mensajes
var contPass_ = require('./app/controllers/passport_pg_cont.js'); // Iniciar sesión registrar...
var contPass = new contPass_(crypto, nodemailer, validator, User, db, queries);
var contPg_ = require('./app/controllers/pg.js');
var contPg = new contPg_(fs, path, dir, exec, User, validator, 
		db, dbCarto, queries, 
		crearMulter('./public/files/usuarios', filename_perfil_img), 
		crearMulter('./public/files/temp', filename_temp_img)); // Guardar, editar, eliminar denuncia, coments, imgs...


/*
 * Geoportal, lo servimos como archivos estáticos
 */
// Index
var request = require('request');
app.get('/xhr', function(req, res){
	var url = req.query.url;
	console.log(url);
	if(!url)
		return res.status(500).send('Debe introducir el parámetro url y method');

	request(url, function (error, response, body) {
	  if (!error && response.statusCode == 200) {
	    res.status(200).send(body);
	  }
	  else return res.status(500).send(error);
	});
});

app.get('/', function(req, res){
    res.writeHead(200, {
        "Content-Type": "text/html"
    });
    fs.readFile('./geoportal/index.html', "utf-8", function(err, data) {
        if (err) throw err;
        res.write(data.toString());
        res.end();
    });
});

// Visor
app.get('/visor', function(req, res){
    res.writeHead(200, {
        "Content-Type": "text/html"
    });
    fs.readFile('./geoportal/visor.html', "utf-8", function(err, data) {
        if (err) throw err;
        res.write(data.toString());
        res.end();
    });
});

// Descargas
app.get('/descargas', function(req, res){
    res.writeHead(200, {
        "Content-Type": "text/html"
    });
    fs.readFile('./geoportal/descargas.html', "utf-8", function(err, data) {
        if (err) throw err;
        res.write(data.toString());
        res.end();
    });
});


// Servicios
app.get('/servicios', function(req, res){
    res.writeHead(200, {
        "Content-Type": "text/html"
    });
    fs.readFile('./geoportal/servicios.html', "utf-8", function(err, data) {
        if (err) throw err;
        res.write(data.toString());
        res.end();
    });
});

app.get('/app/getInfoTabla', function(req, res){
	var nombre_tabla = req.query.tabla || '';
	console.log(nombre_tabla);
	if (nombre_tabla.match(/denuncias/g))
		db.query(queries.obtener_info_tabla_geoportal, nombre_tabla)
			.then(function(info){
				res.send({cols: info});
			})
			.catch(function(error){
				console.log('error tablas ' + error);
				res.send({cols: []});
			});
	else
		dbCarto.query(queries.obtener_info_tabla_geoportal, nombre_tabla)
			.then(function(info){
				res.send({cols: info});
			})
			.catch(function(error){
				console.log('error tablas ' + error);
				res.send({cols: []});
			});
});

app.get('/app', middle_datos, contHome.getAppHomePage); // Página de Inicio de la aplicación

app.get('/app/perfil', middle_datos, isLoggedIn, contPg.getProfile); // Perfil de usuario
app.get('/app/usuarios/:id_usuario', middle_datos, isLoggedIn, contPass.getUserProfile);
app.get('/app/logout', contPass.logout); // Logout
app.get('/app/login', middle_datos, contPass.getLogin); // Página de Login (modal)
app.post('/app/login', contPass.postLogin); // POST Login
app.get('/app/signup', middle_datos, contPass.getSignUp); // Página de Registro (modal)
app.post('/app/signup', contPass.postSignUp); // POST SignUP

app.get('/app/auth/facebook', contPass.getFBAuth); // Inicio de Sesión con FB
app.get('/app/auth/facebook/callback', contPass.getFBCallback); // Callback Passport FB

app.get('/app/auth/twitter', contPass.getTWAuth); // Inicio de Sesión con TW
app.get('/app/auth/twitter/callback',contPass.getTWCallback); //Callbacl Passport TW

//app.post('/app/connect/local', contPass.connectLocal); // Linkear cuenta local

app.get('/app/connect/facebook', contPass.connectFB); // Linkear Cuenta FB
app.get('/app/connect/facebook/callback',contPass.connectFBCallback); // Linkear Cuenta FB Callback

app.get('/app/connect/twitter', isLoggedIn, contPass.connectTW); //Linkear una cuenta TW
app.get('/app/connect/twitter/callback', isLoggedIn, contPass.connectTWCallback); // Linkear una cuenta TW Callback

//app.get('/app/unlink/local', contPass.isLoggedIn, contPass.unlinkLocal); // Unlink Cuenta Local
app.get('/app/unlink/facebook', isLoggedIn, contPass.unlinkFB); // Unlink Cuenta FB
app.get('/app/unlink/twitter', isLoggedIn, contPass.unlinkTW); // Unlink cuenta TW

app.post('/app/forgot', contPass.postForgot); // Envía un mail para elegir nueva contraseña
app.post('/app/reset/:token', middle_datos, contPass.postResetToken); // Cambia la contraseña del usuario que la haya olvidado

app.get('/app/reset/:token', middle_datos, contPass.getResetToken); // Formulario para cambiar la contraseña de un usuario qu la haya olvidado
app.get('/app/forgot', middle_datos, contPass.getForgot); // Formulario para recuperar la contraseña

app.get('/app/changePass', middle_datos, isLoggedIn, contPass.getChangePass);
app.post('/app/changePass', isLoggedIn, contPass.postChangePass); // Cambiar contraseña

app.post('/app/fileUpload', isLoggedIn, contPg.uploadTempImage); // Subir imagen de una denuncia a una carpeta temporal Random
app.get('/app/deleteFile', isLoggedIn, contPg.deleteTempImage); // Elimina una imagen de la carpeta temporal
app.get('/app/denuncias/nueva', middle_datos, isLoggedIn, contPg.renderNueva);

app.all('/app/denuncia', middle_datos, isLoggedIn, contPg.denunciaCont);

app.post('/app/denuncias/nueva/save', isLoggedIn, contPg.saveDenuncia);

app.get('/app/denuncias', middle_datos, isLoggedIn, contPg.getDenunciasPage);//Ruta que nos mostrará las denuncias ordenadas por fecha

//app.get('/app/denuncia', middle_datos, contPg.getDenunciaPage);// Ruta que nos muestra la informacion de una denuncia

app.get('/app/confirmar/:idUsuario', middle_datos, contPass.confirmUser);

//app.get('/app/eliminar', isLoggedIn, contPg.deleteDenuncia);
//app.get('/app/editar', middle_datos, isLoggedIn, contPg.getEdit);

//app.get('/app/getImagenesDenuncia', contPg.getImagenesDenuncia);

app.get('/app/deleteImagen', contPg.deleteImagenDenuncia);


app.post('/app/perfil/editar', isLoggedIn, contPg.updateProfile);

app.get('/app/perfil/editar', middle_datos, isLoggedIn, contPg.getUpdateProfilePage);

app.post('/app/perfil/cambiar_imagen', isLoggedIn, contPg.changeProfilePicture);

app.get('/app/perfil/editar_loc', middle_datos, isLoggedIn, contPg.getEditLoc);

app.post('/app/perfil/editar_loc', isLoggedIn, contPg.postChangeLoc);

app.post('/app/perfil/gravatar', isLoggedIn, contPg.changeImageGravatar);

app.get('/app/visor', middle_datos, contPg.getVisorPage);

/*
 * Middlewares de Error y ruta *
 */

//app.get('*', function(req, res, next) {
//	console.log('ruta no encontrada');
//	req.flash('error', 'Ruta no encontrada');
//	res.redirect('/app');
//});

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

	if(req.method.toLowerCase() == 'post'){
		console.log('middle datos method post continue');
		return next();
	}
	
	var id_usuario = req.user ? req.user._id : 'undefined';

	var variables_locales = {
		ip: IP,
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