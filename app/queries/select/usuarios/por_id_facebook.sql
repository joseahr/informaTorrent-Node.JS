select *
from usuarios 
where facebook ->> 'id' = $1