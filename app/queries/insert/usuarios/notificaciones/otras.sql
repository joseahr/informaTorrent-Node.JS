insert into notificaciones(id_denuncia, id_usuario_from, id_usuario_to, tipo, datos) 
values ($1, $2, $3, $4, $5) returning *