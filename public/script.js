document.addEventListener('DOMContentLoaded', () => {
    const dropArea = document.getElementById('drop-area');
    const fileInput = document.getElementById('fileElem');
    const statusMessage = document.getElementById('upload-status');
    const statusText = document.getElementById('status-text');
    const latestInfoContainer = document.getElementById('latest-info');
    const downloadActionBar = document.getElementById('download-action-bar');
    const modal = document.getElementById('instructions-modal');
    const showInstructionsBtn = document.getElementById('show-instructions-btn');
    const closeBtn = document.querySelector('.close-btn');
    const copyCodeBtn = document.getElementById('copy-code-btn');

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

    // Handle click on drag zone to trigger file select
    dropArea.addEventListener('click', () => {
        fileInput.click();
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

        showStatus('Subiendo archivo a la nube...', 'uploading');
        
        fetch(url, {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error en la respuesta del servidor');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                showStatus(`¡Éxito! ${data.data.originalName} subido correctamente.`, 'success');
                updateLatestInfoUI(data.data);
            } else {
                showStatus(data.message || 'Error al subir el archivo.', 'error');
            }
        })
        .catch((error) => {
            console.error('Upload error:', error);
            showStatus('Error de red al intentar subir el archivo.', 'error');
        });
    }

    function showStatus(message, type) {
        statusText.textContent = message;
        statusMessage.className = `status-alert ${type}`;
        statusMessage.classList.remove('hidden');
        
        const spinner = statusMessage.querySelector('.status-spinner');
        if (type === 'uploading') {
            if (!spinner) {
                const newSpinner = document.createElement('div');
                newSpinner.className = 'status-spinner';
                statusMessage.prepend(newSpinner);
            }
        } else {
            if (spinner) spinner.remove();
            
            // Auto hide for successes and errors after 6 seconds
            setTimeout(() => {
                if (statusMessage.className.includes(type)) {
                    statusMessage.classList.add('hidden');
                }
            }, 6000);
        }
    }

    function fetchLatestInfo() {
        fetch('/api/latest-info')
            .then(response => {
                if (!response.ok) {
                    throw new Error('No DLL found or server error');
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    updateLatestInfoUI(data.data);
                } else {
                    showEmptyState();
                }
            })
            .catch(() => {
                showEmptyState();
            });
    }

    function showEmptyState() {
        latestInfoContainer.innerHTML = '<p class="empty-state">Ninguna DLL subida aún.</p>';
        if (downloadActionBar) {
            downloadActionBar.classList.add('hidden');
        }
    }

    function updateLatestInfoUI(info) {
        const date = new Date(info.uploadTime).toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        const sizeKB = (info.size / 1024).toFixed(2);
        
        latestInfoContainer.innerHTML = `
            <div class="info-item">
                <span class="info-label">Archivo:</span>
                <span class="info-value">${info.originalName}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Actualizado:</span>
                <span class="info-value">${date}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Tamaño:</span>
                <span class="info-value">${sizeKB} KB</span>
            </div>
        `;

        if (downloadActionBar) {
            downloadActionBar.classList.remove('hidden');
        }
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

    // Tabs logic inside modal
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabTarget = btn.getAttribute('data-tab');
            
            // Deactivate all tabs
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Activate selected tab
            btn.classList.add('active');
            document.getElementById(`tab-${tabTarget}`).classList.add('active');
        });
    });

    // Copy to clipboard
    copyCodeBtn.addEventListener('click', () => {
        const code = document.getElementById('powershell-code-block').innerText;
        navigator.clipboard.writeText(code).then(() => {
            const originalSpanText = copyCodeBtn.querySelector('span').innerText;
            copyCodeBtn.querySelector('span').innerText = '¡Copiado!';
            copyCodeBtn.classList.add('copied');
            
            setTimeout(() => {
                copyCodeBtn.querySelector('span').innerText = originalSpanText;
                copyCodeBtn.classList.remove('copied');
            }, 2500);
        });
    });
});
