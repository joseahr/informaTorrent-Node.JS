INSERT INTO denuncias_puntos(gid, the_geom)
VALUES($1, ST_GeomFromText($2,4258))
