/**
 * Controlador Passport
 */
var passport = require('passport'); // Passport
var consultas = require('../controllers/queries.js');
var crypto = require('crypto');
var nodemailer = require('nodemailer');
var validator = require('validator');
var config = require('../../config/mailer.js');
var formatsAllowed = 'png|jpg|jpeg|gif'; // Podríamos poner más
var bcrypt   = require('bcrypt-nodejs');
var this_;
var db = require('../../config/database.js').db;
var path = require('path');
/*
 * Constructor
 */
function Usuario(){
	this_ = this;
}
/*
=================================================================
Buscar a un usuario por id
=================================================================
*/
Usuario.prototype.find_by_id = function(id, callback){
	db.one(consultas.usuario_por_id , id)
	.then(function(user){
		callback(null, user);
	})
	.catch(function(error){
		console.log(error);
		callback({type : 'error', msg : error.toString()});
	});
};
/*
=================================================================
Buscar a un usuario por email
=================================================================
*/
Usuario.prototype.find_by_email = function(email, callback){
	db.one(consultas.usuario_por_email, email)
	.then(function(user){
		callback(null, user);
	})
	.catch(function(error){
		callback({type : 'error', msg : error.toString()});
	});
};
/*
 ============================================================
 Obtiene el Usuario_ a partir del campo "passwor_reset_token"
 en la bdd
 ============================================================
 */
Usuario.prototype.find_by_pass_token = function(token, callback) {

	db.one(consultas.usuario_por_password_reset_token, token)
	.then(function(user){
		callback(null, user);
	})
	.catch(function(error){
		callback({type : 'error', msg : error.toString()});
	});
};
/*
=================================
Buscar por email o username
=================================
*/
Usuario.prototype.find_by_email_or_username = function(email_o_user, callback){
	db.one(consultas.usuario_por_email_o_username, email_o_user.toLowerCase())
	.then(function(user){
		callback(null, user);		
	})
	.catch(function(error){
		callback({type : 'error', msg : error.toString()});
	});
};
/*
=================================
Buscar por username
=================================
*/
Usuario.prototype.find_by_username = function(username, callback){
	db.one(consultas.usuario_por_username, username)
	.then(function(user){
		callback(null, user);		
	})
	.catch(function(error){
		callback({type : 'error', msg : error.toString()});
	});
};
/*
=================================
Buscar por id facebook
=================================
*/
Usuario.prototype.find_by_facebook_id = function(facebook_id, callback){
	db.one(consultas.usuario_por_id_facebook, facebook_id)
	.then(function(user){
		callback(null, user);		
	})
	.catch(function(error){
		callback({type : 'error', msg : error.toString()});
	});
};
/*
=================================
Buscar por id twitter
=================================
*/
Usuario.prototype.find_by_twitter_id = function(twitter_id, callback){
	db.one(consultas.usuario_por_id_twitter, twitter_id)
	.then(function(user){
		callback(null, user);		
	})
	.catch(function(error){
		callback({type : 'error', msg : error.toString()});
	});
};
/*
=================================
Añadir cuenta de facebook
=================================
*/
Usuario.prototype.set_facebook = function(id_usuario, facebook_profile, callback){
	db.none(consultas.set_facebook_usuario, [facebook_profile, id_usuario])
	.then(function(){
		callback(null);		
	})
	.catch(function(error){
		callback({type : 'error', msg : error.toString()});
	});
};
/*
=================================
Añadir cuenta de twitter
=================================
*/
Usuario.prototype.set_twitter = function(id_usuario, twitter_profile, callback){
	db.none(consultas.set_twitter_usuario, [twitter_profile, id_usuario])
	.then(function(){
		callback(null);		
	})
	.catch(function(error){
		callback({type : 'error', msg : error.toString()});
	});
};
/*
=================================
Crear un usuario
=================================
*/
Usuario.prototype.crear = function(password, local, profile, callback){
	db.one(consultas.crear_usuario, [password, local, profile])
	.then(function(user){
		callback(null, user);		
	})
	.catch(function(error){
		callback({type : 'error', msg : error.toString()});
	});
};
/*
=================================
Crear token random
@email
=================================
*/
Usuario.prototype.create_random_token = function(email, callback){
	// Creamos string hexadecimal
    crypto.randomBytes(20, function(err, buf) {
    	// String hexadecimal
        var token = buf.toString('hex');
        // Ejecutamos la consulta
        this_.find_by_email_or_username(email, function(error, user){
        	// Hay error lo devolvemos
        	if(error) return callback(error); 
        	// Ejecutamoos consulta
        	db.none(consultas.set_token_1_hora , [token, user._id])
        	// Se completa la consulta
        	.then(function(){
        		callback(null, token);
        	})
        	// Controlamos error 
        	.catch(function(error){
        		callback({type : 'error', msg : error.toString()});
        	});
        });     
    });
};
/*
=================================
Función que permite al usuario cambiar la contraseña
@opciones Objeto con los siguientes datos {
	email,
	password_original,
	password_nueva,
	password_nueva_repeat

}
=================================
*/
Usuario.prototype.cambiar_pass = function(password, id_usuario, callback){
	// Ejecutamos consulta
	db.none(consultas.actualizar_contraseña, [this_.generateHash(password), id_usuario])
	.then(function(){
		callback(null);
	})
	.catch(function(error){
		callback({type : 'error', msg : error.toString()});
	});
};
/*
 ======================================
 Función para reestablecer contraseña mediante token
 @opciones objeto {
	password,
	passwordRepeat,
	token
 }
 ======================================
 */
Usuario.prototype.cambiar_pass_token = function(password, id_usuario, callback) {
	db.none(consultas.actualizar_password_reset_token, [this_.generateHash(password), id_usuario])
	.then(function(){
		callback(null);
	})
	.catch(function(error){
		callback({type : 'error', msg : error.toString()});
	});
};
/*
===========================================================================
Deslincar cuenta de twitter
@id_usuario
===========================================================================
*/
Usuario.prototype.unlink_twitter = function(id_usuario, callback){    
    db.none(consultas.deslincar_twitter, id_usuario)
	.then(function(){
		callback(null);
	})
	.catch(function(error){
		callback({type : 'error', msg : error.toString()});
	});
};
/*
===========================================================================
Deslincar cuenta de facebook
@id_usuario
===========================================================================
*/
Usuario.prototype.unlink_facebook =  function(id_usuario, callback){
 
    db.none(consultas.deslincar_facebook, id_usuario)
	.then(function(){
		callback(null);
	})
	.catch(function(error){
		callback({type : 'error', msg : error.toString()});
	});
};
/*
==============================================================================
Confirmar usuario que aún no es válido
@opciones {
	id_usuario,
	i18n
}
==============================================================================
*/
Usuario.prototype.confirmar = function(user, callback){
	user.local.valid = true;
	db.none(consultas.actualizar_local_usuario, [JSON.stringify(user.local) , user._id])
	.then(function(){
		callback(null);
	})
	.catch(function(error){
		callback({type : 'error', msg : error.toString()});
	});
};
/*
================================================================
Perfil visible para los demás usuarios
@opciones {
	id_usuario,
	i18n
}
================================================================
*/
Usuario.prototype.perfil_visible = function(id_usuario, callback){
	Promise.all([db.one(consultas.perfil_otro_usuario, id_usuario), this_.getNumLikesEnMisDenuncias(id_usuario)])
	.then(function(result){
		var usuario = result[0];
		usuario.likes_en_denuncias = result[1].count;
		callback(null, usuario);
	})
	.catch(function(error){
		console.log(error);
		callback({type : 'error', msg : error.toString()});
	});
};
/*
================================================================
Obtener las denuncias del usuario
================================================================
*/
Usuario.prototype.get_denuncias = function(id_usuario, callback){
	console.log('get_denuncias');
	db.any(consultas.obtener_denuncias_usuario, id_usuario)
	.then (function(denuncias_user){
		callback(null, denuncias_user);
	})
	.catch(function(error){
		callback({type : 'error', msg : error.toString()});
	});
};
/*
================================================================
Obtener las denuncias del usuario
================================================================
*/
Usuario.prototype.get_denuncias_fav = function(id_usuario, callback){
	db.any(consultas.usuario_denuncias_favoritas, id_usuario)
	.then(function(denuncias_fav){
		callback(null, denuncias_fav);
	})
	.catch(function(error){
		callback({type : 'error', msg : error.toString()});
	});
};
/*
===============================================================
Obtener las notificaciones de un usuario
===============================================================
*/
Usuario.prototype.get_notificaciones = function(id_usuario, callback){
	console.log('get_notis');
	db.query(consultas.obtener_notificaciones, id_usuario)
	.then(function(notificaciones){
		console.log(notificaciones);
		// obtenemos notificaciones
		if(!notificaciones)
			notificaciones = [];
		notificaciones.forEach(function(n){
			n.denuncia = n.denuncia[0];
			//console.log(n.denuncia, 'tipossss');
		});
		callback(null, notificaciones);
	})
	.catch(function(error){
		callback({type : 'error', msg : error.toString()});
	});
};
/*
===============================================================
Obtener las acciones de un usuario
===============================================================
*/
Usuario.prototype.get_acciones = function(id_usuario, callback){
		
	db.query(consultas.obtener_acciones, id_usuario)
	.then(function(acciones){
		// obtenemos notificaciones
		acciones.forEach(function(n){
			n.denuncia = n.denuncia[0];
			//console.log(n.denuncia, 'tipossss');
		});
		callback(null, acciones);
	})
	.catch(function(error){
		console.log(error);
		callback({type : 'error', msg : error.toString()});
	});
};
/*
===============================================================
Editar perfil
@opciones {
	user,
	new_username
}
===============================================================
*/
Usuario.prototype.update = function(user, callback){

	db.none(consultas.actualizar_perfil, [JSON.stringify(user.profile), user._id])
	.then(function(){
		callback(null);
	})
	.catch(function(error){
		callback({type : 'error', msg : error.toString()});
	});
};
/*
=================================================================
Cambiar imagen de perfil
@opciones {
	file,
	user
}
=================================================================
*/
Usuario.prototype.cambiar_imagen_perfil = function(user, callback){ 
    db.none(consultas.actualizar_perfil, [JSON.stringify(user.profile), user._id])
	.then(function(){
		for (var socketId in global.clients[user._id])
			global.clients[user._id][socketId].emit('imagen cambiá', {path : user.profile.picture});
		callback(null, user.profile.picture);
	})
	.catch(function(error){
		callback({type : 'error', msg : error.toString()});
	});
};
/*
================================================================
Obtener localización preferida del usuario
@id_usuario
================================================================
*/
Usuario.prototype.get_localizacion_preferida = function(id_usuario, callback){
	db.one(consultas.obtener_loc_preferida, id_usuario)
	.then(function(location){
		callback(null, location.loc_pref);;
	})
	.catch(function(error){
		callback({type : 'error', msg : error.toString()});
	});
};
/*
=================================================================
Actualizar localización preferida
@opciones {
	user,
	distancia,
	wkt,
}
=================================================================
*/
Usuario.prototype.update_localizacion_preferida = function(opciones, callback){

	var wkt = opciones.wkt;
	var distancia = opciones.distancia;
	var id_usuario = opciones.id_usuario;

	db.none(consultas.actualizar_loc_pref, [wkt, distancia, id_usuario])
	.then(function(){
		callback(null);
	})
	.catch(function(error){
		callback({type : 'error', msg : error.toString()});
	});
};

Usuario.prototype.noti_vista = function(id_notificacion, callback){
	db.none(consultas.notificacion_vista, id_notificacion)
	.then(function(){
		callback(null);
	})
	.catch(function(error){
		console.log('error noti_vista ' + error.toString());
		callback({type : 'error', msg : error.toString()});
	});
};

Usuario.prototype.me_gusta_la_denuncia = function(id_usuario, id_denuncia, callback){
	db.oneOrNone(consultas.check_like_denuncia, [id_usuario, id_denuncia])
	.then(function(like){
		callback(null, like != null);
	})
	.catch(function(error){
		callback({type : 'error', msg : error.toString()});
		console.log(error.toString());
	});
};

Usuario.prototype.likear_denuncia = function(id_usuario, denuncia, like, callback){
	// No le gusta aún, entonces le ha dado a me gusta
	db.tx(function(t){
		q = [];
		// Insertamos el like
		if(!like)
			q.push(t.none(consultas.insertar_like, [id_usuario, denuncia.gid]));
		else
			q.push(t.none(consultas.eliminar_like, [id_usuario, denuncia.gid]));
		//console.log('from',data.usuario_id, 'to', data.denuncia.id_usuario);

		// Si el usuario es el propietario de la denuncia no enviamos notificacion
		if(id_usuario != denuncia.id_usuario) {
			// Insertamos la notificación para que el propietario de la denuncia 
			// sepa que le hemos dado al like
			if(!like)
				q.push(t.one(consultas.insertar_notificacion, 
					[denuncia.gid, id_usuario, denuncia.id_usuario,'LIKE_DENUNCIA', JSON.stringify({})]));
			else
				q.push(t.one(consultas.insertar_notificacion, 
					[denuncia.gid, id_usuario, denuncia.id_usuario,'NO_LIKE_DENUNCIA', JSON.stringify({})]));					
		}
		// ejecutamos las consultas
		return t.batch(q);
	})
	.then(function(notificacion){
		console.log('noti length', notificacion);
		if(notificacion[1]){
			// No hay notificación --> El usuario es el propietario de la denuncia
			callback(null, notificacion[1]);
		}
		else {
			// Si hay noti es decir el usuario que da al like y el usuario prop de la 
			// denuncia son distintos
			callback(null, null);
		}
	})
	.catch(function(error){
		callback({type : 'error', msg : error.toString()})
	});
};


/*
================================================================
Enviar email a un usuario
@opciones {
	email,
	subject,
	text
}
================================================================
*/
Usuario.prototype.enviar_email = function(opciones, callback){
	// Creamos servicio de transporte
	var smtpTransport = nodemailer.createTransport('SMTP', {
		service: 'gmail',
		auth: {
			user: config.user,
			pass: config.pass
		}
	});
	// Opciones del email
	var mailOptions = {
		to: opciones.email,
		from: config.from,
		subject: opciones.subject,
		text:  opciones.text
	};
	// Enviamos el email
	smtpTransport.sendMail(mailOptions, function(err) {
		if(err) return callback({type : 'error', msg : err.toString()});
		return callback(null);
	});
};

Usuario.prototype.get_noti_by_id = function(id_noti, callback){
	db.one(consultas.get_noti_por_id, id_noti)
	.then(function(notificacion){
		callback(null, notificacion);
	})
	.catch(function(error){
		callback({type : 'error', msg : error.toString()});
	});
};

Usuario.prototype.get_accion_by_id = function(id_noti, callback){
	db.one(consultas.get_accion_por_id, id_noti)
	.then(function(notificacion){
		callback(null, notificacion);
	})
	.catch(function(error){
		console.log(error);
		callback({type : 'error', msg : error.toString()});
	});
};

Usuario.prototype.getNumLikesEnMisDenuncias = function(id_usuario){
	return db.one('SELECT COUNT(*) FROM LIKES WHERE id_denuncia IN (SELECT gid from denuncias WHERE id_usuario = $1)', id_usuario);
}

/*
=============================================================
Generar Hash a partir de la contraseña para almacenar en bdd
=============================================================
*/
Usuario.prototype.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};
/*
=============================================================
Comprobar contraseña válida (Hashes coinciden)
=============================================================
*/
Usuario.prototype.validPassword = function(input_password, password) {
    return bcrypt.compareSync(input_password, password);
};
/*
=============================================================
Genera una url para el gravatar a partir del email del usuario
=============================================================
*/
Usuario.prototype.gravatar = function(email) {
	  var md5 = crypto.createHash('md5').update(email).digest('hex');
	  return 'https://gravatar.com/avatar/' + md5 + '?s=' + 300 + '&d=retro';
};
/*
=============================================================
Exportamos el usuario
=============================================================
*/
module.exports = Usuario;