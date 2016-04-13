/*
 * Tarea que va a hacer cada hora en busca de archivos en la carpeta temporal desfasados
 */
var config = require('../../config/upload.js');
var fs = require('fs');
var path = require('path');
var exec = require('child_process').exec;

var tarea = require('node-schedule');
var regla = new tarea.RecurrenceRule();

regla.minute = 0;

tarea.scheduleJob(regla, function(){
	console.log('ejecutando limpieza de carpeta temporal ');
	fs.readdir(config.TEMPDIR, function(error, files){
		if(error) console.log('error recorriendo dir : ', error);
		files.forEach(function(file){
			console.log(file);
			var estadisticas = fs.lstatSync(path.join(config.TEMPDIR, file)); 
			//console.log('estadisticas : ', estadisticas, 'ctime', estadisticas.ctime);
			var ahora = new Date().getTime();
			var fecha_archivo_mas_una_hora = new Date(estadisticas.ctime).getTime() + 3600000;
			
			if(ahora >= fecha_archivo_mas_una_hora){
				// Borrar archivo que está en carpeta temporal mas de una hora
				console.log('archivo/directorio viejo ' + file);
				exec("rm -r '" + path.join(config.TEMPDIR, file) + "'", function(error_){
					if(error_) console.log(error_);
					else console.log(' archivo ' + file + ' eliminado por ser viejo ' + estadisticas.ctime);
				});
				
			} else {
				console.log('archivo/directorio aun joven para eliminar ' + file + ' XD ctime ' + estadisticas.ctime);
			}
			
		});
	});
});