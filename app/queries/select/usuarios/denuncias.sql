SELECT *,
	to_char(fecha::timestamp,'TMDay, DD TMMonth YYYY HH24:MI:SS') as fecha,
	(select count(*) from likes where id_denuncia = denuncias.gid) as likes,
	ST_AsGeoJSON(the_geom) as geometria 
FROM denuncias
LEFT   JOIN LATERAL (
	SELECT json_agg(com) AS comentarios
	FROM  (SELECT id_usuario, 
				contenido, 
				to_char(fecha::timestamp,'TMDay, DD TMMonth YYYY HH24:MI:SS') as fecha 
			FROM comentarios WHERE id_denuncia = denuncias.gid ORDER BY fecha DESC) com
) comentarios ON true
LEFT   JOIN LATERAL (
	SELECT json_agg(img) AS imagenes
	FROM  (SELECT *,
				to_char(fecha::timestamp,'TMDay, DD TMMonth YYYY') as fecha  
			FROM imagenes WHERE id_denuncia = denuncias.gid) img
) imagenes ON true
LEFT   JOIN LATERAL (
	SELECT json_agg(t_) AS tags_
	FROM  (SELECT * FROM tags WHERE id_denuncia = denuncias.gid) t_
) tags ON true
WHERE  id_usuario = $1 ORDER BY denuncias.fecha DESC