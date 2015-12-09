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

var pg = require('pg');

var fs = require('fs');
var path = require('path');

var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var session      = require('express-session');
var configDB = require('./config/database.js');



//process.on('uncaughtException', function (err) {
//    console.log(err);
//});

//http.globalAgent.maxSockets = Infinity;


require('./config/config_passport_pg')(passport); // pass passport for configuration


// Express
app.use(morgan('dev')); // Log cada request en la consola
app.use(cookieParser()); // Leer Coockies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'jade'); // Jade
app.set('port', process.env.PORT || 3000);

app.use(require('connect-multiparty')())

// Necesarios para passport
app.use(session({ secret: 'peroqueestasdisiendotu' })); // Almacenar sesiones 
app.use(passport.initialize());
app.use(passport.session()); // Sesiones Login Persistentes
app.use(flash()); // Flashear mensaje almacenados en la sesión

// Vamos a usar una ruta middleware para pasar mensajes de error 
// para cualquier rquest de nuestra aplicación
app.use(function(req, res, next){
	// Con esta función le decimos al router que debe ejecutarse
	// para cualquier petición de nuestra aplicación
//	if(req.user && req.user.local)
//	{
//		if(req.user.local.active){
//			res.locals.user = req.user;
//		}
//		else if(req.user.facebook || req.user.twitter){
//			res.locals.user = req.user;
//		}
//		else req.locals.user = undefined;
//	}
//	else if(req.user && (req.user.facebook || req.user.twitter)) res.locals.user = req.user;
//	else res.locals.user = undefined;
	
	res.locals.message = {
			error: req.flash('error'),
			success: req.flash('success'),
			info : req.flash('info')
	}
	
	
	res.locals.title = 'informaTorrent!';
	res.locals.subtitle = 'La app con la que podrás contribuir a la mejora de Torrent.'
	next();
	
});



var server = http.createServer(app);
server.listen(port);
console.log('The magic happens on port ' + port);


//socket io
var io = require('socket.io').listen(server);

// Ruta /app/visor
app.get('/app/visor', function(req, res){
	var client = new pg.Client('postgres://jose:jose@localhost/denuncias');
	
	client.connect(function(error){
		if (error) console.error('error conectando a la bdd', error);
		else {
			client.query('select *, st_asgeojson(the_geom) as geom from denuncias order by fecha DESC limit 1000', function(e, result){
				client.end();
				if (e) console.error(e);
				else {
					console.log(result.rows);
					res.render('visor.jade', {denuncias: JSON.stringify(result.rows)});
				}
			});
		}
	});
	
});

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


var contHome = require('./app/controllers/home.js'); // Página principal, manejo de mensajes
var contPass_ = require('./app/controllers/passport_pg_cont.js'); // Iniciar sesión registrar...
var contPass = new contPass_(passport, pg, bcrypt, async, crypto, nodemailer, contHome, validator, User);
var contUpload_ = require('./app/controllers/uploadDenuncia.js') // Subir imágenes al rellenar la denuncia
var contUpload = new contUpload_(io, crypto, fs, path,exec,mkdirp, configUploadImagenes);
var contPg_ = require('./app/controllers/pg.js');
var contPg = new contPg_(fs, path, dir, exec, pg, User, validator, io); // Guardar, editar, eliminar denuncia, coments, imgs...

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


app.get('/app', contHome.getAppHomePage); // Página de Inicio de la aplicación

app.get('/app/profile', isLoggedIn, contPg.getProfile); // Perfil de usuario
app.get('/app/usuarios/:id_usuario', contPass.getUserProfile);
app.get('/app/logout', contPass.logout); // Logout
app.get('/app/login', contPass.getLogin); // Página de Login (modal)
app.post('/app/login', contPass.postLogin); // POST Login
app.get('/app/signup', contPass.getSignUp); // Página de Registro (modal)
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
app.post('/app/reset/:token', contPass.postResetToken); // Cambia la contraseña del usuario que la haya olvidado

app.get('/app/reset/:token', contPass.getResetToken); // Formulario para cambiar la contraseña de un usuario qu la haya olvidado
app.get('/app/forgot', contPass.getForgot); // Formulario para recuperar la contraseña

app.get('/app/changePass', isLoggedIn, contPass.getChangePass);
app.post('/app/changePass', isLoggedIn, contPass.postChangePass); // Cambiar contraseña

app.post('/app/fileUpload/:tempDirID', isLoggedIn, contUpload.postPicture); // Subir imagen de una denuncia a una carpeta temporal Random
app.get('/app/filelist/:tempDirID', isLoggedIn, contUpload.getPicturesList); // Devuelve la lista de imágenes en la carpeta temporal
app.get('/app/deleteFile/:tempDirID/:fileName', isLoggedIn, contUpload.getDeletePicture); // Elimina una imagen de la carpeta temporal
app.get('/app/denuncias/nueva', isLoggedIn,contUpload.indexNueva);

app.post('/app/denuncia/:id_denuncia/addComentario', isLoggedIn, contPg.addComentario);
app.post('/app/denuncias/nueva/save', isLoggedIn, contPg.saveDenuncia);

app.post('/app/denuncias/editar', isLoggedIn, contPg.updateDenuncia);

app.get('/app/denuncias', isLoggedIn, contPg.getDenunciasPage);//Ruta que nos mostrará las denuncias ordenadas por fecha

app.get('/app/denuncia/:id_denuncia', contPg.getDenunciaPage);// Ruta que nos muestra la informacion de una denuncia

app.get('/app/confirmar/:idUsuario', contPass.confirmUser);

app.get('/app/eliminar', isLoggedIn, contPg.deleteDenuncia);
app.get('/app/editar', isLoggedIn, contPg.getEdit);

app.get('/app/getImagenesDenuncia', contPg.getImagenesDenuncia);

app.get('/app/deleteImagen', contPg.deleteImagenDenuncia);


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

//app.use(function(err, req, res, next) {
//	 console.log('midle error');
//	 if(!err){
//		 err = new Error('No encontrado');
//		 err.status(404);
//	 }
//
//	 //res.status(err.status);
//	 res.locals.message = {error : err.message};
//	 req.flash('error', err.message);
//	 return res.redirect('/app');
//	
//});



