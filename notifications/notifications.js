const express = require('express');
const router = express.Router();
const db = require('../models/db'); // Conexión a la base de datos
const multer = require('multer');
const path = require('path');

// Configuración de multer para manejar la subida de archivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Carpeta donde se guardarán las imágenes
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage });

// Endpoint para subir imágenes
router.post('/upload', upload.single('image'), (req, res) => {
    if (req.file) {
      const filePath = `http://santiagolimpio.guamanpoma.org/uploads/${req.file.filename}`;
      res.json({ filePath });
    } else {
      res.status(400).send('No se pudo subir la imagen');
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
            'INSERT INTO Notifications (image_url, text, date, title) VALUES (?, ?, ?, ?)',
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

module.exports = router;
