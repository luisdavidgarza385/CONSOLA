document.addEventListener('DOMContentLoaded', () => {
    const dropArea = document.getElementById('drop-area');
    const fileInput = document.getElementById('fileElem');
    const statusMessage = document.getElementById('upload-status');
    const latestInfoContainer = document.getElementById('latest-info');
    const modal = document.getElementById('instructions-modal');
    const showInstructionsBtn = document.getElementById('show-instructions-btn');
    const closeBtn = document.querySelector('.close-btn');
    const copyVbaBtn = document.getElementById('copy-vba-btn');

    // Inicializar carga de datos de la última DLL
    fetchLatestInfo();

    // Prevent defaults for drag and drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    // Highlight drop area
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => dropArea.classList.add('highlight'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => dropArea.classList.remove('highlight'), false);
    });

    // Handle dropped files
    dropArea.addEventListener('drop', (e) => {
        let dt = e.dataTransfer;
        let files = dt.files;
        handleFiles(files);
    });

    // Handle selected files via file explorer
    fileInput.addEventListener('change', function() {
        handleFiles(this.files);
    });

    function handleFiles(files) {
        if (files.length === 0) return;
        const file = files[0];
        
        // Validar extensión
        if (!file.name.toLowerCase().endsWith('.dll')) {
            showStatus('Error: Solo se permiten archivos .dll', 'error');
            return;
        }

        uploadFile(file);
    }

    function uploadFile(file) {
        const url = '/api/upload';
        const formData = new FormData();
        formData.append('dll_file', file);

        showStatus('Subiendo archivo...', '');
        
        fetch(url, {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showStatus(`¡Éxito! ${data.data.originalName} subido correctamente.`, 'success');
                updateLatestInfoUI(data.data);
            } else {
                showStatus(data.message || 'Error al subir el archivo.', 'error');
            }
        })
        .catch(() => {
            showStatus('Error de red al intentar subir el archivo.', 'error');
        });
    }

    function showStatus(message, type) {
        statusMessage.textContent = message;
        statusMessage.className = `status-message ${type}`;
        statusMessage.classList.remove('hidden');
        
        if (type === 'success') {
            setTimeout(() => {
                statusMessage.classList.add('hidden');
            }, 5000);
        }
    }

    function fetchLatestInfo() {
        fetch('/api/latest-info')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    updateLatestInfoUI(data.data);
                } else {
                    latestInfoContainer.innerHTML = '<p class="empty-state">Ninguna DLL subida aún.</p>';
                }
            })
            .catch(() => {
                latestInfoContainer.innerHTML = '<p class="error">Error al cargar la información.</p>';
            });
    }

    function updateLatestInfoUI(info) {
        const date = new Date(info.uploadTime).toLocaleString();
        const sizeKB = (info.size / 1024).toFixed(2);
        
        latestInfoContainer.innerHTML = `
            <p><strong>Archivo:</strong> ${info.originalName}</p>
            <p><strong>Actualizado:</strong> ${date}</p>
            <p><strong>Tamaño:</strong> ${sizeKB} KB</p>
        `;
    }

    // Modal Logic
    showInstructionsBtn.addEventListener('click', () => {
        modal.classList.remove('hidden');
    });

    closeBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('hidden');
        }
    });

    copyVbaBtn.addEventListener('click', () => {
        const code = document.getElementById('vba-code-block').innerText;
        navigator.clipboard.writeText(code).then(() => {
            const originalText = copyVbaBtn.innerText;
            copyVbaBtn.innerText = '¡Copiado!';
            setTimeout(() => {
                copyVbaBtn.innerText = originalText;
            }, 2000);
        });
    });
});
