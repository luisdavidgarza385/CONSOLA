const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const { put, list } = require('@vercel/blob');

const app = express();
const PORT = process.env.PORT || 3000;

// Servir frontend desde la carpeta 'public'
const PUBLIC_DIR = path.join(__dirname, 'public');
app.use(cors());
app.use(express.static(PUBLIC_DIR));

// Usar memoria RAM en vez del disco duro (Requisito de Vercel)
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (path.extname(file.originalname).toLowerCase() === '.dll') {
            return cb(null, true);
        }
        cb(new Error('Solo se permiten archivos .dll'));
    }
});

// Helper para realizar peticiones autenticadas a Vercel Blob (para almacenes privados)
const fetchBlob = async (url) => {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    if (!response.ok) {
        throw new Error(`Error al leer archivo de la nube: ${response.statusText}`);
    }
    return response;
};

// --- Rutas de la API para VERCEL BLOB ---

app.post('/api/upload', upload.single('dll_file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No se subió ningún archivo o no es un .dll.' });
    }
    
    try {
        // Subir la DLL a Vercel Blob usando acceso 'private'
        const blob = await put(req.file.originalname, req.file.buffer, {
            access: 'private',
            addRandomSuffix: false // Sobreescribe si tiene el mismo nombre
        });

        // Crear metadata
        const metadata = {
            filename: req.file.originalname,
            originalName: req.file.originalname,
            uploadTime: new Date().toISOString(),
            size: req.file.size,
            url: blob.url // URL del archivo
        };
        
        // Guardar metadata en Vercel Blob como 'latest_info.json' usando acceso 'private'
        await put('latest_info.json', JSON.stringify(metadata), {
            access: 'private',
            addRandomSuffix: false
        });

        res.json({ success: true, message: 'Archivo subido a Vercel Blob.', data: metadata });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error de nube: ' + error.message });
    }
});

app.get('/api/latest-info', async (req, res) => {
    try {
        const { blobs } = await list();
        const infoBlob = blobs.find(b => b.pathname === 'latest_info.json');
        
        if (infoBlob) {
            const response = await fetchBlob(infoBlob.url);
            const info = await response.json();
            res.json({ success: true, data: info });
        } else {
            res.status(404).json({ success: false, message: 'Aún no se ha subido ninguna DLL.' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al leer de la nube: ' + error.message });
    }
});

app.get('/api/download/latest', async (req, res) => {
    try {
        const { blobs } = await list();
        const infoBlob = blobs.find(b => b.pathname === 'latest_info.json');
        
        if (!infoBlob) {
            return res.status(404).send('Aún no se ha subido ninguna DLL a la nube.');
        }

        const infoResponse = await fetchBlob(infoBlob.url);
        const info = await infoResponse.json();
        
        // Descargar el archivo desde Vercel Blob usando el token de autenticación
        const fileResponse = await fetchBlob(info.url);
        
        // Convertir el cuerpo de la respuesta a un buffer y enviarlo al cliente
        const arrayBuffer = await fileResponse.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        res.setHeader('Content-Disposition', `attachment; filename="${info.originalName}"`);
        res.setHeader('Content-Type', 'application/octet-stream');
        res.send(buffer);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al intentar descargar de la nube: ' + error.message);
    }
});

// Exportar para que Vercel lo pueda ejecutar
module.exports = app;

// Iniciar servidor local si se corre en la PC
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🚀 Consola iniciada en http://localhost:${PORT}`);
    });
}
