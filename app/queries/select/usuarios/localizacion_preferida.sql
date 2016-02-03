select st_asgeojson(location_pref) as loc_pref
from usuarios 
where _id = $1