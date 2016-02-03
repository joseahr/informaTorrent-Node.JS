SELECT *,
	to_char(fecha::timestamp,'TMDay, DD TMMonth YYYY HH24:MI:SS') as fecha, 
	(select json_agg(usuarios) 
		from usuarios, likes 
		where usuarios._id = likes.id_usuario and likes.id_denuncia = denuncias.gid) 
	as likes, 
	ST_AsGeoJSON(the_geom) as geometria FROM denuncias 
LEFT   JOIN LATERAL (
	SELECT json_agg(com) AS comentarios 
	FROM  (SELECT c.id_usuario, 
				c.contenido, 
				to_char(c.fecha::timestamp,'TMDay, DD TMMonth YYYY a las HH24:MI:SS') as fecha, 
				u.* 
			FROM comentarios c, usuarios u 
			WHERE c.id_usuario = u._id and c.id_denuncia = denuncias.gid ORDER BY c.fecha DESC) com
) comentarios ON true 
LEFT   JOIN LATERAL (
	SELECT json_agg(img) AS imagenes 
	FROM  (SELECT *,
				to_char(fecha::timestamp,'TMDay, DD TMMonth YYYY') as fecha  
			FROM imagenes 
			WHERE id_denuncia = denuncias.gid) img
) imagenes ON true 
LEFT   JOIN LATERAL (
	SELECT json_agg(usuario) AS usuario 
	FROM  (SELECT * FROM usuarios WHERE _id = denuncias.id_usuario) usuario
) usuarios ON true 
LEFT   JOIN LATERAL (
	SELECT json_agg(t_) AS tags_ 
	FROM  (SELECT * FROM tags WHERE id_denuncia = denuncias.gid) t_
) tags ON true 
WHERE  gid=$1 ORDER BY denuncias.fecha DESC