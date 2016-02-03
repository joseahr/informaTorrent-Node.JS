select * 
from usuarios 
where twitter ->> 'id' = $1