const express = require('express');
const router = express.Router();
const db = require('../models/db'); // Asegúrate de que esta sea la configuración correcta para tu conexión a la base de datos

// Obtener todos los trucks
router.get('/trucks', async (req, res) => {
    try {
        const [trucks] = await db.query('SELECT id, name FROM trucks'); // Consulta para obtener los datos de los compactadores
        res.json(trucks); // Enviar los datos como respuesta JSON
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
