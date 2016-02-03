select n.*, 
	to_char(n.fecha::timestamp,'DD TMMonth YYYY HH24:MI:SS') as fecha, 
	u.profile as profile_to 
from notificaciones n, usuarios u 
where n.id_usuario_from=$1 and n.id_usuario_to=u._id order by n.fecha desc