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
			comprobar_geometria_poligonal : sql('select', 'denuncias/comprobar_geometria_poligonal.sql'),
			num_total : sql('select', 'denuncias/num_total.sql'),
			por_id : sql('select', 'denuncias/por_id.sql'),
			por_pagina : sql('select', 'denuncias/por_pagina.sql'),
			sin_where : sql('select', 'denuncias/sin_where.sql'),
			sin_where_gml : sql('select', 'denuncias/sin_where_gml.sql'),
			me_gusta : sql('select', 'denuncias/me_gusta.sql'),
			visor : sql('select', 'denuncias/visor.sql'),
			por_path_imagen : sql('select', 'denuncias/por_path_imagen.sql'),
			is_equal : sql('select', 'denuncias/is_equal.sql')
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
			por_reset_token : sql('select', 'usuarios/por_reset_token.sql'),
			por_username : sql('select', 'usuarios/por_username.sql'),
			denuncias_favoritas : sql('select', 'usuarios/denuncias_favoritas.sql'),
			noti_por_id : sql('select', 'usuarios/notificacion.sql'),
			accion_por_id : sql('select', 'usuarios/accion.sql'),
		}
	},
	insert : {
		denuncias : {
			comentario : sql('insert', 'denuncias/comentario.sql'),
			replica : sql('insert', 'denuncias/replica.sql'),
			imagen : sql('insert', 'denuncias/imagen.sql'),
			like : sql('insert', 'denuncias/like.sql'),
			tag : sql('insert', 'denuncias/tag.sql'), 
			punto : sql('insert', 'denuncias/punto.sql'),
			linea : sql('insert', 'denuncias/linea.sql'),
			poligono : sql('insert', 'denuncias/poligono.sql'),
			denuncia : sql('insert', 'denuncias/denuncia.sql'),
		},
		usuarios : {
			crear : sql('insert', 'usuarios/crear.sql'),
			notificaciones : {
				denuncia_cerca : sql('insert', 'usuarios/notificaciones/denuncia_cerca.sql'),
				denuncia_comentada : sql('insert', 'usuarios/notificaciones/denuncia_comentada.sql'),
				otras : sql('insert', 'usuarios/notificaciones/otras.sql'),
			}
		}
	},
	update : {
		denuncias : {
			punto :sql('update', 'denuncias/punto.sql'),
			linea :sql('update', 'denuncias/linea.sql'),
			poligono :sql('update', 'denuncias/poligono.sql'),
			denuncia : sql('update', 'denuncias/denuncia.sql'),
			vista : sql('update', 'denuncias/vista.sql'),
			titulo : sql('update', 'denuncias/set_titulo.sql'),
			contenido : sql('update', 'denuncias/set_contenido.sql')
		},
		usuarios : {
			contraseña : sql('update', 'usuarios/contraseña.sql'),
			deslincar_facebook : sql('update', 'usuarios/deslincar_facebook.sql'),
			deslincar_twitter : sql('update', 'usuarios/deslincar_twitter.sql'),
			facebook : sql('update', 'usuarios/facebook.sql'),
			local : sql('update', 'usuarios/local.sql'),
			localizacion_preferida : sql('update', 'usuarios/localizacion_preferida.sql'),
			distancia_aviso : sql('update', 'usuarios/distancia_aviso.sql'),
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
			punto : sql('delete', 'denuncias/punto.sql'),
			linea : sql('delete', 'denuncias/linea.sql'),
			poligono : sql('delete', 'denuncias/poligono.sql'),
			denuncia : sql('delete', 'denuncias/denuncia.sql'),
			tag : sql('delete', 'denuncias/tag.sql'),
			all : {
				tags : sql('delete', 'denuncias/all/tags.sql'),
				likes : sql('delete', 'denuncias/all/likes.sql'),
				comentarios : sql('delete', 'denuncias/all/comentarios.sql'),
				imagenes : sql('delete', 'denuncias/all/imagenes.sql'),
				notificaciones : sql('delete', 'denuncias/all/notificaciones.sql'),
			} 
		}
	}
}

module.exports = mis_consultas;
