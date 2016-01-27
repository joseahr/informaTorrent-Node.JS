module.exports = {
		
		obtener_info_tabla_geoportal : "select column_name as nombre, data_type as tipo " +
			"from information_schema.columns " +
			"where column_name <> 'geom' and table_name=$1",
		
		obtener_datos_app : "select t1.cnt as num_denun_total, "+
			"t2.cnt as num_denun_hoy, t3.cnt as num_usuarios_total " + 
			"from (select count(*) as cnt from denuncias) as t1 " + 
			"cross join (select count(*) as cnt from denuncias " +
			"where fecha >= to_char(current_timestamp, 'YYYY-MM-DD')::date) as t2 " +
			"cross join (select count(*) as cnt from usuarios) as t3",
			
		obtener_notificaciones : "select n.*, " +
			"to_char(n.fecha::timestamp,'DD TMMonth YYYY HH24:MI:SS') as fecha, " +
			"u.profile as profile_from from notificaciones n, usuarios u " +
			"where n.id_usuario_to=$1 and n.id_usuario_from=u._id order by n.fecha desc",
			
		obtener_acciones : "select n.*, " +
			"to_char(n.fecha::timestamp,'DD TMMonth YYYY HH24:MI:SS') as fecha, " +
			"u.profile as profile_to from notificaciones n, usuarios u " +
			"where n.id_usuario_from=$1 and n.id_usuario_to=u._id order by n.fecha desc",
			
		añadir_comentario : "insert into comentarios(id_usuario, id_denuncia, contenido) " +
			"VALUES($1, $2, $3)",
		
		comprobar_geometria : function(wkt){
			if (wkt.match(/POINT/g))
				return "select st_contains(muni_torrent.geom, st_geomfromtext('"+ wkt +"',4258)) " +
				"from muni_torrent";
			else if(wkt.match(/LINESTRING/g))
				return "select st_contains(muni_torrent.geom, st_geomfromtext('"+ wkt +"',4258)), " +
				"st_length(st_transform(st_geomfromtext('"+ wkt +"',4258) , 25830)) from muni_torrent";
			else if(wkt.match(/POLYGON/g))
				return "select st_contains(muni_torrent.geom, st_geomfromtext('"+ wkt +"',4258)), " +
				"st_area(st_transform(st_geomfromtext('"+ wkt +"',4258) , 25830)) from muni_torrent";
		},
		
		añadir_denuncia : "insert into denuncias" +
			"(titulo, descripcion, the_geom, id_usuario) " + 
			"VALUES($1, $2, ST_GeomFromText($3,4258), $4) returning gid",
		
		añadir_imagen_denuncia : "insert into imagenes" +
			"(path, id_denuncia, id_usuario) " +
			"VALUES($1, $2, $3)",
			
		añadir_tag_denuncia : "insert into tags(id_denuncia, tag) " +
			"VALUES($1, $2)",
		
		obtener_denuncias_usuario : "SELECT *,to_char(fecha::timestamp,'TMDay, DD TMMonth YYYY HH24:MI:SS') as fecha, " +
			"(select count(*) from likes where id_denuncia = denuncias.gid) as likes, " +
	  		"ST_AsGeoJSON(the_geom) as geometria FROM denuncias " +
	  		"LEFT   JOIN LATERAL (" +
	  		"SELECT json_agg(com) AS comentarios " +
	  		"FROM  (SELECT id_usuario, contenido, to_char(fecha::timestamp,'TMDay, DD TMMonth YYYY HH24:MI:SS') as fecha FROM comentarios WHERE id_denuncia = denuncias.gid ORDER BY fecha DESC) com" +
	  		") comentarios ON true " +
	  		"LEFT   JOIN LATERAL (" +
	  		"SELECT json_agg(img) AS imagenes " +
	  		"FROM  (SELECT *,to_char(fecha::timestamp,'TMDay, DD TMMonth YYYY') as fecha  FROM imagenes WHERE id_denuncia = denuncias.gid) img" +
	  		") imagenes ON true " +
	  		"LEFT   JOIN LATERAL (" +
	  		"SELECT json_agg(t_) AS tags_ " +
	  		"FROM  (SELECT * FROM tags WHERE id_denuncia = denuncias.gid) t_" +
	  		") tags ON true " +
	  		"WHERE  id_usuario=$1 ORDER BY denuncias.fecha DESC" ,
	  	
	  	numero_denuncias : "select count(*) as numdenuncias from denuncias",
	  	
	  	obtener_denuncias_recientes_por_pagina : "SELECT *,to_char(fecha::timestamp,'TMDay, DD TMMonth YYYY HH24:MI:SS') as fecha, (select count(*) from likes where id_denuncia = denuncias.gid) as likes, " +
	  		"ST_AsGeoJSON(the_geom) as geometria FROM denuncias " +
	  		"LEFT   JOIN LATERAL (" +
	  		"SELECT json_agg(com) AS comentarios " +
	  		"FROM  (SELECT c.id_usuario, c.contenido, to_char(c.fecha::timestamp,'TMDay, DD TMMonth YYYY a las HH24:MI:SS') as fecha, u.* FROM comentarios c, usuarios u WHERE c.id_usuario = u._id and c.id_denuncia = denuncias.gid ORDER BY fecha DESC) com" +
	  		") comentarios ON true " +
	  		"LEFT   JOIN LATERAL (" +
	  		"SELECT json_agg(img) AS imagenes " +
	  		"FROM  (SELECT *,to_char(fecha::timestamp,'TMDay, DD TMMonth YYYY') as fecha  FROM imagenes WHERE id_denuncia = denuncias.gid) img" +
	  		") imagenes ON true " +
	  		"LEFT   JOIN LATERAL (" +
	  		"SELECT json_agg(usuarios) AS usuario " +
	  		"FROM  (SELECT * FROM usuarios WHERE _id = denuncias.id_usuario) usuarios" +
	  		") usuarios ON true " +
	  		"LEFT   JOIN LATERAL (" +
	  		"SELECT json_agg(t_) AS tags_ " +
	  		"FROM  (SELECT * FROM tags WHERE id_denuncia = denuncias.gid) t_" +
	  		") tags ON true " +
	  		"ORDER BY denuncias.fecha DESC limit 10 offset ($1 - 1)*10",
  		
  		denuncia_por_id: "SELECT *,to_char(fecha::timestamp,'TMDay, DD TMMonth YYYY HH24:MI:SS') as fecha, (select json_agg(usuarios) from usuarios, likes where usuarios._id = likes.id_usuario and likes.id_denuncia = denuncias.gid) as likes, " +
	  		"ST_AsGeoJSON(the_geom) as geometria FROM denuncias " +
	  		"LEFT   JOIN LATERAL (" +
	  		"SELECT json_agg(com) AS comentarios " +
	  		"FROM  (SELECT c.id_usuario, c.contenido, to_char(c.fecha::timestamp,'TMDay, DD TMMonth YYYY a las HH24:MI:SS') as fecha, u.* FROM comentarios c, usuarios u WHERE c.id_usuario = u._id and c.id_denuncia = denuncias.gid ORDER BY c.fecha DESC) com" +
	  		") comentarios ON true " +
	  		"LEFT   JOIN LATERAL (" +
	  		"SELECT json_agg(img) AS imagenes " +
	  		"FROM  (SELECT *,to_char(fecha::timestamp,'TMDay, DD TMMonth YYYY') as fecha  FROM imagenes WHERE id_denuncia = denuncias.gid) img" +
	  		") imagenes ON true " +
	  		"LEFT   JOIN LATERAL (" +
	  		"SELECT json_agg(usuario) AS usuario " +
	  		"FROM  (SELECT * FROM usuarios WHERE _id = denuncias.id_usuario) usuario" +
	  		") usuarios ON true " +
	  		"LEFT   JOIN LATERAL (" +
	  		"SELECT json_agg(t_) AS tags_ " +
	  		"FROM  (SELECT * FROM tags WHERE id_denuncia = denuncias.gid) t_" +
	  		") tags ON true " +
	  		"WHERE  gid=$1 ORDER BY denuncias.fecha DESC" ,
  		
	  	eliminar_imagen_denuncia : "delete from imagenes where path=$1" ,	
	  		
	  	usuario_por_id : "select * from usuarios where _id = $1", 
	  	
	  	usuario_por_username : "select * from usuarios where profile ->> 'username' = $1",
	  	
	  	actualizar_info_usuario : "update usuarios set (password, profile) = " +
	  		"($1, $2) where _id=$3",
	  		
	  	actualizar_perfil : "update usuarios set profile = " +
  			"$1 where _id=$2",
  			
  		obtener_loc_preferida : "select st_asgeojson(location_pref) as loc_pref from usuarios where _id=$1",
		
  		actualizar_loc_pref : "update usuarios set (location_pref, distancia_aviso) = " +
  			"(st_geomfromtext($1, 4258),$2) where _id=$3",
  			
  		denuncias_visor : "SELECT *,to_char(fecha::timestamp,'TMDay, DD TMMonth YYYY HH24:MI:SS') as fecha, (select count(*) from likes where id_denuncia = denuncias.gid) as likes, " +
	  		"ST_AsGeoJSON(the_geom) as geometria FROM denuncias " +
	  		"LEFT   JOIN LATERAL (" +
	  		"SELECT json_agg(com) AS comentarios " +
	  		"FROM  (SELECT c.id_usuario, c.contenido, to_char(c.fecha::timestamp,'TMDay, DD TMMonth YYYY a las HH24:MI:SS') as fecha, u.* FROM comentarios c, usuarios u WHERE c.id_usuario = u._id and c.id_denuncia = denuncias.gid ORDER BY fecha DESC) com" +
	  		") comentarios ON true " +
	  		"LEFT   JOIN LATERAL (" +
	  		"SELECT json_agg(img) AS imagenes " +
	  		"FROM  (SELECT *,to_char(fecha::timestamp,'TMDay, DD TMMonth YYYY') as fecha  FROM imagenes WHERE id_denuncia = denuncias.gid) img" +
	  		") imagenes ON true " +
	  		"LEFT   JOIN LATERAL (" +
	  		"SELECT json_agg(usuarios) AS usuario " +
	  		"FROM  (SELECT * FROM usuarios WHERE _id = denuncias.id_usuario) usuarios" +
	  		") usuarios ON true " +
	  		"LEFT   JOIN LATERAL (" +
	  		"SELECT json_agg(t_) AS tags_ " +
	  		"FROM  (SELECT * FROM tags WHERE id_denuncia = denuncias.gid) t_" +
	  		") tags ON true " +
	  		"WHERE denuncias.fecha > current_timestamp - interval '1 DAY' order by denuncias.fecha DESC" ,
	  	
	  	eliminar_denuncia_por_id : "delete from denuncias where gid=$1",
	  	
	  	actualizar_denuncia : "UPDATE denuncias SET (titulo, descripcion, the_geom) = "
			+ "($1, $2, st_geomfromtext($3,4258))" +
			" WHERE gid=$4" ,
			
		usuario_por_email : "select * from usuarios where local ->> 'email' = $1" ,
		
		usuario_por_email_o_username : "select * from usuarios where lower(local ->> 'email') = $1 or lower(profile ->> 'username') = $1",
				
		actualizar_local_usuario : "UPDATE usuarios SET local= $1 where _id = $2",
  		
		usuario_por_password_reset_token : "select * from usuarios where " +
    		"resetPasswordToken=$1 and " +
    		"resetPasswordExpires > CURRENT_TIMESTAMP" ,
    		
    	perfil_otro_usuario : "select local, profile, st_as_geojson(location_pref) as location_pref, " +
    		"distancia_aviso from usuarios where _id = $1 " , 
    	
    	actualizar_password_reset_token : "UPDATE usuarios SET (password,resetPasswordToken,resetPasswordExpires) " +
        	"= ($1, '', '') WHERE _id = $2" , 
        
        set_token_1_hora : "update usuarios SET (resetPasswordToken, resetPasswordExpires) " +
			"= ($1, CURRENT_TIMESTAMP + interval '1 hour') WHERE _id=$2" , 	
		
		deslincar_twitter : "UPDATE usuarios SET twitter = NULL WHERE _id = $1" , 
		
		deslincar_facebook : "UPDATE usuarios SET facebook = NULL WHERE _id = $1" ,  
}