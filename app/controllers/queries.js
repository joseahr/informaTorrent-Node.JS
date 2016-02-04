var helper = require('../queries/helper.js');
module.exports = {
		
		obtener_info_tabla_geoportal : helper.select.geoportal.info_tabla,
		
		obtener_datos_app : helper.select.app.datos,
			
		obtener_notificaciones : helper.select.usuarios.notificaciones,
			
		obtener_acciones : helper.select.usuarios.acciones,
			
		añadir_comentario : helper.insert.denuncias.comentario,
		
		comprobar_geometria : function(wkt){
			if (wkt.match(/POINT/g))
				return helper.select.denuncias.comprobar_geometria_puntual;
			else if(wkt.match(/LINESTRING/g))
				return helper.select.denuncias.comprobar_geometria_lineal;
			else if(wkt.match(/POLYGON/g))
				return helper.select.denuncias.comprobar_geometria_poligonal;
		},
		
		añadir_denuncia : helper.insert.denuncias.nueva,
		
		añadir_imagen_denuncia : helper.insert.denuncias.imagen,
			
		añadir_tag_denuncia : helper.insert.denuncias.tag,
		
		obtener_denuncias_usuario : helper.select.usuarios.denuncias,
	  	
	  	numero_denuncias : helper.select.denuncias.num_total,
	  	
	  	obtener_denuncias_recientes_por_pagina : helper.select.denuncias.por_pagina,
  		
  		denuncia_por_id: helper.select.denuncias.por_id,
  		
	  	eliminar_imagen_denuncia : helper.delete.denuncias.imagen,	
	  		
	  	usuario_por_id : helper.select.usuarios.por_id, 
	  	
	  	usuario_por_username : helper.select.usuarios.por_username,
	  	
	  	actualizar_info_usuario : helper.update.usuarios.contraseña_perfil,
	  		
	  	actualizar_perfil : helper.update.usuarios.perfil,
  			
  		obtener_loc_preferida : helper.select.usuarios.localizacion_preferida,
		
  		actualizar_loc_pref : helper.update.usuarios.localizacion_preferida,
  			
  		denuncias_visor : helper.select.denuncias.visor,
	  	
	  	eliminar_denuncia_por_id : helper.delete.denuncias.por_id,
	  	
	  	actualizar_denuncia : helper.update.denuncias.por_id,
			
		usuario_por_email : helper.select.usuarios.por_email,
		
		usuario_por_email_o_username : helper.select.usuarios.por_email_o_username,
		
		usuario_por_id_facebook : helper.select.usuarios.por_id_facebook, 
		
		usuario_por_id_twitter : helper.select.usuarios.por_id_twitter, 
		
		actualizar_local_usuario : helper.update.usuarios.local,
  		
		usuario_por_password_reset_token : helper.select.usuarios.por_reset_token,
    		
    	perfil_otro_usuario : helper.select.usuarios.perfil_otro, 
    	
    	actualizar_password_reset_token : helper.update.usuarios.reset_token, 
        
        set_token_1_hora : helper.update.usuarios.token_hora, 	
		
		deslincar_twitter : helper.update.usuarios.deslincar_twitter, 
		
		deslincar_facebook : helper.update.usuarios.deslincar_facebook,  
		
		notificacion_vista : helper.update.usuarios.notificacion_vista,
		
		usuarios_cerca_de_denuncia : helper.select.usuarios.cerca_denuncia,
			
		notificar_denuncia_cerca : helper.insert.usuarios.notificaciones.denuncia_cerca,
		
		notificar_denuncia_comentada : helper.insert.usuarios.notificaciones.denuncia_comentada,
			
		denuncia_vista : helper.update.denuncias.vista,
		
		check_like_denuncia : helper.select.denuncias.me_gusta,
		
		insertar_like : helper.insert.denuncias.like,
		
		eliminar_like : helper.delete.denuncias.like,
		
		denuncias_sin_where : helper.select.denuncias.sin_where, 
		
	  	crear_usuario : helper.insert.usuarios.crear,
	  	
	  	set_facebook_usuario : helper.update.usuarios.facebook, 

	  	set_twitter_usuario : helper.update.usuarios.twitter, 	  	
	  	
}