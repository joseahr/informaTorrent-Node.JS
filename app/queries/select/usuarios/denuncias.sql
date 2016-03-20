SELECT * FROM (SELECT *,
	(SELECT json_agg(usuarios) FROM usuarios, likes where usuarios._id = likes.id_usuario AND likes.id_denuncia = denuncias_puntos.gid) AS likes, 
	(SELECT json_agg(t_) AS tags_ FROM  (SELECT * FROM tags WHERE id_denuncia = denuncias_puntos.gid) t_),
	(SELECT json_agg(usuarios) AS usuario FROM  (SELECT * FROM usuarios WHERE _id = denuncias_puntos.id_usuario) usuarios),
	(SELECT json_agg(com) AS comentarios FROM (SELECT c.*, u.* FROM comentarios c, usuarios u 
		WHERE c.id_usuario = u._id and c.id_denuncia = denuncias_puntos.gid ORDER BY fecha DESC) com),
	(SELECT json_agg(img) AS imagenes FROM  (SELECT * FROM imagenes WHERE id_denuncia = denuncias_puntos.gid) img),
	ST_AsGeoJSON(the_geom)::json AS geometria
FROM denuncias_puntos
UNION ALL
SELECT *, 
	(SELECT json_agg(usuarios) FROM usuarios, likes where usuarios._id = likes.id_usuario AND likes.id_denuncia = denuncias_lineas.gid) AS likes, 
	(SELECT json_agg(t_) AS tags_ FROM  (SELECT * FROM tags WHERE id_denuncia = denuncias_lineas.gid) t_),
	(SELECT json_agg(usuarios) AS usuario FROM  (SELECT * FROM usuarios WHERE _id = denuncias_lineas.id_usuario) usuarios),
	(SELECT json_agg(com) AS comentarios FROM (SELECT c.*, u.* FROM comentarios c, usuarios u 
		WHERE c.id_usuario = u._id and c.id_denuncia = denuncias_lineas.gid ORDER BY fecha DESC) com),
	(SELECT json_agg(img) AS imagenes FROM  (SELECT * FROM imagenes WHERE id_denuncia = denuncias_lineas.gid) img),
	ST_AsGeoJSON(the_geom)::json as geometria
FROM denuncias_lineas
UNION ALL
SELECT *, 
	(SELECT json_agg(usuarios) FROM usuarios, likes where usuarios._id = likes.id_usuario AND likes.id_denuncia = denuncias_poligonos.gid) AS likes, 
	(SELECT json_agg(t_) AS tags_ FROM  (SELECT * FROM tags WHERE id_denuncia = denuncias_poligonos.gid) t_),
	(SELECT json_agg(usuarios) AS usuario FROM  (SELECT * FROM usuarios WHERE _id = denuncias_poligonos.id_usuario) usuarios),
	(SELECT json_agg(com) AS comentarios FROM (SELECT c.*, u.* FROM comentarios c, usuarios u 
		WHERE c.id_usuario = u._id and c.id_denuncia = denuncias_poligonos.gid ORDER BY fecha DESC) com),
	(SELECT json_agg(img) AS imagenes FROM  (SELECT * FROM imagenes WHERE id_denuncia = denuncias_poligonos.gid) img),
	ST_AsGeoJSON(the_geom)::json as geometria
FROM denuncias_poligonos)x WHERE id_usuario = $1 ORDER BY fecha DESC
