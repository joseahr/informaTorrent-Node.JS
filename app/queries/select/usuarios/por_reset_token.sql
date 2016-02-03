select * 
from usuarios 
where resetPasswordToken=$1 and resetPasswordExpires > CURRENT_TIMESTAMP