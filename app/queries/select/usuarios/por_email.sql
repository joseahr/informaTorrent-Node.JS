select * from usuarios where local ->> 'email' = $1