INSERT INTO comentarios(id_usuario, id_denuncia, contenido) VALUES($1, $2, $3)
RETURNING id