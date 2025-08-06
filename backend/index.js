const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');
require('dotenv').config();


const app = express();
const PORT = process.env.PORT || 4000;

// CORS configuration to allow frontend requests from localhost and Codespaces
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://redesigned-goldfish-px6rjgg69jvh66qx-5173.app.github.dev'
  ]
}));

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://usuario:contraseña@localhost:5432/tu_basededatos',
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false
});

// Email configuration
const emailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// File upload configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname))
  }
});
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|zip|rar/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido'));
    }
  }
});

app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Middleware para autenticar JWT
function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = payload;
    // Actualizar último login
    pool.query('UPDATE "User" SET last_login = NOW() WHERE id = $1', [payload.userId]);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

// Middleware para verificar rol admin
function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado - Se requiere rol de administrador' });
  }
  next();
}

// Función para enviar emails
async function sendEmail(to, subject, html) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: to,
      subject: subject,
      html: html
    };
    await emailTransporter.sendMail(mailOptions);
    console.log('Email enviado exitosamente a:', to);
  } catch (error) {
    console.error('Error enviando email:', error);
  }
}

// Función para registrar actividad
async function logActivity(userId, action, entityType, entityId, details, req) {
  try {
    await pool.query(
      'INSERT INTO "ActivityLog" (user_id, action, entity_type, entity_id, details, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [userId, action, entityType, entityId, JSON.stringify(details), req.ip, req.get('User-Agent')]
    );
  } catch (error) {
    console.error('Error logging activity:', error);
  }
}

// ==================== RUTAS EXISTENTES (Login, Register, etc.) ====================
// ... (mantener las rutas existentes)

// ==================== NUEVAS RUTAS ====================

// ========== PERFIL DE USUARIO ==========
app.get('/api/profile', authenticateJWT, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, phone, address, profile_image, role, preferences, created_at, last_login FROM "User" WHERE id = $1',
      [req.user.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

app.put('/api/profile', authenticateJWT, async (req, res) => {
  try {
    const { name, phone, address, preferences } = req.body;
    const result = await pool.query(
      'UPDATE "User" SET name = $1, phone = $2, address = $3, preferences = $4 WHERE id = $5 RETURNING id, email, name, phone, address, preferences',
      [name, phone, address, JSON.stringify(preferences), req.user.userId]
    );
    
    await logActivity(req.user.userId, 'profile_updated', 'user', req.user.userId, { name, phone }, req);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ========== GESTIÓN DE PAQUETES ==========
app.get('/api/packages', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM "Package" WHERE is_active = true ORDER BY price ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Get packages error:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

app.post('/api/packages', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const { name, description, price, duration_minutes, photo_count, location_count, features } = req.body;
    const result = await pool.query(
      'INSERT INTO "Package" (name, description, price, duration_minutes, photo_count, location_count, features) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [name, description, price, duration_minutes, photo_count, location_count, JSON.stringify(features)]
    );
    
    await logActivity(req.user.userId, 'package_created', 'package', result.rows[0].id, { name, price }, req);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create package error:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ========== GESTIÓN DE PAGOS ==========
app.post('/api/payments', authenticateJWT, async (req, res) => {
  try {
    const { session_id, amount, payment_method, transaction_id, notes } = req.body;
    
    // Verificar que la sesión pertenece al usuario o que es admin
    const sessionResult = await pool.query('SELECT * FROM "Session" WHERE id = $1', [session_id]);
    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Sesión no encontrada' });
    }
    
    const session = sessionResult.rows[0];
    if (req.user.role !== 'admin' && session.userid !== req.user.userId) {
      return res.status(403).json({ error: 'No autorizado para esta sesión' });
    }
    
    const result = await pool.query(
      'INSERT INTO "Payment" (session_id, user_id, amount, payment_method, payment_status, transaction_id, payment_date, notes) VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7) RETURNING *',
      [session_id, session.userid, amount, payment_method, 'completed', transaction_id, notes]
    );
    
    // Enviar confirmación por email
    const userResult = await pool.query('SELECT email, name FROM "User" WHERE id = $1', [session.userid]);
    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      await sendEmail(
        user.email,
        'Confirmación de Pago - LunaStudios',
        `
        <h2>Pago Confirmado</h2>
        <p>Hola ${user.name},</p>
        <p>Hemos recibido tu pago de $${amount} por la sesión del ${new Date(session.date).toLocaleDateString()}.</p>
        <p>Método de pago: ${payment_method}</p>
        <p>¡Gracias por confiar en nosotros!</p>
        <p>Equipo LunaStudios</p>
        `
      );
    }
    
    await logActivity(req.user.userId, 'payment_created', 'payment', result.rows[0].id, { amount, payment_method }, req);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

app.get('/api/payments', authenticateJWT, async (req, res) => {
  try {
    let query = `
      SELECT p.*, s.title as session_title, s.date as session_date, u.name as user_name 
      FROM "Payment" p 
      LEFT JOIN "Session" s ON p.session_id = s.id 
      LEFT JOIN "User" u ON p.user_id = u.id
    `;
    let params = [];
    
    if (req.user.role !== 'admin') {
      query += ' WHERE p.user_id = $1';
      params.push(req.user.userId);
    }
    
    query += ' ORDER BY p.created_at DESC';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ========== ENTREGA DE MATERIAL FOTOGRÁFICO ==========
app.post('/api/photo-deliveries', authenticateJWT, upload.single('file'), async (req, res) => {
  try {
    const { session_id, title, description, file_type, file_url, expiry_date } = req.body;
    
    // Verificar permisos
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Solo los administradores pueden subir material' });
    }
    
    let finalFileUrl = file_url;
    if (req.file) {
      finalFileUrl = `/uploads/${req.file.filename}`;
    }
    
    const result = await pool.query(
      'INSERT INTO "PhotoDelivery" (session_id, title, description, file_url, file_type, expiry_date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [session_id, title, description, finalFileUrl, file_type || 'file', expiry_date]
    );
    
    // Notificar al cliente
    const sessionResult = await pool.query(
      'SELECT s.*, u.email, u.name FROM "Session" s JOIN "User" u ON s.userid = u.id WHERE s.id = $1',
      [session_id]
    );
    
    if (sessionResult.rows.length > 0) {
      const session = sessionResult.rows[0];
      await sendEmail(
        session.email,
        'Material Fotográfico Listo - LunaStudios',
        `
        <h2>Tu Material Está Listo</h2>
        <p>Hola ${session.name},</p>
        <p>Tu material fotográfico de la sesión "${session.title}" ya está disponible.</p>
        <p><strong>Título:</strong> ${title}</p>
        <p><strong>Descripción:</strong> ${description}</p>
        <p>Puedes acceder a tu material desde tu panel de cliente.</p>
        <p>Equipo LunaStudios</p>
        `
      );
    }
    
    await logActivity(req.user.userId, 'photo_delivery_created', 'photo_delivery', result.rows[0].id, { title, session_id }, req);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create photo delivery error:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

app.get('/api/photo-deliveries', authenticateJWT, async (req, res) => {
  try {
    const { session_id } = req.query;
    let query = `
      SELECT pd.*, s.title as session_title, s.date as session_date 
      FROM "PhotoDelivery" pd 
      JOIN "Session" s ON pd.session_id = s.id
    `;
    let params = [];
    
    if (req.user.role !== 'admin') {
      query += ' WHERE s.userid = $1';
      params.push(req.user.userId);
      if (session_id) {
        query += ' AND pd.session_id = $2';
        params.push(session_id);
      }
    } else if (session_id) {
      query += ' WHERE pd.session_id = $1';
      params.push(session_id);
    }
    
    query += ' ORDER BY pd.created_at DESC';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get photo deliveries error:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ========== NOTIFICACIONES ==========
app.get('/api/notifications', authenticateJWT, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM "Notification" WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

app.put('/api/notifications/:id/read', authenticateJWT, async (req, res) => {
  try {
    await pool.query(
      'UPDATE "Notification" SET is_read = true WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.userId]
    );
    res.json({ message: 'Notificación marcada como leída' });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ========== PANEL ADMINISTRATIVO ==========
app.get('/api/admin/dashboard', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const [sessionsResult, paymentsResult, usersResult, recentActivityResult] = await Promise.all([
      pool.query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE date >= NOW() - INTERVAL \'30 days\') as this_month FROM "Session"'),
      pool.query('SELECT COUNT(*) as total, SUM(amount) as total_amount, SUM(amount) FILTER (WHERE payment_date >= NOW() - INTERVAL \'30 days\') as this_month_amount FROM "Payment" WHERE payment_status = \'completed\''),
      pool.query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL \'30 days\') as this_month FROM "User" WHERE role = \'client\''),
      pool.query('SELECT * FROM "ActivityLog" ORDER BY created_at DESC LIMIT 10')
    ]);
    
    res.json({
      sessions: sessionsResult.rows[0],
      payments: paymentsResult.rows[0],
      users: usersResult.rows[0],
      recentActivity: recentActivityResult.rows
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ========== BÚSQUEDA Y FILTRADO ==========
app.get('/api/search', authenticateJWT, async (req, res) => {
  try {
    const { q, type, status, start_date, end_date } = req.query;
    let results = {};
    
    if (!type || type === 'sessions') {
      let sessionQuery = 'SELECT s.*, u.name as user_name FROM "Session" s JOIN "User" u ON s.userid = u.id WHERE 1=1';
      let sessionParams = [];
      let paramCount = 0;
      
      if (req.user.role !== 'admin') {
        sessionQuery += ` AND s.userid = $${++paramCount}`;
        sessionParams.push(req.user.userId);
      }
      
      if (q) {
        sessionQuery += ` AND (s.title ILIKE $${++paramCount} OR u.name ILIKE $${++paramCount})`;
        sessionParams.push(`%${q}%`, `%${q}%`);
      }
      
      if (status) {
        sessionQuery += ` AND s.status = $${++paramCount}`;
        sessionParams.push(status);
      }
      
      if (start_date) {
        sessionQuery += ` AND s.date >= $${++paramCount}`;
        sessionParams.push(start_date);
      }
      
      if (end_date) {
        sessionQuery += ` AND s.date <= $${++paramCount}`;
        sessionParams.push(end_date);
      }
      
      sessionQuery += ' ORDER BY s.date DESC';
      
      const sessionsResult = await pool.query(sessionQuery, sessionParams);
      results.sessions = sessionsResult.rows;
    }
    
    if (req.user.role === 'admin' && (!type || type === 'users')) {
      let userQuery = 'SELECT id, name, email, phone, role, created_at, last_login FROM "User" WHERE 1=1';
      let userParams = [];
      let paramCount = 0;
      
      if (q) {
        userQuery += ` AND (name ILIKE $${++paramCount} OR email ILIKE $${++paramCount})`;
        userParams.push(`%${q}%`, `%${q}%`);
      }
      
      userQuery += ' ORDER BY created_at DESC';
      
      const usersResult = await pool.query(userQuery, userParams);
      results.users = usersResult.rows;
    }
    
    res.json(results);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ========== REPORTES ==========
app.get('/api/reports/sessions', authenticateJWT, async (req, res) => {
  try {
    const { start_date, end_date, status, client_id } = req.query;
    
    let query = `
      SELECT s.*, u.name as client_name, u.email as client_email, 
             p.name as package_name, py.amount as payment_amount
      FROM "Session" s 
      JOIN "User" u ON s.userid = u.id
      LEFT JOIN "Package" p ON s.package_id = p.id
      LEFT JOIN "Payment" py ON s.id = py.session_id AND py.payment_status = 'completed'
      WHERE 1=1
    `;
    let params = [];
    let paramCount = 0;
    
    if (req.user.role !== 'admin') {
      query += ` AND s.userid = $${++paramCount}`;
      params.push(req.user.userId);
    }
    
    if (start_date) {
      query += ` AND s.date >= $${++paramCount}`;
      params.push(start_date);
    }
    
    if (end_date) {
      query += ` AND s.date <= $${++paramCount}`;
      params.push(end_date);
    }
    
    if (status) {
      query += ` AND s.status = $${++paramCount}`;
      params.push(status);
    }
    
    if (client_id && req.user.role === 'admin') {
      query += ` AND s.userid = $${++paramCount}`;
      params.push(client_id);
    }
    
    query += ' ORDER BY s.date DESC';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Sessions report error:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

app.get('/api/reports/income', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const { start_date, end_date, group_by } = req.query;
    
    let query = `
      SELECT 
        ${group_by === 'month' ? 'DATE_TRUNC(\'month\', payment_date) as period' : 'DATE_TRUNC(\'day\', payment_date) as period'},
        COUNT(*) as payment_count,
        SUM(amount) as total_amount,
        AVG(amount) as average_amount
      FROM "Payment" 
      WHERE payment_status = 'completed'
    `;
    let params = [];
    let paramCount = 0;
    
    if (start_date) {
      query += ` AND payment_date >= ${++paramCount}`;
      params.push(start_date);
    }
    
    if (end_date) {
      query += ` AND payment_date <= ${++paramCount}`;
      params.push(end_date);
    }
    
    query += ` GROUP BY period ORDER BY period DESC`;
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Income report error:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ========== ACTUALIZACIÓN DE SESIONES MEJORADA ==========
app.put('/api/sessions/:id', authenticateJWT, async (req, res) => {
  try {
    const { title, description, date, duration_minutes, location, status, price, package_id } = req.body;
    const sessionId = req.params.id;
    
    // Verificar permisos
    const sessionResult = await pool.query('SELECT * FROM "Session" WHERE id = $1', [sessionId]);
    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Sesión no encontrada' });
    }
    
    const session = sessionResult.rows[0];
    if (req.user.role !== 'admin' && session.userid !== req.user.userId) {
      return res.status(403).json({ error: 'No autorizado para editar esta sesión' });
    }
    
    const result = await pool.query(
      `UPDATE "Session" SET 
       title = $1, description = $2, date = $3, duration_minutes = $4, 
       location = $5, status = $6, price = $7, package_id = $8
       WHERE id = $9 RETURNING *`,
      [title, description, date, duration_minutes, location, status, price, package_id, sessionId]
    );
    
    // Si cambió el estado, enviar notificación
    if (status !== session.status) {
      const userResult = await pool.query('SELECT email, name FROM "User" WHERE id = $1', [session.userid]);
      if (userResult.rows.length > 0) {
        const user = userResult.rows[0];
        let emailSubject = 'Actualización de Sesión - LunaStudios';
        let emailContent = `
          <h2>Actualización de tu Sesión</h2>
          <p>Hola ${user.name},</p>
          <p>Tu sesión "${title}" ha sido actualizada.</p>
          <p><strong>Nuevo estado:</strong> ${status}</p>
          <p><strong>Fecha:</strong> ${new Date(date).toLocaleDateString()}</p>
          <p>Equipo LunaStudios</p>
        `;
        
        if (status === 'completada') {
          emailContent = `
            <h2>Sesión Completada</h2>
            <p>Hola ${user.name},</p>
            <p>¡Tu sesión "${title}" ha sido completada exitosamente!</p>
            <p>Pronto recibirás el material fotográfico.</p>
            <p>¡Gracias por confiar en nosotros!</p>
            <p>Equipo LunaStudios</p>
          `;
        }
        
        await sendEmail(user.email, emailSubject, emailContent);
      }
    }
    
    await logActivity(req.user.userId, 'session_updated', 'session', sessionId, { status, title }, req);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update session error:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ========== RECORDATORIOS AUTOMÁTICOS ==========
app.post('/api/admin/send-reminders', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const reminderHours = 24; // Configurable desde SystemConfig
    const result = await pool.query(`
      SELECT s.*, u.email, u.name 
      FROM "Session" s 
      JOIN "User" u ON s.userid = u.id 
      WHERE s.date > NOW() 
      AND s.date <= NOW() + INTERVAL '${reminderHours} hours'
      AND s.status = 'pendiente'
    `);
    
    let sent = 0;
    for (const session of result.rows) {
      await sendEmail(
        session.email,
        'Recordatorio de Sesión - LunaStudios',
        `
        <h2>Recordatorio de tu Sesión</h2>
        <p>Hola ${session.name},</p>
        <p>Te recordamos que tienes una sesión programada:</p>
        <p><strong>Sesión:</strong> ${session.title}</p>
        <p><strong>Fecha:</strong> ${new Date(session.date).toLocaleDateString()}</p>
        <p><strong>Hora:</strong> ${new Date(session.date).toLocaleTimeString()}</p>
        <p><strong>Ubicación:</strong> ${session.location || 'Por definir'}</p>
        <p>¡Te esperamos!</p>
        <p>Equipo LunaStudios</p>
        `
      );
      sent++;
    }
    
    res.json({ message: `${sent} recordatorios enviados` });
  } catch (error) {
    console.error('Send reminders error:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ========== GESTIÓN DE USUARIOS (ADMIN) ==========
app.get('/api/admin/users', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT id, name, email, phone, role, created_at, last_login, is_active,
             (SELECT COUNT(*) FROM "Session" WHERE userid = "User".id) as session_count
      FROM "User" 
      WHERE 1=1
    `;
    let params = [];
    let paramCount = 0;
    
    if (search) {
      query += ` AND (name ILIKE ${++paramCount} OR email ILIKE ${++paramCount})`;
      params.push(`%${search}%`, `%${search}%`);
    }
    
    query += ` ORDER BY created_at DESC LIMIT ${++paramCount} OFFSET ${++paramCount}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    // Contar total para paginación
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM "User"' + (search ? ' WHERE name ILIKE $1 OR email ILIKE $1' : ''),
      search ? [`%${search}%`] : []
    );
    
    res.json({
      users: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      totalPages: Math.ceil(countResult.rows[0].count / limit)
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

app.put('/api/admin/users/:id/status', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const { is_active } = req.body;
    const userId = req.params.id;
    
    await pool.query('UPDATE "User" SET is_active = $1 WHERE id = $2', [is_active, userId]);
    
    await logActivity(req.user.userId, 'user_status_updated', 'user', userId, { is_active }, req);
    res.json({ message: 'Estado de usuario actualizado' });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ========== CONFIGURACIONES DEL SISTEMA ==========
app.get('/api/admin/config', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM "SystemConfig" ORDER BY key');
    const config = {};
    result.rows.forEach(row => {
      config[row.key] = row.value;
    });
    res.json(config);
  } catch (error) {
    console.error('Get config error:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

app.put('/api/admin/config', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const configs = req.body;
    
    for (const [key, value] of Object.entries(configs)) {
      await pool.query(
        'UPDATE "SystemConfig" SET value = $1 WHERE key = $2',
        [value, key]
      );
    }
    
    await logActivity(req.user.userId, 'config_updated', 'system', null, configs, req);
    res.json({ message: 'Configuración actualizada' });
  } catch (error) {
    console.error('Update config error:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ========== MIDDLEWARE DE SEGURIDAD ==========
// Cerrar sesión automática por inactividad
app.post('/api/refresh-session', authenticateJWT, async (req, res) => {
  try {
    // Verificar si la sesión sigue siendo válida
    const userResult = await pool.query('SELECT is_active FROM "User" WHERE id = $1', [req.user.userId]);
    
    if (userResult.rows.length === 0 || !userResult.rows[0].is_active) {
      return res.status(401).json({ error: 'Sesión inválida' });
    }
    
    // Actualizar último acceso
    await pool.query('UPDATE "User" SET last_login = NOW() WHERE id = $1', [req.user.userId]);
    
    res.json({ message: 'Sesión renovada' });
  } catch (error) {
    console.error('Refresh session error:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ========== EXPORTACIÓN DE REPORTES ==========
app.get('/api/reports/export/sessions', authenticateJWT, async (req, res) => {
  try {
    const { format, start_date, end_date } = req.query;
    
    let query = `
      SELECT s.id, s.title, s.date, s.status, s.location, s.price,
             u.name as client_name, u.email as client_email,
             p.name as package_name
      FROM "Session" s 
      JOIN "User" u ON s.userid = u.id
      LEFT JOIN "Package" p ON s.package_id = p.id
      WHERE 1=1
    `;
    let params = [];
    let paramCount = 0;
    
    if (req.user.role !== 'admin') {
      query += ` AND s.userid = ${++paramCount}`;
      params.push(req.user.userId);
    }
    
    if (start_date) {
      query += ` AND s.date >= ${++paramCount}`;
      params.push(start_date);
    }
    
    if (end_date) {
      query += ` AND s.date <= ${++paramCount}`;
      params.push(end_date);
    }
    
    query += ' ORDER BY s.date DESC';
    
    const result = await pool.query(query, params);
    
    if (format === 'csv') {
      // Generar CSV
      const csv = [
        'ID,Título,Fecha,Estado,Ubicación,Precio,Cliente,Email,Paquete',
        ...result.rows.map(row => 
          `${row.id},"${row.title}","${row.date}","${row.status}","${row.location || ''}","${row.price || ''}","${row.client_name}","${row.client_email}","${row.package_name || ''}"`
        )
      ].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="sesiones.csv"');
      res.send(csv);
    } else {
      res.json(result.rows);
    }
  } catch (error) {
    console.error('Export sessions error:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ========== ESTADÍSTICAS AVANZADAS ==========
app.get('/api/admin/stats', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const [
      monthlySessionsResult,
      monthlyIncomeResult,
      packageStatsResult,
      clientActivityResult
    ] = await Promise.all([
      pool.query(`
        SELECT 
          DATE_TRUNC('month', date) as month,
          COUNT(*) as session_count,
          COUNT(*) FILTER (WHERE status = 'completada') as completed_count
        FROM "Session" 
        WHERE date >= NOW() - INTERVAL '12 months'
        GROUP BY month 
        ORDER BY month
      `),
      pool.query(`
        SELECT 
          DATE_TRUNC('month', payment_date) as month,
          SUM(amount) as total_income,
          COUNT(*) as payment_count
        FROM "Payment" 
        WHERE payment_status = 'completed' 
        AND payment_date >= NOW() - INTERVAL '12 months'
        GROUP BY month 
        ORDER BY month
      `),
      pool.query(`
        SELECT 
          p.name,
          COUNT(s.id) as session_count,
          AVG(py.amount) as avg_price
        FROM "Package" p
        LEFT JOIN "Session" s ON p.id = s.package_id
        LEFT JOIN "Payment" py ON s.id = py.session_id AND py.payment_status = 'completed'
        GROUP BY p.id, p.name
        ORDER BY session_count DESC
      `),
      pool.query(`
        SELECT 
          u.name,
          u.email,
          COUNT(s.id) as session_count,
          MAX(s.date) as last_session,
          SUM(py.amount) as total_spent
        FROM "User" u
        LEFT JOIN "Session" s ON u.id = s.userid
        LEFT JOIN "Payment" py ON s.id = py.session_id AND py.payment_status = 'completed'
        WHERE u.role = 'client'
        GROUP BY u.id, u.name, u.email
        HAVING COUNT(s.id) > 0
        ORDER BY total_spent DESC NULLS LAST
        LIMIT 10
      `)
    ]);
    
    res.json({
      monthlySessions: monthlySessionsResult.rows,
      monthlyIncome: monthlyIncomeResult.rows,
      packageStats: packageStatsResult.rows,
      topClients: clientActivityResult.rows
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Error interno del servidor: ' + err.message });
});

// Start server with error handling
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}).on('error', (error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});