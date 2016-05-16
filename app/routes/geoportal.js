var request = require('request'),
	fs = require('fs'),
	database = require('../../config/database.js'),
	db = database.db,
	dbCarto = database.dbCarto,
	consultas = require('../controllers/queries.js'),
	router = require('express').Router();

router.get('/', function(req, res, next){
	var lan = get_locale_from_cookie(req, res);
	console.log(lan);
	// Escribimos cabecera
    res.writeHead(200, {
        "Content-Type": "text/html"
    });
    // Leemos y enviamos el archivo HTML
    fs.readFile('./geoportal/' + lan + '/index.html', "utf-8", function(err, data) {
        if (err) return next(err);
        res.write(data.toString());
        res.end();
    });
});

router.get('/visor', function(req, res, next){
	var lan = get_locale_from_cookie(req, res);
	res.writeHead(200, {
        "Content-Type": "text/html"
    });
    fs.readFile('./geoportal/' + lan + '/visor.html', "utf-8", function(err, data) {
        if (err) return next(err);
        res.write(data.toString());
        res.end();
    });
});

router.get('/descargas', function(req, res, next){
	var lan = get_locale_from_cookie(req, res);
	res.writeHead(200, {
        "Content-Type": "text/html"
    });
    fs.readFile('./geoportal/' + lan + '/descargas.html', "utf-8", function(err, data) {
        if (err) return next(err);
        res.write(data.toString());
        res.end();
    });
});

router.get('/proyecto', function(req, res, next){
	res.writeHead(200, {
        "Content-Type": "text/html"
    });
    fs.readFile('./geoportal/tree.html', "utf-8", function(err, data) {
        if (err) return next(err);
        res.write(data.toString());
        res.end();
    });
});

router.get('/xhr', function(req, res){
	var url = req.query.url;
	console.log(url);
	if(!url)
		return res.status(500).send('Debe introducir el parámetro url y method');

	request(url, function (error, response, body) {
	  if (!error && response.statusCode == 200) {
	    res.status(200).send(body);
	  }
	  else res.status(500).send(error);
	});
});

router.get('/info', function(req, res){
	var tabla = req.query.tabla || '';

	if (tabla.match(/denuncias/g))
		get_denuncias_tabla_info(tabla, function(result){
			res.send({cols : result})
		});
	else
		get_carto_tabla_info(tabla, function(result){
			res.send({cols : result})
		});
});

function get_denuncias_tabla_info (tabla, callback){
	db.query(consultas.obtener_info_tabla_geoportal, tabla)
	.then(function(info){
		callback(info);
	})
	.catch(function(error){
		console.log('error tablas ' + error);
		callback([]);
	});
};

function get_carto_tabla_info (tabla, callback){
	dbCarto.query(consultas.obtener_info_tabla_geoportal, tabla)
	.then(function(info){
		callback(info);
	})
	.catch(function(error){
		console.log('error tablas ' + error);
		callback([]);
	});
};

function get_locale_from_cookie (req, res){
	var lan;
	console.log(res.get('set-cookie'));
	console.log(req.cookies.locale);
	// Comprobamos si ha cambiado la cookie en esta petición
	if(res.get('set-cookie') != undefined)
		res.get('set-cookie').split(';').forEach(function(cookie){
			if(cookie.match(/locale/g)) lan = cookie.split('=')[1].toLowerCase();
		});
	// Si no ha cambiado, obtenemos la cookie del request
	if(!lan)
		lan = req.cookies.locale ? req.cookies.locale.toLowerCase() : 'es';
	return lan;
};

module.exports = router;