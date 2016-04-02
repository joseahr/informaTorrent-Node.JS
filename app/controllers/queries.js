var helper = require('../queries/helper.js');
module.exports = {
		
		//Insert

		crear_usuario : helper.insert.usuarios.crear,

		insertar_notificacion : helper.insert.usuarios.notificaciones.otras,

		notificar_denuncia_cerca : helper.insert.usuarios.notificaciones.denuncia_cerca,
		
		notificar_denuncia_comentada : helper.insert.usuarios.notificaciones.denuncia_comentada,



		añadir_comentario : helper.insert.denuncias.comentario,

		añadir_imagen_denuncia : helper.insert.denuncias.imagen,
			
		añadir_tag_denuncia : helper.insert.denuncias.tag,

		insertar_like : helper.insert.denuncias.like,

		insert_denuncia : helper.insert.denuncias.denuncia, 

		añadir_geometria : function(wkt){
			if (wkt.match(/POINT/g))
				return helper.insert.denuncias.punto;
			else if(wkt.match(/LINESTRING/g))
				return helper.insert.denuncias.linea;
			else if(wkt.match(/POLYGON/g))
				return helper.insert.denuncias.poligono;			
		},

		//Delete
		delete_all_tags : helper.delete.denuncias.all.tags,
		
		delete_all_likes : helper.delete.denuncias.all.likes,
		
		delete_all_comentarios : helper.delete.denuncias.all.comentarios,

		delete_all_notificaciones : helper.delete.denuncias.all.notificaciones,
		
		delete_all_imagenes : helper.delete.denuncias.all.imagenes,

		eliminar_imagen_denuncia : helper.delete.denuncias.imagen,

		eliminar_like : helper.delete.denuncias.like,

		eliminar_geometria_por_id : function(tipo){
			if (tipo.match(/Point/g))
				return helper.delete.denuncias.punto;
			else if(tipo.match(/LineString/g))
				return helper.delete.denuncias.linea;
			else if(tipo.match(/Polygon/g))
				return helper.delete.denuncias.poligono;
		},

		eliminar_denuncia : helper.delete.denuncias.denuncia,

		//Select

		check_like_denuncia : helper.select.denuncias.me_gusta,
		
		denuncias_sin_where : helper.select.denuncias.sin_where, 

		comprobar_geometria : function(wkt){
			if (wkt.match(/POINT/g))
				return helper.select.denuncias.comprobar_geometria_puntual;
			else if(wkt.match(/LINESTRING/g))
				return helper.select.denuncias.comprobar_geometria_lineal;
			else if(wkt.match(/POLYGON/g))
				return helper.select.denuncias.comprobar_geometria_poligonal;
		},

		numero_denuncias : helper.select.denuncias.num_total,
	  	
	  	obtener_denuncias_recientes_por_pagina : helper.select.denuncias.por_pagina,
  		
  		denuncia_por_id: helper.select.denuncias.por_id,	

  		denuncias_visor : helper.select.denuncias.visor,


		
		obtener_denuncias_usuario : helper.select.usuarios.denuncias,

		usuario_denuncias_favoritas : helper.select.usuarios.denuncias_favoritas,

		usuario_por_password_reset_token : helper.select.usuarios.por_reset_token,
    		
    	perfil_otro_usuario : helper.select.usuarios.perfil_otro, 

		obtener_notificaciones : helper.select.usuarios.notificaciones,
			
		obtener_acciones : helper.select.usuarios.acciones,

	  	usuario_por_id : helper.select.usuarios.por_id, 
	  	
	  	usuario_por_username : helper.select.usuarios.por_username,

	  	obtener_loc_preferida : helper.select.usuarios.localizacion_preferida,

	  	usuario_por_email : helper.select.usuarios.por_email,
		
		usuario_por_email_o_username : helper.select.usuarios.por_email_o_username,
		
		usuario_por_id_facebook : helper.select.usuarios.por_id_facebook, 
		
		usuario_por_id_twitter : helper.select.usuarios.por_id_twitter, 

		usuarios_cerca_de_denuncia : helper.select.usuarios.cerca_denuncia,



		obtener_info_tabla_geoportal : helper.select.geoportal.info_tabla,


		
		obtener_datos_app : helper.select.app.datos,

	  	//Update
	  	denuncia_vista : helper.update.denuncias.vista,
	  	
	  	actualizar_geometria : function(tipo){
			if (tipo.match(/Point/g))
				return helper.update.denuncias.punto;
			else if(tipo.match(/LineString/g))
				return helper.update.denuncias.linea;
			else if(tipo.match(/Polygon/g))
				return helper.update.denuncias.poligono;
		},

		actualizar_denuncia : helper.update.denuncias.denuncia,



	  	actualizar_info_usuario : helper.update.usuarios.contraseña_perfil,
	  		
	  	actualizar_perfil : helper.update.usuarios.perfil,
		
  		actualizar_loc_pref : helper.update.usuarios.localizacion_preferida,
		
		actualizar_local_usuario : helper.update.usuarios.local,
    	
    	actualizar_password_reset_token : helper.update.usuarios.reset_token, 
        
        set_token_1_hora : helper.update.usuarios.token_hora, 	
		
		deslincar_twitter : helper.update.usuarios.deslincar_twitter, 
		
		deslincar_facebook : helper.update.usuarios.deslincar_facebook,  
		
		notificacion_vista : helper.update.usuarios.notificacion_vista,
	  	
	  	set_facebook_usuario : helper.update.usuarios.facebook, 

	  	set_twitter_usuario : helper.update.usuarios.twitter, 	  	
	  	
}
