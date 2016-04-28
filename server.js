var http = require('http'); // Módulo http
var morgan = require('morgan'); // Loggea cada petición en consola
var express  = require('express'); // Framework Express
var app      = express(); // Aplicación empaquetada en express
var port     = process.env.PORT || 3000; // Puerto usado por nuestra aplicación
var passport = require('passport'); // Passport - Sistema de Logins
var flash    = require('connect-flash'); // Flash - Emitir mensajes al request

var path = require('path'); // Módulo path
var cookieParser = require('cookie-parser'); // Módulo cookieParser - Se encarga de manejar las cookies
var session      = require('express-session'); // Módulo de sesiones de express
var bodyParser = require('body-parser'); // BodyParser - Se encarga de parsear el cuerpo de las peticiones

var favicon = require('serve-favicon');
//process.on('uncaughtException', function (err) {
//    console.log(err);
//});
//http.globalAgent.maxSockets = Infinity;

// Express
app.use(favicon(path.join(__dirname,'public','files','images','logo-ayunt.png')));
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

var os = require('os');
console.log(os.networkInterfaces()['ens33'][0]['address']);
//var IP = os.networkInterfaces()['ens33'][0]['address']; // IP desde donde ejecuto la aplicación
//var IP = 'http://localhost:3000/'

// creamos un servidor que contiene nuestra app
var server = http.createServer(app);
// Socket.io está escuchando en nuestro servidor
var io = require('socket.io').listen(server);

// Configuración i18n -- Traducciones
require('./config/i18n.js')(app);
// Configuración de passport -- Estrategias para autentificación y creación de usuarios
require('./config/config_passport_pg')(passport);
// Configuración Socket.io -- Manejador de eventos en tiempo real
require('./app/controllers/sockets.js')(io);

// Middleware traducciones
app.use(require('./app/middlewares/i18n.js'));
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
	if(req.url.match(/\.[0-9a-z]+$/i)){
		console.log('es un icono o algún archivo');
		//return; // no hacer esto
		return next();
	}
	res.status(404).render('errores/error', {
			txt : req.i18n.__('error_servidor'),
			error:{
				status : 404, 
				msg : req.i18n.__('ruta_no_encontrada') + ': ' + req.url
		}
	});
});

/* Ruta para manejar errores */
app.use(function(err, req, res, next){
	//if(!err) return next();
	console.log(err);
	res.status(500).render('errores/error', {
			txt : req.i18n.__('error_servidor'),
			error:{
				status : 500, 
				msg : err.msg
		}
	});
	//res.status(err.status).send(err.toString());
});

// Tarea de limpieza del directorio temporal
require('./app/jobs/clean.js');

/*
======================================
===      INICIO DEL SERVIDOR       ===
======================================
*/
server.listen(port);
console.log('Servidor Node escuchando en el puerto ' + port);