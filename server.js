const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de directorios
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const PUBLIC_DIR = path.join(__dirname, 'public');

// Asegurar que las carpetas existen
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR);
}
if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR);
}

// Middleware
app.use(cors());
app.use(express.static(PUBLIC_DIR)); // Servir el frontend desde la carpeta 'public'

// Configuración de Multer para el manejo de subida de archivos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, UPLOADS_DIR);
    },
    filename: function (req, file, cb) {
        // Mantenemos el nombre original. Al guardarlo sobreescribirá si ya existe.
        cb(null, file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        // Solo aceptar archivos .dll
        if (path.extname(file.originalname).toLowerCase() === '.dll') {
            return cb(null, true);
        }
        cb(new Error('Solo se permiten archivos .dll'));
    }
});

// --- Rutas de la API ---

// 1. Subir una nueva DLL
app.post('/api/upload', upload.single('dll_file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No se subió ningún archivo o no es un .dll.' });
    }
    
    // Guardamos metadata de la última DLL subida para acceso rápido
    const metadata = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        uploadTime: new Date().toISOString(),
        size: req.file.size
    };
    
    fs.writeFileSync(path.join(UPLOADS_DIR, 'latest_info.json'), JSON.stringify(metadata));

    res.json({ success: true, message: 'Archivo DLL subido exitosamente.', data: metadata });
});

// 2. Obtener información de la última DLL subida
app.get('/api/latest-info', (req, res) => {
    const infoPath = path.join(UPLOADS_DIR, 'latest_info.json');
    if (fs.existsSync(infoPath)) {
        const info = JSON.parse(fs.readFileSync(infoPath, 'utf8'));
        res.json({ success: true, data: info });
    } else {
        res.status(404).json({ success: false, message: 'Aún no se ha subido ninguna DLL.' });
    }
});

// 3. Descargar la última DLL
app.get('/api/download/latest', (req, res) => {
    const infoPath = path.join(UPLOADS_DIR, 'latest_info.json');
    
    if (!fs.existsSync(infoPath)) {
        return res.status(404).send('Archivo no encontrado. Aún no se ha subido ninguna DLL.');
    }

    const info = JSON.parse(fs.readFileSync(infoPath, 'utf8'));
    const dllPath = path.join(UPLOADS_DIR, info.filename);

    if (fs.existsSync(dllPath)) {
        res.download(dllPath, info.filename); // Fuerza la descarga en el cliente
    } else {
        res.status(404).send('El archivo DLL físico no se encuentra en el servidor.');
    }
});

// --- Iniciar Servidor ---
app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 Consola de Administración iniciada`);
    console.log(`🌐 Accede al frontend en: http://localhost:${PORT}`);
    console.log(`======================================================\n`);
});
