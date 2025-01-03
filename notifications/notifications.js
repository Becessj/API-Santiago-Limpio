const express = require('express');
const router = express.Router();
const db = require('../models/db'); // Conexión a la base de datos
const cron = require('node-cron');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const axios = require('axios');
// Configuración de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

// Usar almacenamiento en memoria para Multer
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

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

// Configurar la tarea cron para ejecutarse todos los días a medianoche (00:00)
//cron.schedule('0 0 * * *', async () => {
//este se ejecuta cada minuto
cron.schedule('* * * * *', async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Poner la hora en 00:00:00 para comparar solo las fechas
      const todayStr = today.toISOString().split('T')[0]; // Obtener la fecha actual en formato YYYY-MM-DD
  
      // Actualizar las notificaciones con fecha_end menor o igual a hoy, y estado != 'INACTIVO'
      await db.query(
        'UPDATE notifications SET status = "INACTIVO" WHERE date_end <= ? AND status != "INACTIVO"',
        [todayStr]
      );
      console.log('Notificaciones actualizadas a INACTIVO correctamente');
    } catch (err) {
      console.error('Error al actualizar las notificaciones:', err);
    }
  });

  // Endpoint POST para actualizar notificaciones
router.post('/update-notifications', async (req, res) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Poner la hora en 00:00:00 para comparar solo las fechas
      const todayStr = today.toISOString().split('T')[0]; // Obtener la fecha actual en formato YYYY-MM-DD
  
      // Actualizar las notificaciones con fecha_end menor o igual a hoy, y estado != 'INACTIVO'
      await db.query(
        'UPDATE notifications SET status = "INACTIVO" WHERE date_end <= ? AND status != "INACTIVO"',
        [todayStr]
      );
      console.log('Notificaciones actualizadas a INACTIVO correctamente');
      res.status(200).json({ message: 'Notificaciones actualizadas a INACTIVO correctamente' });
    } catch (err) {
      console.error('Error al actualizar las notificaciones:', err);
      res.status(500).json({ error: 'Error al actualizar las notificaciones' });
    }
  });


// Obtener todas las notificaciones activas
router.get('/notifications', async (req, res) => {
  try {
    const [notifications] = await db.query(
      'SELECT * FROM notifications'
    );
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crear una nueva notificación
router.post('/notifications', async (req, res) => {
    const { image_url, text, title, date_start, date_end, status } = req.body;
    
    try {
      // Si la nueva notificación es "ACTIVO", cambiamos las demás a "INACTIVO"
      if (status === 'ACTIVO') {
        await db.query('UPDATE notifications SET status = "INACTIVO"');
      }
  
      // Insertar la nueva notificación con el estado proporcionado
      const [result] = await db.query(
        'INSERT INTO notifications (image_url, text, title, status, date_start, date_end) VALUES (?, ?, ?, ?, ?, ?)',
        [image_url, text, title, status, date_start, date_end]
      );
  
      res.status(201).json({ message: 'Notificación creada correctamente', id: result.insertId });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
  

// Actualizar una notificación por su id
router.put('/notifications/:id', async (req, res) => {
    const id = req.params.id;
    const { image_url, text, title, status, date_start, date_end } = req.body;
  
    try {
      // Verificar si el nuevo estado es "ACTIVO"
      if (status === 'ACTIVO') {
        // Cambiar todas las demás notificaciones a "INACTIVO"
        await db.query('UPDATE notifications SET status = "INACTIVO"');
      }
  
      // Actualizar la notificación específica con el estado proporcionado
      await db.query(
        'UPDATE notifications SET image_url = ?, text = ?, title = ?, status = ?, date_start = ?, date_end = ? WHERE id = ?',
        [image_url, text, title, status, date_start, date_end, id]
      );
  
      res.json({ message: 'Notificación actualizada correctamente' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
  

// Cambiar el estado de una notificación
router.patch('/notifications/:id/status', async (req, res) => {
  const id = req.params.id;
  const { status } = req.body;
  if (!['ACTIVO', 'INACTIVO'].includes(status)) {
    return res.status(400).json({ error: 'Estado inválido' });
  }
  try {
    await db.query('UPDATE notifications SET status = ? WHERE id = ?', [status, id]);
    res.json({ message: 'Estado de la notificación actualizado correctamente' });
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

// Contar el número de notificaciones activas
router.get('/countnotifications', async (req, res) => {
  try {
    const [[{ count }]] = await db.query(
      'SELECT COUNT(*) AS count FROM notifications WHERE status = "ACTIVO"' 
    );
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Ruta para registrar el token de Expo Push
router.post('/register-push-token', async (req, res) => {
    const { token } = req.body; // Token de Expo Push enviado desde la app
    
    if (!token) {
      return res.status(400).json({ error: 'Token no proporcionado' });
    }
  
    try {
      // Verificar si el token ya está registrado
      const [existingToken] = await db.query('SELECT * FROM push_tokens WHERE token = ?', [token]);
  
      if (existingToken.length > 0) {
        // Si ya está registrado, devolver un mensaje
        return res.status(200).json({ message: 'Token ya registrado' });
      }
  
      // Guardar el nuevo token en la base de datos
      await db.query('INSERT INTO push_tokens (token) VALUES (?)', [token]);
  
      res.status(201).json({ message: 'Token registrado correctamente' });
    } catch (err) {
      console.error('Error al registrar el token:', err);
      res.status(500).json({ error: 'Error al registrar el token' });
    }
  });

  // Ruta para enviar notificaciones a todos los tokens
router.post('/send-notification', async (req, res) => {
    const { title, body, data } = req.body; // Datos de la notificación
    
    try {
      // Obtener todos los tokens desde la base de datos
      const [tokens] = await db.query('SELECT token FROM push_tokens');
      
      if (tokens.length === 0) {
        return res.status(404).json({ error: 'No hay tokens registrados' });
      }
  
      // Crear un array de tokens
      const expoTokens = tokens.map((tokenObj) => tokenObj.token);
  
      // Crear el mensaje de notificación
      const message = {
        to: expoTokens,
        sound: 'default',
        title,
        body,
        data, // Si quieres enviar datos adicionales
      };
  
      // Enviar la notificación a Expo
      const response = await axios.post(
        'https://exp.host/--/api/v2/push/send',
        message,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
  
      res.status(200).json({ message: 'Notificaciones enviadas correctamente', response: response.data });

    } catch (err) {
      console.error('Error al enviar la notificación:', err);
      res.status(500).json({ error: 'Error al enviar la notificación' });
    }
  });
// Ruta para obtener todos los tokens registrados
router.get('/push-tokens', async (req, res) => {
    try {
      // Obtener todos los tokens desde la base de datos
      const [tokens] = await db.query('SELECT token FROM push_tokens');
      
      if (tokens.length === 0) {
        return res.status(404).json({ message: 'No hay tokens registrados' });
      }
  
      // Responder con los tokens
      res.status(200).json(tokens);
    } catch (err) {
      console.error('Error al obtener los tokens:', err);
      res.status(500).json({ error: 'Error al obtener los tokens' });
    }
  });
  

module.exports = router;
