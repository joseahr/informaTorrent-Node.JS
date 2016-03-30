INSERT INTO denuncias(titulo, descripcion, id_usuario)
VALUES($1, $2, $3) returning *
