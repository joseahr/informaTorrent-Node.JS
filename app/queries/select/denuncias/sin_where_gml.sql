SELECT * FROM (SELECT *,
	(SELECT json_agg(u) FROM (
		SELECT _id, 
			local, 
			profile, 
			ST_AsGML(location_pref)::xml as location_pref,
			distancia_aviso 
		FROM usuarios, likes 
		WHERE usuarios._id = likes.id_usuario AND likes.id_denuncia = d.gid
	)u) AS likes,
	(SELECT json_agg(t_) AS tags_ FROM  (SELECT * FROM tags WHERE id_denuncia = d.gid) t_),
	(SELECT json_agg(usuarios) AS usuario FROM  (
		SELECT _id, 
			local, 
			profile, 
			ST_AsGML(location_pref)::xml as location_pref,
			distancia_aviso 
		FROM usuarios WHERE _id = d.id_usuario) usuarios
	),
	(SELECT json_agg(com) AS comentarios FROM (
		SELECT c.*, u._id, 
			u.local, 
			u.profile, 
			ST_AsGML(u.location_pref)::xml as location_pref,
			u.distancia_aviso,
			(SELECT json_agg(r) AS replicas 
				FROM (
					SELECT re.*,u2.local, u2.profile, 
					ST_AsGML(u2.location_pref)::xml as location_pref,
					u2.distancia_aviso
					FROM replicas re, usuarios u2 
					WHERE re.id_comentario = c.id AND re.id_usuario = u2._id ORDER BY fecha DESC)r)
		FROM comentarios c, usuarios u 
		WHERE c.id_usuario = u._id and c.id_denuncia = d.gid ORDER BY fecha DESC) com
	),
	(SELECT json_agg(img) AS imagenes FROM  (SELECT * FROM imagenes WHERE id_denuncia = d.gid) img),
	CASE WHEN (SELECT the_geom FROM denuncias_puntos WHERE gid = d.gid) IS NOT NULL
	THEN ST_AsGML((SELECT the_geom FROM denuncias_puntos WHERE gid = d.gid))::xml
	WHEN (SELECT the_geom FROM denuncias_lineas WHERE gid = d.gid) IS NOT NULL
	THEN ST_AsGML((SELECT the_geom FROM denuncias_lineas WHERE gid = d.gid))::xml
	WHEN (SELECT the_geom FROM denuncias_poligonos WHERE gid = d.gid) IS NOT NULL
	THEN ST_AsGML((SELECT the_geom FROM denuncias_poligonos WHERE gid = d.gid))::xml
	END AS geometria,
	
	CASE WHEN (SELECT the_geom FROM denuncias_puntos WHERE gid = d.gid) IS NOT NULL
	THEN ST_AsGML((SELECT the_geom FROM denuncias_puntos WHERE gid = d.gid))::xml
	WHEN (SELECT the_geom FROM denuncias_lineas WHERE gid = d.gid) IS NOT NULL
	THEN ST_AsGML(ST_LineInterpolatePoint((SELECT the_geom FROM denuncias_lineas WHERE gid = d.gid), 0.5))::xml
	WHEN (SELECT the_geom FROM denuncias_poligonos WHERE gid = d.gid AND ST_Intersects(ST_Centroid(the_geom),the_geom)) IS NOT NULL
	THEN ST_AsGML(ST_Centroid((SELECT the_geom FROM denuncias_poligonos WHERE gid = d.gid)))::xml
	ELSE ST_AsGML(ST_PointOnSurface((SELECT the_geom FROM denuncias_poligonos WHERE gid = d.gid)))::xml
	END AS centro
FROM denuncias d)x WHERE
