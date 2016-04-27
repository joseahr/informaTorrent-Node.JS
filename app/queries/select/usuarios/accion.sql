SELECT n.*, 
	u.profile AS profile_to,
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
WHERE n.id_noti=$1
AND n.id_usuario_to = u._id