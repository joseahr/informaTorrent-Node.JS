select n.*, 
	to_char(n.fecha::timestamp,'DD TMMonth YYYY HH24:MI:SS') as fecha,
	u.profile as profile_from 
from notificaciones n, usuarios u
where n.id_usuario_to=$1 and n.id_usuario_from=u._id order by n.fecha desc