select column_name as nombre, 
	data_type as tipo
from information_schema.columns 
where column_name <> 'geom' and table_name = $1