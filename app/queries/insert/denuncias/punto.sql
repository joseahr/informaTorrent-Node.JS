insert into denuncias_puntos(titulo, descripcion, the_geom, id_usuario)
VALUES($1, $2, ST_GeomFromText($3,4258), $4) returning gid