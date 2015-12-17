
/* 
 *  Renderizamos la página principal de nuestra aplicación
 */
exports.getAppHomePage = function(req, res){
	
	datos(req, res, 'indexapp', '');
}

/*
 * Función útil para la página de Inicio
 */
function datos(req, res, vista, modal, json){
		res.render(vista, {
		title: 'Informa Torrent!', 
		subtitle: 'La app con la que podrás contribuir a la mejora de Torrent', 
		owner: 'Ajuntament de Torrent',
		json: json,
		});
}
/*
 * Exportamos la función para poder usarla importando este fichero
 */
exports.datos = datos;


function flashMessages(req, res){
	res.locals.message = {
			error: req.flash('error'),
			success: req.flash('success'),
			info : req.flash('info')
	}
}

exports.flashMessages = flashMessages;