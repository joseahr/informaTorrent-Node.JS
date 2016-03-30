SELECT * FROM (SELECT *,
	(SELECT json_agg(usuarios) FROM usuarios, likes where usuarios._id = likes.id_usuario AND likes.id_denuncia = d.gid) AS likes, 
	(SELECT json_agg(t_) AS tags_ FROM  (SELECT * FROM tags WHERE id_denuncia = d.gid) t_),
	(SELECT json_agg(usuarios) AS usuario FROM  (SELECT * FROM usuarios WHERE _id = d.id_usuario) usuarios),
	(SELECT json_agg(com) AS comentarios FROM (SELECT c.*, u.* FROM comentarios c, usuarios u 
		WHERE c.id_usuario = u._id and c.id_denuncia = d.gid ORDER BY fecha DESC) com),
	(SELECT json_agg(img) AS imagenes FROM  (SELECT * FROM imagenes WHERE id_denuncia = d.gid) img),
	ST_AsGeoJSON(dpu.the_geom)::json AS geometria_pt,
	ST_AsGeoJSON(dli.the_geom)::json AS geometria_li,
	ST_AsGeoJSON(dpo.the_geom)::json AS geometria_po
FROM denuncias d
LEFT JOIN LATERAL (SELECT the_geom FROM denuncias_puntos where gid = d.gid) dpu ON true
LEFT JOIN LATERAL (SELECT the_geom FROM denuncias_lineas where gid = d.gid) dli ON true
LEFT JOIN LATERAL (SELECT the_geom FROM denuncias_poligonos where gid = d.gid) dpo ON true)x 
WHERE x.fecha > (current_timestamp - interval '1 DAY') order by fecha DESC
