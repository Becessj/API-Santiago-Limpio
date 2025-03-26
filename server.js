require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const routes = require('./routes/routes');
const trucks = require('./trucks/trucks');
const notifications = require('./notifications/notifications');
const noticias = require('./noticias/noticias');
const tracker = require('./tracker/tracker');

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

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
