var request = require('request'),
	fs = require('fs'),
	db,
	dbCarto;

function Geoportal(db_, dbCarto_){
	db = db_;
	dbCarto = dbCarto_;
}

Geoportal.prototype.index = function(req, res){
    res.writeHead(200, {
        "Content-Type": "text/html"
    });
    fs.readFile('./geoportal/index.html', "utf-8", function(err, data) {
        if (err) throw err;
        res.write(data.toString());
        res.end();
    });
};

Geoportal.prototype.visor = function(req, res){
    res.writeHead(200, {
        "Content-Type": "text/html"
    });
    fs.readFile('./geoportal/visor.html', "utf-8", function(err, data) {
        if (err) throw err;
        res.write(data.toString());
        res.end();
    });
};

Geoportal.prototype.descargas = function(req, res){
    res.writeHead(200, {
        "Content-Type": "text/html"
    });
    fs.readFile('./geoportal/index.html', "utf-8", function(err, data) {
        if (err) throw err;
        res.write(data.toString());
        res.end();
    });
};

Geoportal.prototype.request = function(req, res){
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
};

Geoportal.prototype.info_tabla = function(req, res){
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
};

module.exports = Geoportal;