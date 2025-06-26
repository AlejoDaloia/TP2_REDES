COMO DESPLEGAR EL PROYECTO:

1. Utilizar npm run dev:all 
2. recordar hacer un npm install
3. crear un archivo .env con el siguente contenido:
    # Configuración de base de datos
    DB_HOST=localhost
    DB_USER=root
    DB_PASSWORD= ''
    DB_NAME=TP2_REDES

    # Servicio de Auth
    PORT=6000
    # Servicio de eventos
    PORT2=6001
    # Servicio de incripciones
    PORT3=6002
    #Servicio de programacion
    PORT4=6003
    # Servicio de notificaciones
    PORT5=6004

    # Configuracioón JWT
    JWT_SECRET=clave
    JWT_EXPIRATION=1h
    REFRESH_TOKEN_EXPIRATION_DAYS=24h

    NODE_ENV=development
4. Asegurarse de tener creada la DB de mysql:
    CREATE DATABASE TP2_REDES;

    USE TP2_REDES;

    CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('asistente', 'organizador', 'expositor', 'administrador') NOT NULL,
    totp_secret VARCHAR(255),
    totp_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE refresh_tokens (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    token TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE eventos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    location VARCHAR(100),
    capacity INT,
    start_date DATETIME,
    end_date DATETIME,
    status ENUM('planificado', 'activo', 'finalizado') DEFAULT 'planificado',
    created_by INT NOT NULL, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE tipos_inscripcion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL
    );

    CREATE TABLE inscripciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    evento_id INT NOT NULL,
    tipo_inscripcion INT NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE CASCADE,
    FOREIGN KEY (tipo_inscripcion) REFERENCES tipos_inscripcion(id) ON DELETE RESTRICT
    );

    CREATE TABLE salas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    ubicacion VARCHAR(255),
    capacidad INT,
    evento_id INT NOT NULL,
    FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE CASCADE
    );

    CREATE TABLE actividades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    sala_id INT NOT NULL,
    evento_id INT NOT NULL,
    expositor_id INT NOT NULL,
    fecha_inicio DATETIME NOT NULL,
    fecha_fin DATETIME NOT NULL,
    FOREIGN KEY (sala_id) REFERENCES salas(id) ON DELETE CASCADE,
    FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE CASCADE,
    FOREIGN KEY (expositor_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE notificaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    tipo ENUM('comunicado', 'recordatorio', 'alerta') NOT NULL,
    titulo VARCHAR(100) NOT NULL,
    mensaje TEXT NOT NULL,
    leida BOOLEAN DEFAULT FALSE,
    enviada BOOLEAN DEFAULT FALSE,
    fecha_envio DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE suscripciones_evento (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    evento_id INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE CASCADE,
    UNIQUE (user_id, evento_id)
    );

    CREATE TABLE tareas_programadas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    actividad_id INT NOT NULL,
    user_id INT NOT NULL,
    tipo ENUM('recordatorio_actividad', 'alerta_cambio') NOT NULL,
    programada_para DATETIME NOT NULL,
    enviada BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (actividad_id) REFERENCES actividades(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );