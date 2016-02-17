select(
	(select count(*) from denuncias_puntos) + 
	(select count(*) from denuncias_lineas) + 
	(select count(*) from denuncias_poligonos)
) as numdenuncias