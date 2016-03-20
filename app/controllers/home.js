
/* 
 *  Renderizamos la página principal de nuestra aplicación
 */
exports.getAppHomePage = function(req, res){
	//console.log('home ' + res.locals.datos_app.num_denun_total);
	//console.log('home ' + res.locals.mis_notificaciones);
	
	res.render('indexapp');
}