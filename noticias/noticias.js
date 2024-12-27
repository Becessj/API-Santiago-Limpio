const express = require('express');
const router = express.Router();
const db = require('../models/db'); // Conexión a la base de datos
const multer = require('multer');
const path = require('path');

// Configuración de multer para manejar la subida de imágenes
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Carpeta para imágenes
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage });

// Subir imágenes para las noticias
router.post('/upload', upload.single('image'), (req, res) => {
    if (req.file) {
        const filePath = `http://localhost:3001/uploads/${req.file.filename}`;
        res.json({ filePath });
    } else {
        res.status(400).send('No se pudo subir la imagen');
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
