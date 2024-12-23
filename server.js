require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const routes = require('./routes/routes');
const trucks = require('./trucks/trucks');
const notifications = require('./notifications/notifications');
const multer = require('multer');
const app = express();

// Configuración de almacenamiento para Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
      cb(null, path.join(__dirname, '../uploads')); // Directorio para almacenar archivos
  },
  filename: (req, file, cb) => {
      cb(null, Date.now() + '-' + file.originalname); // Nombre único para cada archivo
  }
});

const upload = multer({ storage });


const router = express.Router();

router.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
      return res.status(400).json({ error: 'No se subió ningún archivo' });
  }
  res.status(200).json({ filePath: `/uploads/${req.file.filename}` });
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

// Middleware para servir archivos estáticos (carpeta uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Registro de rutas
app.use('/api', routes);
app.use('/api', trucks);
app.use('/api', notifications);

// Inicio del servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
