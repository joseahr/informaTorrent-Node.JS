select t1.cnt as num_denun_total, 
	t2.cnt as num_denun_hoy, 
	t3.cnt as num_usuarios_total
from (select count (*) as cnt from denuncias) as t1
cross join (select count(*) as cnt from denuncias where fecha >= to_char(current_timestamp, 'YYYY-MM-DD')::date) as t2
cross join (select count(*) as cnt from usuarios) as t3
