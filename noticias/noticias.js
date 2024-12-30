const express = require('express');
const router = express.Router();
const db = require('../models/db'); // Conexión a la base de datos
const multer = require('multer');
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
// Obtener todas las noticias
router.get('/news', async (req, res) => {
    try {
        const [news] = await db.query('SELECT * FROM news');
        res.json(news);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Crear una nueva noticia
router.post('/news', async (req, res) => {
    const { image_url, content, date, title } = req.body;
    try {
        const [result] = await db.query(
            'INSERT INTO news (image_url, content, date, title) VALUES (?, ?, ?, ?)',
            [image_url, content, date, title]
        );
        res.status(201).json({ message: 'Noticia creada correctamente', id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Actualizar una noticia por su id
router.put('/news/:id', async (req, res) => {
    const id = req.params.id;
    const { image_url, content, date, title } = req.body;
    try {
        await db.query(
            'UPDATE news SET image_url = ?, content = ?, date = ?, title = ? WHERE id = ?',
            [image_url, content, date, title, id]
        );
        res.json({ message: 'Noticia actualizada correctamente' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Eliminar una noticia por su id
router.delete('/news/:id', async (req, res) => {
    const id = req.params.id;
    try {
        await db.query('DELETE FROM news WHERE id = ?', [id]);
        res.json({ message: 'Noticia eliminada correctamente' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Contar el total de noticias
router.get('/countnews', async (req, res) => {
    try {
        const [[{ count }]] = await db.query('SELECT COUNT(*) AS count FROM news');
        res.json({ count });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
