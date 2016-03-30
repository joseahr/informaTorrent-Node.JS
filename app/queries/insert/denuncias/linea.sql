INSERT INTO denuncias_lineas(gid, the_geom)
VALUES($1,ST_GeomFromText($2,4258))
