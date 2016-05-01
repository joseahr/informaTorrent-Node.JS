select _id,
	st_asgeojson(location_pref)::json as location,
	st_distance(st_transform(location_pref, 25830), st_transform(st_geomfromtext($1, 4258), 25830)) as distancia 
from usuarios 
where st_distance(st_transform(location_pref, 25830), st_transform(st_geomfromtext($1, 4258), 25830)) < distancia_aviso and _id <> $2