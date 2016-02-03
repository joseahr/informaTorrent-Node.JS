var QueryFile = require('pg-promise').QueryFile;

function sql(operador, archivo){
	return new QueryFile('./app/queries/' + operador + '/' + archivo);
}

var mis_consultas = {
	select : {
		app : {
			datos : sql('select', 'app/datos.sql')
		},
		denuncias : {
			comprobar_geometria_puntual : sql('select', 'denuncias/comprobar_geometria_puntual.sql'),
			comprobar_geometria_lineal : sql('select', 'denuncias/comprobar_geometria_lineal.sql'),
			comprobar_geometria_puntual : sql('select', 'denuncias/comprobar_geometria_poligonal.sql'),
			num_total : sql('select', 'denuncias/num_total.sql'),
			por_id : sql('select', 'denuncias/por_id.sql'),
			por_pagina : sql('select', 'denuncias/por_pagina.sql'),
			sin_where : sql('select', 'denuncias/sin_where.sql'),
			me_gusta : sql('select', 'denuncias/me_gusta.sql'),
			visor : sql('select', 'denuncias/visor.sql'),
		},
		geoportal : {
			info_tabla : sql('select', 'geoportal/info_tabla.sql')
		},
		usuarios : {
			acciones : sql('select', 'usuarios/acciones.sql'),
			cerca_denuncia : sql('select', 'usuarios/cerca_denuncia.sql'),
			denuncias : sql('select', 'usuarios/denuncias.sql'),
			localizacion_preferida : sql('select', 'usuarios/localizacion_preferida.sql'),
			notificaciones : sql('select', 'usuarios/notificaciones.sql'),
			perfil_otro : sql('select', 'usuarios/perfil_otro.sql'),
			por_email_o_username : sql('select', 'usuarios/por_email_o_username.sql'),
			por_email : sql('select', 'usuarios/por_email.sql'),
			por_id_facebook : sql('select', 'usuarios/por_id_facebook.sql'),
			por_id_twitter : sql('select', 'usuarios/por_id_twitter.sql'),
			por_id : sql('select', 'usuarios/por_id.sql'),
			por_reset_token : sql('select', 'usuarios/por_reset_toke.sql'),
			por_username : sql('select', 'usuarios/por_username.sql')
		}
	},
	insert : {
		denuncias : {
			comentario : sql('insert', 'denuncias/comentario.sql'),
			imagen : sql('insert', 'denuncias/imagen.sql'),
			like : sql('insert', 'denuncias/like.sql'),
			nueva : sql('insert', 'denuncias/nueva.sql'),
			tag : sql('insert', 'denuncias/tag.sql')
		},
		usuarios : {
			crear : sql('insert', 'usuarios/crear.sql'),
			notificacion : sql('insert', 'usuarios/notificacion.sql')
		}
	},
	update : {
		denuncias : {
			por_id :sql('update', 'denuncias/por_id.sql'),
			vista : sql('update', 'denuncias/vista.sql')
		},
		usuarios : {
			contraseña_perfil : sql('update', 'usuarios/contraseña_perfil.sql'),
			deslincar_facebook : sql('update', 'usuarios/deslincar_facebook.sql'),
			deslincar_twitter : sql('update', 'usuarios/deslincar_twitter.sql'),
			facebook : sql('update', 'usuarios/facebook.sql'),
			local : sql('update', 'usuarios/local.sql'),
			localizacion_preferida : sql('update', 'usuarios/localizacion_preferida.sql'),
			notificacion_vista : sql('update', 'usuarios/notificacion_vista.sql'),
			perfil : sql('update', 'usuarios/perfil.sql'),
			reset_token : sql('update', 'usuarios/reset_token.sql'),
			token_hora : sql('update', 'usuarios/token_hora.sql'),
			twitter : sql('update', 'usuarios/twitter.sql')
		}
	},
	delete : {
		denuncias : {
			imagen : sql('delete', 'denuncias/imagen.sql'),
			like : sql('delete', 'denuncias/like.sql'),
			por_id : sql('delete', 'denuncias/por_id.sql')
		}
	}
}

module.exports = mis_consultas;