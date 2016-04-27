INSERT INTO replicas(id_comentario, id_usuario, contenido) VALUES($1, $2, $3)
RETURNING id