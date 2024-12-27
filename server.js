require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const routes = require('./routes/routes');
const trucks = require('./trucks/trucks');
const notifications = require('./notifications/notifications');
const noticias = require('./noticias/noticias');
const multer = require('multer');
const app = express();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Directorio donde se guardarán las imágenes
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`); // Nombre único para cada archivo
  },
});

const upload = multer({ storage: storage });

// Ruta para recibir las imágenes y guardarlas
app.post('/uploads', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No se ha subido ninguna imagen');
  }
  // Responder con el nombre de archivo o la URL de la imagen subida
  res.json({ filename: req.file.filename });
});

// Configuración de CORS para permitir cualquier origen
app.use(cors({
    origin: '*', // Permitir todos los orígenes
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Métodos permitidos
    allowedHeaders: ['Content-Type', 'Authorization'] // Headers permitidos
}));

const PORT = process.env.PORT || 3000;

// Middleware para analizar el cuerpo de las solicitudes
app.use(bodyParser.json());

// Middleware para servir archivos estáticos desde la carpeta 'uploads'
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Registro de rutas
app.use('/api', routes);
app.use('/api', trucks);
app.use('/api', notifications);
app.use('/api', noticias);
// Inicio del servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
