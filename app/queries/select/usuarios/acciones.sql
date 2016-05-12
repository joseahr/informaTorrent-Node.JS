SELECT n.*, 
	u.profile AS profile_to,
	d.* as denuncia
FROM notificaciones n, usuarios u
LEFT JOIN LATERAL(
	SELECT json_agg(ddd)::json as denuncia FROM (SELECT dd.*,
	CASE WHEN (SELECT the_geom FROM denuncias_puntos WHERE gid = dd.gid) IS NOT NULL
	THEN st_asgeojson((SELECT the_geom FROM denuncias_puntos WHERE gid = dd.gid))::json
	WHEN (SELECT the_geom FROM denuncias_lineas WHERE gid = dd.gid) IS NOT NULL
	THEN st_asgeojson((SELECT the_geom FROM denuncias_lineas WHERE gid = dd.gid))::json
	WHEN (SELECT the_geom FROM denuncias_poligonos WHERE gid = dd.gid) IS NOT NULL
	THEN st_asgeojson((SELECT the_geom FROM denuncias_poligonos WHERE gid = dd.gid))::json
	END AS geometria
	FROM denuncias dd
	WHERE n.id_denuncia = gid
	)ddd
) d ON true
WHERE n.id_usuario_from=$1 AND n.id_usuario_to=u._id 
ORDER BY n.fecha DESC