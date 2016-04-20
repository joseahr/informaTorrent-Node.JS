SELECT n.*, 
	u.profile AS profile_from,
	d.* as denuncia
FROM notificaciones n, usuarios u
LEFT JOIN LATERAL(
	SELECT json_agg(ddd)::json as denuncia FROM (SELECT dd.*,
	st_asgeojson(dpu.the_geom)::json as geometria_pu,
	st_asgeojson(dli.the_geom)::json as geometria_li,
	st_asgeojson(dpo.the_geom)::json as geometria_po
	FROM denuncias dd
	LEFT JOIN LATERAL (SELECT the_geom FROM denuncias_puntos WHERE gid = dd.gid) dpu ON true
	LEFT JOIN LATERAL (SELECT the_geom FROM denuncias_lineas WHERE gid = dd.gid) dli ON true
	LEFT JOIN LATERAL (SELECT the_geom FROM denuncias_poligonos WHERE gid = dd.gid) dpo ON true
	WHERE n.id_denuncia = gid
	)ddd
) d ON true
WHERE n.id_usuario_from=u._id 
AND n.id_noti = $1
ORDER BY n.fecha DESC