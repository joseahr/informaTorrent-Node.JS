var url = require('url');

var cont = {
	'/app' : function(req){
		return {
			titulo : req.i18n.__('titulo_app'),
			slogan : req.i18n.__('slogan'),
			inicio : req.i18n.__('inicio'),
			iniciar_sesion : req.i18n.__('iniciar_sesion'),
			registrarse : req.i18n.__('registrarse'),
			olvidaste : req.i18n.__('olvidaste'),
			visor_tiempo_real : req.i18n.__('visor_tiempo_real'),
			denuncias : req.i18n.__('denuncias'),
			notificaciones : req.i18n.__('notificaciones'),
			mi_perfil : req.i18n.__('mi_perfil'),
			nueva_denuncia : req.i18n.__('nueva_denuncia'),
			cerrar_sesion : req.i18n.__('cerrar_sesion'),
			subtitulo : req.i18n.__('subtitulo_app'),
			inicia_sesion_info : req.i18n.__('inicia_sesion_info'),
			inicia_sesion_rs : req.i18n.__('inicia_sesion_rs'),
			nuevo : req.i18n.__('nuevo'),
			usuario : req.i18n.__('usuario'),
			crear_cuenta_usuario : req.i18n.__('crear_cuenta_usuario'),
			recuperar : req.i18n.__('recuperar'),
			contraseña : req.i18n.__('contraseña'),
			nombre : req.i18n.__('nombre'),
			apellidos : req.i18n.__('apellidos'),
			username : req.i18n.__('username'),
			repetir_contraseña : req.i18n.__('repetir_contraseña'),
			email : req.i18n.__('email'),
			usuario_o_email : req.i18n.__('usuario_o_email'),
			enviar_email : req.i18n.__('enviar_email'),
			recuperar_contraseña_info : req.i18n.__('recuperar_contraseña_info'),
			acciones : req.i18n.__('acciones'),
			denuncias_fav : req.i18n.__('denuncias_fav'),
			nueva : req.i18n.__('nueva'),
			localizacion : req.i18n.__('localizacion'),
			perfil : req.i18n.__('perfil'),
			editar : req.i18n.__('editar'),
			denuncia : req.i18n.__('denuncia'),

			distancia : req.i18n.__('distancia'),
			metros : req.i18n.__('metros'),
			usuario_like_denuncia : req.i18n.__('usuario_like_denuncia'),
			usuario_no_like_denuncia : req.i18n.__('usuario_no_like_denuncia'),
			comento : req.i18n.__('comento'),
			en_tu_denuncia : req.i18n.__('en_tu_denuncia'),
			usuario_add_denuncia_cerca : req.i18n.__('usuario_add_denuncia_cerca'),

			has_realizado : req.i18n.__('has_realizado'),
			has_publicado_denuncia_cerca : req.i18n.__('has_publicado_denuncia_cerca'),
			te_han_gustado : req.i18n.__('te_han_gustado'),
			comentaste : req.i18n.__('comentaste'),
			en_la_denuncia_de : req.i18n.__('en_la_denuncia_de'),
			me_gusta_denuncia : req.i18n.__('me_gusta_denuncia'),
			no_me_gusta_denuncia : req.i18n.__('no_me_gusta_denuncia'),
			usuario_invitado : req.i18n.__('usuario_invitado'),
			ir_a_denuncia : req.i18n.__('ir_a_denuncia'),


		}
	}
};

exports.getTranslations = function(req, res){
	//console.log(cont[url.parse(req.url).pathname](req));
	/*switch(url.parse(req.url).pathname.split('#')[0]){
		case '/app' : return cont['/app'](req);break;
		case '/app/' : return 
		cont['/app'](req);break;
	}*/
	return cont['/app'](req);
	
}