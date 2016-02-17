UPDATE denuncias_puntos SET (titulo, descripcion, the_geom) = ($1, $2, st_geomfromtext($3,4258)) WHERE gid=$4
