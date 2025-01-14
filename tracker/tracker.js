const express = require('express');
const router = express.Router();
const db = require('../models/db');


async function parseCobanData(data) {
  try {
      // Verificar si 'data' es un objeto JSON y extraer la cadena interna
      let receivedData;
      try {
          receivedData = JSON.parse(data);
          console.log('Datos del GPS:', receivedData);  // Verificar el objeto JSON completo
      } catch (e) {
          console.error('Error al parsear los datos recibidos:', e);
          return null;
      }

      // Verificar que 'receivedData.data' contenga la información esperada
      if (receivedData.data) {
          const gpsData = receivedData.data;  // Contenido de la propiedad 'data'
          console.log('Datos recibidos del GPS:', gpsData);

          // Eliminar espacios extra y dividir los datos por coma
          const parts = gpsData.trim().split(',');

          // Extraer los datos que necesitamos
          const imei = parts[0].trim(); // IMEI
          const dateTime = parts[2]; // Fecha y hora en formato YYMMDDhhmmss
          const lat = parseFloat(parts[3]); // Latitud
          const lon = parseFloat(parts[4]); // Longitud

          // Depuración: Verificar el valor del IMEI
          console.log('IMEI extraído:', imei);

          // Convertir la fecha y hora de formato 'YYMMDDhhmmss' a formato ISO
          const year = '20' + dateTime.substring(0, 2); // Los primeros 2 caracteres son el año
          const month = dateTime.substring(2, 4); // Los siguientes 2 son el mes
          const day = dateTime.substring(4, 6); // Los siguientes 2 son el día
          const hour = dateTime.substring(6, 8); // Los siguientes 2 son la hora
          const minute = dateTime.substring(8, 10); // Los siguientes 2 son los minutos
          const second = dateTime.substring(10, 12); // Los últimos 2 son los segundos

          const timestamp = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`);

          // Buscar la ruta asociada al IMEI en la tabla `routes`
          const [routes] = await db.query('SELECT * FROM routes WHERE truck = ?', [imei]);

          if (routes.length === 0) {
              console.warn('No se encontró una ruta asociada para el IMEI:', imei);
              return null;
          }

          const route = routes[0];

          // Crear un registro enriquecido con la información de la ruta
          const enrichedData = {
              imei,
              latitude: lat,
              longitude: lon,
              timestamp,
          };

          // Guardar los datos del tracker en la base de datos
          const query = `
              INSERT INTO tracker_data (imei, lat, lon, time, route_id) 
              VALUES (?, ?, ?, ?, ?)
          `;
          const values = [imei, lat, lon, timestamp, route.id];
          await db.query(query, values);

          console.log('Datos procesados y guardados:', enrichedData);

          return enrichedData;
      } else {
          console.warn('No se encontró el campo "data" en los datos recibidos');
          return null;
      }
  } catch (error) {
      console.error('Error al procesar los datos del tracker:', error);
      return null;
  }
}



router.post('/tracker', async (req, res) => {
  try {
      const data = req.body;

      console.log('Datos recibidos del GPS:', data);

      // Llamar a parseCobanData para procesar los datos
      const parsedData = await parseCobanData(JSON.stringify(data));

      if (parsedData) {
          res.status(200).json({ message: 'Datos procesados correctamente', data: parsedData });
      } else {
          res.status(400).json({ message: 'Error al procesar los datos' });
      }
  } catch (error) {
      res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  }
});

  




module.exports = router;
