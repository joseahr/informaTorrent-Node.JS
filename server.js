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

var fs = require('fs'); // Módulo fs
var path = require('path'); // Módulo path
var cookieParser = require('cookie-parser'); // Módulo cookieParser - Se encarga de manejar las cookies
var session      = require('express-session'); // Módulo de sesiones de express
var bodyParser = require('body-parser'); // BodyParser - Se encarga de parsear el cuerpo de las peticiones

var i18n = require('i18n-2'); // i18n
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
  	if(req.query.lang.toLowerCase() == 'es' || req.query.lang.toLowerCase() == 'en' || req.query.lang.toLowerCase() == 'val')
  		res.cookie('locale', req.query.lang.toLowerCase());
  }
  //locales.getTranslations(req, res);

  next();
});

//var os = require('os');
//console.log(os.networkInterfaces()['ens33'][0]['address']);
//var IP = os.networkInterfaces()['ens33'][0]['address']; // IP desde donde ejecuto la aplicación
//var IP = 'http://localhost:3000/'

var server = http.createServer(app);
//socket io
var io = require('socket.io').listen(server);

require('./config/config_passport_pg')(passport); // Configuración de passport
require('./app/controllers/sockets.js')(io); // SOCKET.IO LADO DEL SERVIDOR

// Rutas Geoportal
app.use('/', require('./app/routes/geoportal.js'));
// Página principal de la app
app.use('/app', require('./app/routes/home.js'));
// Rutas usuarios
app.use('/app/usuarios', require('./app/routes/usuarios.js'));
// Rutas denuncias
app.use('/app/denuncias', require('./app/routes/denuncias.js'));

/* Ruta no encontrada 404 */
app.use(function(req, res, next){
	var error = new Error(req.i18n.__('ruta_no_encontrada') + ': ' + req.url);
	error.status = 404;
	next(error);
});

/* Ruta para manejar errores */
app.use(function(err, req, res, next){
	var status = err.status || 500;
	console.log('error status');
	res.status(status).render('error', {
			txt : req.i18n.__('error_servidor'),
			error:{
				status : status, 
				msg : err.toString()
		}
	});
	//res.status(err.status).send(err.toString());
});


/*
======================================
===      INICIO DEL SERVIDOR       ===
======================================
*/
server.listen(port);
console.log('Servidor Node escuchando en el puerto ' + port);

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