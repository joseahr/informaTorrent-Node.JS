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
					st_asgeojson(u2.location_pref)::json as location_pref,
					u2.distancia_aviso
					FROM replicas re, usuarios u2 
					WHERE re.id_comentario = c.id AND re.id_usuario = u2._id ORDER BY fecha DESC)r)
		FROM comentarios c, usuarios u 
		WHERE c.id_usuario = u._id and c.id_denuncia = d.gid ORDER BY fecha DESC) com
	),
	(SELECT json_agg(img) AS imagenes FROM  (SELECT * FROM imagenes WHERE id_denuncia = d.gid) img),
	ST_AsGML(dpu.geom_pt)::xml AS geometria_pt,
	ST_AsGML(dli.geom_li)::xml AS geometria_li,
	ST_AsGML(dpo.geom_po)::xml AS geometria_po
FROM denuncias d
LEFT JOIN LATERAL (SELECT the_geom as geom_pt FROM denuncias_puntos where gid = d.gid) dpu ON true
LEFT JOIN LATERAL (SELECT the_geom as geom_li FROM denuncias_lineas where gid = d.gid) dli ON true
LEFT JOIN LATERAL (SELECT the_geom as geom_po FROM denuncias_poligonos where gid = d.gid) dpo ON true
)x WHERE
