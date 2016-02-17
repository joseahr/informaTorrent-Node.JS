select t1.cnt as num_denun_total, 
	t2.cnt as num_denun_hoy, 
	t3.cnt as num_usuarios_total
from (select(
	(select count(*) from denuncias_puntos) + 
	(select count(*) from denuncias_lineas) + 
	(select count(*) from denuncias_poligonos)
) as cnt) as t1
cross join (select count(*) as cnt from 
	(select * from denuncias_puntos 
	UNION ALL 
	select * from denuncias_lineas 
	UNION ALL 
	select * from denuncias_poligonos)x where fecha >= to_char(current_timestamp, 'YYYY-MM-DD')::date

) as t2
cross join (select count(*) as cnt from usuarios) as t3
