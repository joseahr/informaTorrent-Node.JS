SELECT ST_Equals(ST_GeomFromText($1, 4258), ST_GeomFromGeoJSON($2)) AS equal