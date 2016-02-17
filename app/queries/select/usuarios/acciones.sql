select n.*, 
	u.profile as profile_to, denuncia.*, denuncia1.*, denuncia2.*
from notificaciones n, usuarios u
FULL JOIN LATERAL(select json_agg(den) as denuncia_punto from (select *, st_asgeojson(the_geom) as geometria from denuncias_puntos where gid = n.id_denuncia)den) denuncia ON true
FULL JOIN LATERAL(select json_agg(den) as denuncia_linea from (select *, st_asgeojson(the_geom) as geometria from denuncias_lineas where gid = n.id_denuncia)den) denuncia1 ON true
FULL JOIN LATERAL(select json_agg(den) as denuncia_poligono from (select *, st_asgeojson(the_geom) as geometria from denuncias_poligonos where gid = n.id_denuncia)den) denuncia2 ON true
where n.id_usuario_from=$1 and n.id_usuario_to=u._id order by n.fecha desc