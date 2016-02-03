select st_contains(muni_torrent.geom, st_geomfromtext('$1^',4258)),
	st_length(st_transform(st_geomfromtext('$1^',4258) , 25830)) 
from muni_torrent