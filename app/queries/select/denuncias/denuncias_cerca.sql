SELECT * FROM (SELECT *,
	(
		SELECT st_distance(
			(SELECT st_transform(st_geomfromtext($1,4258),25830)::geometry  from usuarios WHERE _id = d.id_usuario),
			(SELECT st_transform(the_geom, 25830)::geometry from denuncias_puntos WHERE gid = d.gid)
		) as distancia_punto
	),
	(
		SELECT st_distance(
			(SELECT st_transform(st_geomfromtext($1,4258),25830)::geometry from usuarios WHERE _id = d.id_usuario),
			(SELECT st_transform(the_geom, 25830)::geometry from denuncias_lineas WHERE gid = d.gid)
		) as distancia_linea
	),
	(
		SELECT st_distance(
			(SELECT st_transform(st_geomfromtext($1,4258),25830)::geometry from usuarios WHERE _id = d.id_usuario),
			(SELECT st_transform(the_geom, 25830)::geometry from denuncias_poligonos WHERE gid = d.gid)
		) as distancia_poligono
	),
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
	ST_AsGeoJSON(dpu.geom_pt)::json AS geometria_pt,
	ST_AsGeoJSON(dli.geom_li)::json AS geometria_li,
	ST_AsGeoJSON(dpo.geom_po)::json AS geometria_po
FROM denuncias d
LEFT JOIN LATERAL (SELECT the_geom as geom_pt FROM denuncias_puntos where gid = d.gid) dpu ON true
LEFT JOIN LATERAL (SELECT the_geom as geom_li FROM denuncias_lineas where gid = d.gid) dli ON true
LEFT JOIN LATERAL (SELECT the_geom as geom_po FROM denuncias_poligonos where gid = d.gid) dpo ON true
)x WHERE
(st_distance(st_transform(st_geomfromtext($1,4258),25830) , st_transform(x.geom_pt,25830)) < 100 or 
st_distance(st_transform(st_geomfromtext($1,4258),25830) , st_transform(x.geom_li,25830)) < 100 or
st_distance(st_transform(st_geomfromtext($1,4258),25830) , st_transform(x.geom_po,25830)) < 100)
order by fecha desc, distancia_punto asc, distancia_linea asc, distancia_poligono asc
