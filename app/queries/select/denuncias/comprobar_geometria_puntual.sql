select st_contains(muni_torrent.geom, st_geomfromtext('$1^',4258)) 
from muni_torrent