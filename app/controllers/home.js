
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
	console.log(req.url)
	if(req.url == '/app/login')
	{
		res.render(vista, {login: true})
	}
	else if(req.url == '/app/signup')
	{
		res.render(vista, {signup: true})
	}
	else if(req.url == '/app/forgot')
	{
		res.render(vista, {forgot: true})
	}
	else if(modal == 'cambiarPass'){
		console.log('hooooooooooooomeCambiar' + json.token);
		res.render(vista, {json: json, change: true}) // json --> token
	}
	else if (req.user && (req.user.local.active || req.user.facebook || req.user.twitter))
	{
		var userphoto = req.user.profile.picture || req.user.facebook.photo || req.user.twitter.photo;
		res.render(vista, { 
		json : json,
		});
	}

	else
	{
		res.render(vista, {
		title: 'Informa Torrent!', 
		subtitle: 'La app con la que podrás contribuir a la mejora de Torrent', 
		owner: 'Ajuntament de Torrent',
		json: json,
		});
	}
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