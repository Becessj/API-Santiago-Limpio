const express = require('express');
const router = express.Router();
const db = require('../models/db'); // Conexión a la base de datos
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const path = require('path');

// Configuración de Multer para almacenar las imágenes en memoria (sin guardarlas en disco)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Endpoint para subir la imagen
router.post('/upload', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se subió ningún archivo' });
  }

  try {
    // Creamos el FormData para enviar la imagen al servidor de destino
    const formData = new FormData();
    formData.append('image', req.file.buffer, 'image.jpg'); // Usamos el buffer de la imagen

    // Hacemos la solicitud al servidor de destino para subir la imagen
    const response = await axios.post(
      'https://santiagolimpio.guamanpoma.org/uploads/', // Dirección del servidor donde se almacenará la imagen
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data', // Tipo de contenido para la subida de archivos
        },
      }
    );

    // Si la subida fue exitosa, respondemos con la URL de la imagen en el servidor de destino
    if (response.status === 200) {
      const filePath = `https://santiagolimpio.guamanpoma.org/uploads/${response.data.filename}`;
      return res.status(200).json({ filePath });
    } else {
      return res.status(500).json({ error: 'Error al subir la imagen al servidor destino' });
    }
  } catch (error) {
    console.error('Error al enviar la imagen:', error);
    return res.status(500).json({ error: 'Error en el servidor' });
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
            'UPDATE Notifications SET image_url = ?, text = ?, date = ?, title = ? WHERE id = ?',
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
        await db.query('DELETE FROM Notifications WHERE id = ?', [id]);
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
