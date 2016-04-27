var url = require('url');

var cont = {
	'/app' : function(req){
		return {
			// A
			acciones : req.i18n.__('acciones'),
			apellidos : req.i18n.__('apellidos'),
			al_menos_id : req.i18n.__('al_menos_id'),
			accion : req.i18n.__('accion'),
			aceptar : req.i18n.__('aceptar'),
			add_comentario : req.i18n.__('add_comentario'),
			// B
			// C
			crear_cuenta_usuario : req.i18n.__('crear_cuenta_usuario'),
			cerrar_sesion : req.i18n.__('cerrar_sesion'),
			contraseña : req.i18n.__('contraseña'),
			comento : req.i18n.__('comento'),
			comentaste : req.i18n.__('comentaste'),
			cancelar : req.i18n.__('cancelar'),
			comentarios : req.i18n.__('comentarios'),
			contiene : req.i18n.__('contiene'),
			comentarios_no_tiene : req.i18n.__('comentarios_no_tiene'),
			// D
			denuncias_fav : req.i18n.__('denuncias_fav'),
			denuncias : req.i18n.__('denuncias'),
			denuncia : req.i18n.__('denuncia'),
			distancia : req.i18n.__('distancia'),
			// E
			email : req.i18n.__('email'),
			enviar_email : req.i18n.__('enviar_email'),
			editar : req.i18n.__('editar'),
			en_tu_denuncia : req.i18n.__('en_tu_denuncia'),
			en_la_denuncia_de : req.i18n.__('en_la_denuncia_de'),
			en_una_conversacion : req.i18n.__('en_una_conversacion'),
			// F
			// G
			// H
			has_realizado : req.i18n.__('has_realizado'),
			has_publicado_denuncia_cerca : req.i18n.__('has_publicado_denuncia_cerca'),
			has_publicado : req.i18n.__('has_publicado'),
			// I
			inicio : req.i18n.__('inicio'),
			iniciar_sesion : req.i18n.__('iniciar_sesion'),
			inicia_sesion_info : req.i18n.__('inicia_sesion_info'),
			inicia_sesion_rs : req.i18n.__('inicia_sesion_rs'),
			ir_a_denuncia : req.i18n.__('ir_a_denuncia'),
			idioma : req.i18n.__('idioma'),
			// J
			// K
			// L
			localizacion : req.i18n.__('localizacion'),
			logeado_para_comentar : req.i18n.__('logeado_para_comentar'),
			// M
			mi_perfil : req.i18n.__('mi_perfil'),
			metros : req.i18n.__('metros'),
			me_gusta_denuncia : req.i18n.__('me_gusta_denuncia'),
			// N
			nuevo : req.i18n.__('nuevo'),
			notificaciones : req.i18n.__('notificaciones'),
			nueva_denuncia : req.i18n.__('nueva_denuncia'),
			nombre : req.i18n.__('nombre'),
			nueva : req.i18n.__('nueva'),
			no_me_gusta_denuncia : req.i18n.__('no_me_gusta_denuncia'),
			noti_sin_leer : req.i18n.__('noti_sin_leer'),
			notis_sin_leer : req.i18n.__('notis_sin_leer'),
			// O
			olvidaste : req.i18n.__('olvidaste'),
			// P
			perfil : req.i18n.__('perfil'),
			// Q
			// R
			registrarse : req.i18n.__('registrarse'),
			repetir_contraseña : req.i18n.__('repetir_contraseña'),
			recuperar : req.i18n.__('recuperar'),
			recuperar_contraseña_info : req.i18n.__('recuperar_contraseña_info'),
			ruta_no_encontrada : req.i18n.__('ruta_no_encontrada'),
			// S
			slogan : req.i18n.__('slogan'),
			subtitulo : req.i18n.__('subtitulo_app'),
			seguro_eliminar_denuncia : req.i18n.__('seguro_eliminar_denuncia'),
			se_el_primero : req.i18n.__('se_el_primero'),
			// T
			titulo : req.i18n.__('titulo_app'),
			te_han_gustado : req.i18n.__('te_han_gustado'),
			te_ha_gustado : req.i18n.__('te_ha_gustado'),
			tienes : req.i18n.__('tienes'),
			// U
			username : req.i18n.__('username'),
			usuario : req.i18n.__('usuario'),
			usuario_o_email : req.i18n.__('usuario_o_email'),
			usuario_like_denuncia : req.i18n.__('usuario_like_denuncia'),
			usuario_no_like_denuncia : req.i18n.__('usuario_no_like_denuncia'),
			usuario_add_denuncia_cerca : req.i18n.__('usuario_add_denuncia_cerca'),
			usuario_invitado : req.i18n.__('usuario_invitado'),
			// V
			visor_tiempo_real : req.i18n.__('visor_tiempo_real'),
			// W
			// X
			// Y
			// Z

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