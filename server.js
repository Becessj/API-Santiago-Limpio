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


const cloudinary = require('cloudinary').v2; // Importar Cloudinary

// Configuración de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME, 
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

// Usar almacenamiento en memoria para Multer
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });  // Definir el middleware 'upload'

// Ruta para subir imágenes a Cloudinary
app.post('/uploads', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No se ha subido ninguna imagen');
  }

  try {
    // Subir la imagen a Cloudinary
    const result = await cloudinary.uploader.upload_stream({ 
      resource_type: 'auto' 
    }, (error, result) => {
      if (error) {
        return res.status(500).json({ error: 'Error al subir la imagen a Cloudinary' });
      }
      // Responder con la URL de la imagen en Cloudinary
      return res.json({ filePath: result.secure_url });
    });

    // Pasamos el buffer de la imagen a Cloudinary
    result.end(req.file.buffer);

  } catch (error) {
    console.error('Error al subir la imagen a Cloudinary:', error);
    res.status(500).send('Error en el servidor');
  }
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



// Registro de rutas
app.use('/api', routes);
app.use('/api', trucks);
app.use('/api', notifications);
app.use('/api', noticias);
// Inicio del servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
