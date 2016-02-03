select local, 
	profile, 
	st_asgeojson(location_pref) as location_pref,
	distancia_aviso 
from usuarios 
where _id = $1