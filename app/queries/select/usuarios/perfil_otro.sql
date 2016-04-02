select _id, 
	local, 
	profile, 
	st_asgeojson(location_pref)::json as location_pref,
	distancia_aviso 
from usuarios 
where _id = $1