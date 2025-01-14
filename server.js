require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const routes = require('./routes/routes');
const trucks = require('./trucks/trucks');
const notifications = require('./notifications/notifications');
const noticias = require('./noticias/noticias');
const tracker = require('./tracker/tracker');
const http = require('http');
const socketIo = require('socket.io');

const app = express();

// Configuración de CORS
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

const PORT = process.env.PORT || 3000;
app.use(bodyParser.json());
app.use('/api', routes);
app.use('/api', trucks);
app.use('/api', notifications);
app.use('/api', noticias);
app.use('/api', tracker);
// Crear servidor HTTP y configurar Socket.io
const server = http.createServer(app);
const io = socketIo(server);

// Función para analizar los datos del tracker y guardarlos
function parseCobanData(data) {
  try {
    const parsedData = JSON.parse(data);
    const { imei, lat, lon, speed, time, status } = parsedData;

    // Guardar los datos en la base de datos
    const query = 'INSERT INTO tracker_data(imei, lat, lon, speed, time, status) VALUES (?, ?, ?, ?, ?, ?)';
    const values = [imei, lat, lon, speed, time, status];

    db.query(query, values, (err, results) => {
      if (err) {
        console.error('Error al guardar los datos en la base de datos:', err);
        return;
      }
      console.log('Datos guardados correctamente:', results);

      // Emitir los datos guardados a todos los clientes conectados
      io.emit('tracker_data', { imei, lat, lon, speed, time, status });
    });

    return { imei, latitude: lat, longitude: lon, speed, timestamp: time, status };
  } catch (error) {
    console.error('Error al procesar los datos del tracker:', error);
    return null;
  }
}

// Manejar conexiones de WebSocket
io.on('connection', (socket) => {
    console.log('Un cliente se ha conectado', socket.id);

    // Escuchar los datos enviados por los trackers
    socket.on('data_from_tracker', (data) => {
        console.log('Datos recibidos del tracker:', data);

        // Parsear los datos usando la función parseCobanData
        const parsedData = parseCobanData(data);

        if (parsedData) {
            // Aquí puedes guardar parsedData en la base de datos si es necesario
            console.log('Datos procesados:', parsedData);
        } else {
            console.log('Error en los datos del tracker.');
        }
    });

    socket.on('disconnect', () => {
        console.log('Un cliente se ha desconectado', socket.id);
    });
});

// Iniciar el servidor
server.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
