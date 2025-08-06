-- Tabla de Paquetes
CREATE TABLE "Package" (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  duration_minutes INTEGER NOT NULL,
  photo_count INTEGER,
  location_count INTEGER DEFAULT 1,
  features JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla de Pagos
CREATE TABLE "Payment" (
  id SERIAL PRIMARY KEY,
  session_id INTEGER REFERENCES "Session"(id) ON DELETE SET NULL,
  user_id INTEGER REFERENCES "User"(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL, -- 'cash', 'card', 'transfer', 'paypal'
  payment_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'
  transaction_id TEXT,
  payment_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla de Material Fotográfico
CREATE TABLE "PhotoDelivery" (
  id SERIAL PRIMARY KEY,
  session_id INTEGER REFERENCES "Session"(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT, -- URL del archivo o enlace
  file_type TEXT, -- 'link', 'drive', 'dropbox'
  download_count INTEGER DEFAULT 0,
  expiry_date TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla de Notificaciones
CREATE TABLE "Notification" (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES "User"(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'email', 'system'
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla de Configuraciones del Sistema
CREATE TABLE "SystemConfig" (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla de Logs de Actividad
CREATE TABLE "ActivityLog" (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES "User"(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL, -- 'session', 'payment', 'user'
  entity_id INTEGER,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para optimización
CREATE INDEX idx_session_user_id ON "Session"(userId);
CREATE INDEX idx_session_date ON "Session"(date);
CREATE INDEX idx_session_status ON "Session"(status);
CREATE INDEX idx_payment_session_id ON "Payment"(session_id);
CREATE INDEX idx_payment_user_id ON "Payment"(user_id);
CREATE INDEX idx_payment_status ON "Payment"(payment_status);
CREATE INDEX idx_notification_user_id ON "Notification"(user_id);
CREATE INDEX idx_notification_is_read ON "Notification"(is_read);
CREATE INDEX idx_activity_log_user_id ON "ActivityLog"(user_id);
CREATE INDEX idx_activity_log_created_at ON "ActivityLog"(created_at);



