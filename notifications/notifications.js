const express = require('express');
const router = express.Router();
const db = require('../models/db'); // Conexión a la base de datos
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const path = require('path');


const cloudinary = require('cloudinary').v2; // Importar Cloudinary


// Configuración de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

// Usar almacenamiento en memoria para Multer
const storage = multer.memoryStorage();
const upload = multer({ storage: storage }); // Middleware 'upload'
   
// Ruta para subir imágenes a Cloudinary
router.post('/upload-to-cloudinary', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No se ha subido ninguna imagen');
  }

  try {
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'uploads', resource_type: 'image' },
        (error, result) => {
          if (error) {
            return reject(error);
          }
          resolve(result);
        }
      );
      uploadStream.end(req.file.buffer);
    });

    res.json({ filePath: result.secure_url });
  } catch (error) {
    console.error('Error al subir la imagen a Cloudinary:', error);
    res.status(500).send('Error al subir la imagen');
  }
});

// Obtener todas las notificaciones
router.get('/notifications', async (req, res) => {
    try {
        const [notifications] = await db.query('SELECT * FROM notifications');
        res.json(notifications);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Crear una nueva notificación
router.post('/notifications', async (req, res) => {
    const { image_url, text, date, title } = req.body;
    try {
        const [result] = await db.query(
            'INSERT INTO notifications (image_url, text, date, title) VALUES (?, ?, ?, ?)',
            [image_url, text, date, title]
        );
        res.status(201).json({ message: 'Notificación creada correctamente', id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Actualizar una notificación por su id
router.put('/notifications/:id', async (req, res) => {
    const id = req.params.id;
    const { image_url, text, date, title } = req.body;
    try {
        await db.query(
            'UPDATE notifications SET image_url = ?, text = ?, date = ?, title = ? WHERE id = ?',
            [image_url, text, date, title, id]
        );
        res.json({ message: 'Notificación actualizada correctamente' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Eliminar una notificación por su id
router.delete('/notifications/:id', async (req, res) => {
    const id = req.params.id;
    try {
        await db.query('DELETE FROM notifications WHERE id = ?', [id]);
        res.json({ message: 'Notificación eliminada correctamente' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.get('/countnotificaciones', async (req, res) => {
    try {
        // Realiza la consulta de conteo en la tabla `notifications`
        const [[{ count }]] = await db.query('SELECT COUNT(*) AS count FROM notifications');
        res.json({ count });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
  });
  

module.exports = router;