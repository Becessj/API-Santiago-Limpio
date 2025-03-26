const express = require('express');
const router = express.Router();
const db = require('../models/db');

// Obtener todas las rutas con sus features
router.get('/routes', async (req, res) => {
  try {
      // 📌 Modificamos la consulta para hacer `JOIN` con `trucks`
      const query = `
          SELECT 
            r.id AS route_id, 
            r.name AS route_name, 
            r.days, 
            r.truck AS truck_id, 
            r.schedule_start, 
            r.schedule_end, 
            r.img_map, 
            t.imei,
            t.name AS truck_name
        FROM routes r
        LEFT JOIN trucks t ON r.truck = t.id;
        ; 
      `;

      const [routes] = await db.query(query);
      const [features] = await db.query('SELECT * FROM features');

      // 📌 Mapeamos las rutas para incluir `imei`
      const result = routes.map(route => ({
          type: 'FeatureCollection',
          name: route.route_name,
          imei: route.imei,  // 📌 Se agrega `imei` al JSON
          crs: { type: 'name', properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' } },
          features: features
              .filter(feature => feature.route_id === route.route_id)
              .map(feature => ({
                  type: 'Feature',
                  properties: {
                      id: route.route_id,
                      days: route.days,
                      nombreruta: route.route_name,
                      truck: route.truck_id,
                      truck_name: route.truck_name,
                      imei: route.imei,  // 📌 Se agrega `imei` a la ruta
                      img_map: route.img_map,
                      schedule_start: route.schedule_start,
                      schedule_end: route.schedule_end,
                  },
                  geometry: {
                      type: feature.geometry_type,
                      coordinates: JSON.parse(feature.coordinates)
                  }
              }))
      }));

      res.json(result);
  } catch (err) {
      console.error("❌ Error al obtener rutas:", err);
      res.status(500).json({ error: err.message });
  }
});
  
  router.post('/routes', async (req, res) => {
    const { id, name, days, truck, schedule_start,schedule_end, img_map, features } = req.body;

    try {
        // Verifica si el ID ya existe
        const [existingRoute] = await db.query('SELECT id FROM routes WHERE id = ?', [id]);

        if (existingRoute.length > 0) {
            // Si ya existe la ruta, actualizamos los campos
            await db.query(
                'UPDATE routes SET name = ?, img_map = ? ,created_at = NOW() WHERE id = ?',
                [name,img_map,id]
            );

            // También verificamos si hay nuevas features para actualizar
            if (features && features.length > 0) {
                // Preparamos los valores para la inserción
                const featureValues = features.map((f) => [
                    id,
                    f.geometry_type,
                    JSON.stringify(f.coordinates),
                ]);
                
                // Borramos las features anteriores relacionadas con esta ruta
                await db.query('DELETE FROM features WHERE route_id = ?', [id]);
                
                // Inserta las nuevas features
                await db.query(
                    'INSERT INTO features (route_id, geometry_type, coordinates) VALUES ?',
                    [featureValues]
                );
            }
        } else {
            // Si no existe, procedemos con la inserción
            await db.query('DELETE FROM features WHERE route_id = ?', [id]);
            await db.query('DELETE FROM routes WHERE id = ?', [id]);

            // Insertar la nueva ruta con el ID proporcionado y fecha actual
            await db.query(
                'INSERT INTO routes (id, name, days, truck, schedule_start,schedule_end, img_map, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
                [id, name, days, truck, schedule_start, schedule_end, img_map]
            );

            // Insertar las features asociadas
            if (features && features.length > 0) {
                const featureValues = features.map((f) => [
                    id,
                    f.geometry_type,
                    JSON.stringify(f.coordinates),
                ]);
                await db.query(
                    'INSERT INTO features (route_id, geometry_type, coordinates) VALUES ?',
                    [featureValues]
                );
            }
        }

        res.status(200).json({ id, message: 'Ruta creada/actualizada con features' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

  

// Obtener una ruta específica con sus features
router.get('/routes/:id', async (req, res) => {
    const { id } = req.params;
  
    try {
      // Consulta la información de la ruta
      const [routes] = await db.query('SELECT * FROM routes WHERE id = ?', [id]);
      if (routes.length === 0) {
        return res.status(404).json({ message: 'Ruta no encontrada' });
      }
  
      const routeData = routes[0];
  
      // Consulta las características (features) relacionadas
      const [features] = await db.query('SELECT * FROM features WHERE route_id = ?', [id]);
  
      // Construcción del objeto final con las propiedades de `routes` y `features`
      const route = {
        type: 'FeatureCollection',
        id: routeData.id, // Desde `routes`
            days: routeData.days, // Desde `routes`
            nombreruta: routeData.name, // Desde `routes`
            Camion: routeData.truck, // Desde `routes`
            img_map: routeData.img_map, // Desde `routes`
            Horario_start: routeData.schedule_start, // Desde `routes`
            Horario_end: routeData.schedule_end, // Desde `routes`
        // crs: { type: 'name', properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' } },
        features: features.map((feature) => ({
          // type: 'Feature',
          // properties: {
            
          // },
          geometry: {
            type: feature.geometry_type, // Desde `features`
            coordinates: JSON.parse(feature.coordinates), // Desde `features`
          },
        })),
      };
  
      res.json(route);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
  

// Actualizar una ruta y sus features
router.put('/routes/:id', async (req, res) => {
    const { id } = req.params;
    const { days, truck, schedule_start,schedule_end, features } = req.body;
  
    try {
      // Actualizar la ruta
      await db.query(
        'UPDATE routes SET days = ?, truck = ?, schedule_start = ?, schedule_end = ? WHERE id = ?',
        [days, truck, schedule_start, schedule_end, id]
      );
  
      // Actualizar las features
      if (features && features.length > 0) {
        await db.query('DELETE FROM features WHERE route_id = ?', [id]);
        const featureValues = features.map(f => [
          id,
          f.geometry_type,
          JSON.stringify(f.coordinates)
        ]);
        await db.query(
          'INSERT INTO features (route_id, geometry_type, coordinates) VALUES ?',
          [featureValues]
        );
      }
  
      res.json({ message: 'Ruta y features actualizados' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
  // Eliminar una ruta y sus features
  router.delete('/routes/:id', async (req, res) => {
    const { id } = req.params;
  
    try {
      // Eliminar las features asociadas
      await db.query('DELETE FROM features WHERE route_id = ?', [id]);
      // Eliminar la ruta
      await db.query('DELETE FROM routes WHERE id = ?', [id]);
  
      res.json({ message: 'Ruta y features eliminados' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  // Agregar un nuevo endpoint para obtener el recuento de rutas
router.get('/countroutes', async (req, res) => {
  try {
      // Realiza la consulta de conteo en la tabla `routes`
      const [[{ count }]] = await db.query('SELECT COUNT(*) AS count FROM routes');
      res.json({ count });
  } catch (err) {
      res.status(500).json({ error: err.message });
  }
});

// Totalizado de todas las rutas
// Porcentaje de completitud de todas las rutas
// Porcentaje de completitud de todas las rutas
router.get('/total', async (req, res) => {
  try {
      const [rows] = await db.query(`
          SELECT
              SUM(CASE WHEN days IS NOT NULL AND days != '' THEN 1 ELSE 0 END) AS days_count,
              SUM(CASE WHEN truck IS NOT NULL AND truck != '' THEN 1 ELSE 0 END) AS truck_count,
              SUM(CASE WHEN schedule_start IS NOT NULL AND schedule_start != '' THEN 1 ELSE 0 END) AS schedule_start_count,
              SUM(CASE WHEN schedule_end IS NOT NULL AND schedule_end != '' THEN 1 ELSE 0 END) AS schedule_end_count,
              COUNT(*) AS total_routes
          FROM routes
      `);

      const {
          days_count = 0,
          truck_count = 0,
          schedule_start_count = 0,
          schedule_end_count = 0,
          total_routes = 0
      } = rows[0] || {};

      // Asegurarse de que todos los valores sean numéricos
      const numDaysCount = Number(days_count);
      const numTruckCount = Number(truck_count);
      const numScheduleStartCount = Number(schedule_start_count);
      const numScheduleEndCount = Number(schedule_end_count);
      const numTotalRoutes = Number(total_routes);

      // Total de campos completados
      const totalFieldsCompleted = numDaysCount + numTruckCount + numScheduleStartCount + numScheduleEndCount;

      // Total de campos esperados
      const totalFieldsExpected = numTotalRoutes * 4; // 4 campos por cada ruta

      // Calcular porcentaje de completitud
      let completionPercentage = 0;
      if (totalFieldsExpected > 0) {
          completionPercentage = (totalFieldsCompleted / totalFieldsExpected) * 100;
      }

      // Asegurarse de que el porcentaje no supere 100
      completionPercentage = Math.min(Math.round(completionPercentage), 100);

      res.json({ completion_percentage: completionPercentage });
  } catch (err) {
      res.status(500).json({ error: err.message });
  }
});





module.exports = router;
