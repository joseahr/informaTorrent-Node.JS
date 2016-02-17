insert into denuncias_lineas(gid,titulo, descripcion, the_geom, id_usuario, fecha)
VALUES($5, $1, $2, ST_GeomFromText($3,4258), $4, $6)
