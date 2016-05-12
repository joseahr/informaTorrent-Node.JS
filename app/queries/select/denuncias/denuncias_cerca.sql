SELECT * FROM (SELECT *,
	(SELECT json_agg(u) FROM (
		SELECT _id, 
			local, 
			profile, 
			st_asgeojson(location_pref)::json as location_pref,
			distancia_aviso 
		FROM usuarios, likes 
		WHERE usuarios._id = likes.id_usuario AND likes.id_denuncia = d.gid
	)u) AS likes,
	(SELECT json_agg(t_) AS tags_ FROM  (SELECT * FROM tags WHERE id_denuncia = d.gid) t_),
	(SELECT json_agg(usuarios) AS usuario FROM  (
		SELECT _id, 
			local, 
			profile, 
			st_asgeojson(location_pref)::json as location_pref,
			distancia_aviso 
		FROM usuarios WHERE _id = d.id_usuario) usuarios
	),
	(SELECT json_agg(com) AS comentarios FROM (
		SELECT c.*, u._id, 
			u.local, 
			u.profile, 
			st_asgeojson(u.location_pref)::json as location_pref,
			u.distancia_aviso,
			(SELECT json_agg(r) AS replicas 
				FROM (
					SELECT re.*,u2.local, u2.profile, 
					st_asgeojson(u2.location_pref)::json as location_pref,
					u2.distancia_aviso
					FROM replicas re, usuarios u2 
					WHERE re.id_comentario = c.id AND re.id_usuario = u2._id ORDER BY fecha DESC)r)
		FROM comentarios c, usuarios u 
		WHERE c.id_usuario = u._id and c.id_denuncia = d.gid ORDER BY fecha DESC) com
	),
	(SELECT json_agg(img) AS imagenes FROM  (SELECT * FROM imagenes WHERE id_denuncia = d.gid) img),

	CASE WHEN (SELECT the_geom FROM denuncias_puntos WHERE gid = d.gid) IS NOT NULL
	THEN ST_AsGeoJSON((SELECT the_geom FROM denuncias_puntos WHERE gid = d.gid))::json
	WHEN (SELECT the_geom FROM denuncias_lineas WHERE gid = d.gid) IS NOT NULL
	THEN ST_AsGeoJSON((SELECT the_geom FROM denuncias_lineas WHERE gid = d.gid))::json
	WHEN (SELECT the_geom FROM denuncias_poligonos WHERE gid = d.gid) IS NOT NULL
	THEN ST_AsGeoJSON((SELECT the_geom FROM denuncias_poligonos WHERE gid = d.gid))::json
	END AS geometria,

	CASE WHEN (SELECT the_geom FROM denuncias_puntos WHERE gid = d.gid) IS NOT NULL
	THEN st_distance(
		(st_transform(st_geomfromtext($1,4258),25830)::geometry),
		(SELECT st_transform(the_geom, 25830)::geometry from denuncias_puntos WHERE gid = d.gid)
	)
	WHEN (SELECT the_geom FROM denuncias_lineas WHERE gid = d.gid) IS NOT NULL
	THEN st_distance(
		(st_transform(st_geomfromtext($1,4258),25830)::geometry),
		(SELECT st_transform(the_geom, 25830)::geometry from denuncias_lineas WHERE gid = d.gid)
	)	
	WHEN (SELECT the_geom FROM denuncias_poligonos WHERE gid = d.gid) IS NOT NULL
	THEN st_distance(
		(st_transform(st_geomfromtext($1,4258),25830)::geometry),
		(SELECT st_transform(the_geom, 25830)::geometry from denuncias_poligonos WHERE gid = d.gid)
	)	
	END AS distancia,

	CASE WHEN (SELECT the_geom FROM denuncias_puntos WHERE gid = d.gid) IS NOT NULL
	THEN ST_AsGeoJSON((SELECT the_geom FROM denuncias_puntos WHERE gid = d.gid))::json
	WHEN (SELECT the_geom FROM denuncias_lineas WHERE gid = d.gid) IS NOT NULL
	THEN ST_AsGeoJSON(ST_LineInterpolatePoint((SELECT the_geom FROM denuncias_lineas WHERE gid = d.gid), 0.5))::json
	WHEN (SELECT the_geom FROM denuncias_poligonos WHERE gid = d.gid AND ST_Intersects(ST_Centroid(the_geom),the_geom)) IS NOT NULL
	THEN ST_AsGeoJSON(ST_Centroid((SELECT the_geom FROM denuncias_poligonos WHERE gid = d.gid)))::json
	ELSE ST_AsGeoJSON(ST_PointOnSurface((SELECT the_geom FROM denuncias_poligonos WHERE gid = d.gid)))::json
	END AS centro
FROM denuncias d)x WHERE
st_distance(st_transform(st_geomfromtext($1,4258),25830) , st_transform(ST_SetSRID(ST_GeomFromGeoJSON(x.geometria::text), 4258),25830)) < 100
ORDER BY fecha DESC, distancia ASC
