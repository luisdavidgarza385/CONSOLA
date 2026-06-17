# Script Actualizador y Lanzador para Extreme Injector v3
# Descarga la última DLL desde tu consola web y abre el inyector.

# Configuración
$ServerUrl = "https://consola-beige.vercel.app/api/download/latest"
$InjectorPath = "$env:USERPROFILE\Downloads\Extreme Injector v3.exe"
$DllSavePath = "$env:USERPROFILE\Downloads\ultima_actualizacion.dll"

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "   Buscando actualizaciones de DLL..." -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

try {
    # 1. Intentar descargar la DLL
    Write-Host "[*] Conectando con la consola web en $ServerUrl ..."
    Invoke-WebRequest -Uri $ServerUrl -OutFile $DllSavePath -UseBasicParsing -ErrorAction Stop
    
    Write-Host "[+] ¡Éxito! Nueva DLL descargada en: $DllSavePath" -ForegroundColor Green
}
catch {
    Write-Host "[-] No se pudo descargar la actualización." -ForegroundColor Red
    Write-Host "    Detalle del error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "    Asegúrate de que 'node server.js' esté corriendo y hayas subido una DLL." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[*] Comprobando Extreme Injector..."

# 2. Iniciar el inyector si existe
if (Test-Path $InjectorPath) {
    Write-Host "[+] Abriendo Extreme Injector v3..." -ForegroundColor Green
    Start-Process -FilePath $InjectorPath
} else {
    Write-Host "[-] No se encontró 'Extreme Injector v3.exe' en la carpeta de Descargas." -ForegroundColor Red
}

Write-Host ""
Write-Host "Proceso terminado. Presiona cualquier tecla para salir..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
