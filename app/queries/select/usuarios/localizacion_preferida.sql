select st_asgeojson(location_pref)::json as loc_pref
from usuarios 
where _id = $1