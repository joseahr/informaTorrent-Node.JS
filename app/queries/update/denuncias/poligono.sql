UPDATE denuncias_poligonos SET the_geom = st_geomfromtext($1,4258) WHERE gid=$2
