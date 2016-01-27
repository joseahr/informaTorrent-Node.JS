/*
 * server.js
 */

// Set Up
var http = require('http');
var morgan = require('morgan');
var express  = require('express');
var app      = express();
var port     = process.env.PORT || 3000;
var passport = require('passport');
var flash    = require('connect-flash');

var promiseLib = require('bluebird');
var configDB = require('./config/database.js');
var pgp = require('pg-promise')({
	promiseLib : promiseLib
});
var db = pgp(configDB.denuncias);
var dbCarto = pgp(configDB.carto);
var queries = require('./app/controllers/queries.js');

var pg = require('pg');

var fs = require('fs');
var path = require('path');

var cookieParser = require('cookie-parser');
var session      = require('express-session');



//process.on('uncaughtException', function (err) {
//    console.log(err);
//});

//http.globalAgent.maxSockets = Infinity;


require('./config/config_passport_pg')(passport); // pass passport for configuration


// Express
var bodyParser = require('body-parser');

app.use(morgan('dev')); // Log cada request en la consola
app.use(cookieParser()); // Leer Coockies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'jade'); // Jade
app.set('port', process.env.PORT || 3000);

app.use(require('connect-multiparty')());



// Necesarios para passport
app.use(session({ secret: 'peroqueestasdisiendotu' })); // Almacenar sesiones 
app.use(passport.initialize());
app.use(passport.session()); // Sesiones Login Persistentes
app.use(flash()); // Flashear mensaje almacenados en la sesión

var os = require('os');
console.log(os.networkInterfaces()['ens33'][0]['address']);

var IP = os.networkInterfaces()['ens33'][0]['address'];

//var IP = 'http://localhost:3000/'

// Ruta middleware
var client;
function middle_datos (req, res, next){
	
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
	
	db.query(queries.obtener_datos_app) // consultamos los datos de la app
		.then (function(datos_app){
			
			variables_locales.datos_app = datos_app[0]; // obtenemos datos app
			
			if (! req.user) throw new Error('no estás loggeado'); // Si no hay usuario conectado --> Continuamos adelante
											   // ya que no consultamos notificaciones ni acciones	
			
			return db.query(queries.obtener_notificaciones, req.user._id); // consultamos notificaciones
			
		})
		.then(function(notificaciones){
			// obtenemos notificaciones
			variables_locales.mis_notificaciones = notificaciones; // ls pasamos al objeto res.locals
			
			return db.query(queries.obtener_acciones, req.user._id); // consultamos acciones
			
		})
		.then (function(acciones){
			// obtenemos acciones
			variables_locales.mis_acciones = acciones;
			res.locals = variables_locales;
			next(); // siguiente ruta o middleware
		})
		.catch(function (error) {
			console.log('Error middleware ' + error); 
			res.locals = variables_locales;
			next(); // siguiente ruta o middleware
		});
	
};



var server = http.createServer(app);
server.listen(port);
console.log('The magic happens on port ' + port);


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

require('./app/controllers/sockets.js')(io, pg, path, mkdirp, exec, configUploadImagenes, validator); // SOCKET.IO LADO DEL SERVIDOR

var contHome = require('./app/controllers/home.js'); // Página principal, manejo de mensajes
var contPass_ = require('./app/controllers/passport_pg_cont.js'); // Iniciar sesión registrar...
var contPass = new contPass_(passport, pg, bcrypt, async, crypto, nodemailer, contHome, validator, User);
var contUpload_ = require('./app/controllers/uploadDenuncia.js') // Subir imágenes al rellenar la denuncia
var contUpload = new contUpload_(io, crypto, fs, path,exec,mkdirp, configUploadImagenes);
var contPg_ = require('./app/controllers/pg.js');
var contPg = new contPg_(fs, path, dir, exec, User, validator, io, db, dbCarto, queries); // Guardar, editar, eliminar denuncia, coments, imgs...

/*
 * Geoportal, lo servimos como archivos estáticos
 */
// Index
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
	if (nombre_tabla == 'denuncias')
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
app.get('/app/usuarios/:id_usuario', middle_datos, contPass.getUserProfile);
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

app.post('/app/fileUpload/:tempDirID', isLoggedIn, contUpload.postPicture); // Subir imagen de una denuncia a una carpeta temporal Random
app.get('/app/filelist/:tempDirID', isLoggedIn, contUpload.getPicturesList); // Devuelve la lista de imágenes en la carpeta temporal
app.get('/app/deleteFile/:tempDirID/:fileName', isLoggedIn, contUpload.getDeletePicture); // Elimina una imagen de la carpeta temporal
app.get('/app/denuncias/nueva', middle_datos, isLoggedIn,contUpload.indexNueva);

app.post('/app/denuncia/:id_denuncia/addComentario', isLoggedIn, contPg.addComentario);
app.post('/app/denuncias/nueva/save', isLoggedIn, contPg.saveDenuncia);

app.post('/app/denuncias/editar', isLoggedIn, contPg.updateDenuncia);

app.get('/app/denuncias', middle_datos, isLoggedIn, contPg.getDenunciasPage);//Ruta que nos mostrará las denuncias ordenadas por fecha

app.get('/app/denuncia/:id_denuncia', middle_datos, contPg.getDenunciaPage);// Ruta que nos muestra la informacion de una denuncia

app.get('/app/confirmar/:idUsuario', middle_datos, contPass.confirmUser);

app.get('/app/eliminar', isLoggedIn, contPg.deleteDenuncia);
app.get('/app/editar', middle_datos, isLoggedIn, contPg.getEdit);

app.get('/app/getImagenesDenuncia', contPg.getImagenesDenuncia);

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

function isLoggedIn(req, res, next) {
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
}