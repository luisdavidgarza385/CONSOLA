using System;
using System.ComponentModel;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Threading;

namespace DllLoader
{
    class Program
    {
        static string serverUrl = "https://consola-beige.vercel.app/api/download/latest";
        static string savePath = "";
        static string targetApp = "";

        static void Main(string[] args)
        {
            Console.Title = "DLL Auto Updater & Loader";
            Console.ForegroundColor = ConsoleColor.Cyan;
            Console.WriteLine("=============================================");
            Console.WriteLine("       Buscando actualizaciones de DLL...    ");
            Console.WriteLine("=============================================");
            Console.WriteLine("");
            Console.ResetColor();

            // Cargar o solicitar configuración
            LoadConfig();

            try
            {
                Console.WriteLine("[*] Conectando con la consola web...");
                
                // Configurar protocolos de seguridad
                ServicePointManager.SecurityProtocol = SecurityProtocolType.Tls12;

                using (WebClient client = new WebClient())
                {
                    AutoResetEvent waiter = new AutoResetEvent(false);
                    Exception downloadError = null;

                    // Evento para mostrar la barra de progreso
                    client.DownloadProgressChanged += (sender, e) =>
                    {
                        int barLength = 20;
                        int progress = (int)((double)e.ProgressPercentage / 100 * barLength);
                        string bar = new string('=', progress) + new string(' ', barLength - progress);
                        Console.Write("\r[*] Descargando: " + e.ProgressPercentage + "% [" + bar + "] (" + (e.BytesReceived / 1024.0).ToString("F0") + " KB / " + (e.TotalBytesToReceive / 1024.0).ToString("F0") + " KB)");
                    };

                    client.DownloadFileCompleted += (sender, e) =>
                    {
                        if (e.Error != null)
                        {
                            downloadError = e.Error;
                        }
                        waiter.Set();
                    };

                    // Iniciar descarga asíncrona
                    client.DownloadFileAsync(new Uri(serverUrl), savePath);
                    waiter.WaitOne();

                    if (downloadError != null)
                    {
                        throw downloadError;
                    }
                }
                
                Console.WriteLine("\n");
                Console.ForegroundColor = ConsoleColor.Green;
                Console.WriteLine("[+] ¡Éxito! Nueva DLL descargada en:");
                Console.WriteLine("    " + savePath);
                Console.ResetColor();
            }
            catch (Exception ex)
            {
                Console.WriteLine("\n");
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine("[-] No se pudo descargar la actualización.");
                Console.WriteLine("    Detalle: " + ex.Message);
                Console.ForegroundColor = ConsoleColor.Yellow;
                Console.WriteLine("    Asegúrate de que la consola web esté en línea.");
                Console.ResetColor();
                Console.WriteLine("\nPresiona cualquier tecla para salir...");
                SafeReadKey();
                return;
            }

            Console.WriteLine("\n[*] Buscando aplicación objetivo...");

            if (File.Exists(targetApp))
            {
                Console.ForegroundColor = ConsoleColor.Green;
                Console.WriteLine("[+] Abriendo " + Path.GetFileName(targetApp) + "...");
                Console.ResetColor();
                try
                {
                    Process.Start(targetApp);
                }
                catch (Exception ex)
                {
                    Console.ForegroundColor = ConsoleColor.Red;
                    Console.WriteLine("[-] Error al abrir la aplicación: " + ex.Message);
                    Console.ResetColor();
                }
            }
            else
            {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine("[-] No se encontró la aplicación en: " + targetApp);
                Console.WriteLine("    Por favor, ejecuta tu aplicación de forma manual.");
                Console.ResetColor();
            }

            Console.WriteLine("\nProceso terminado. Presiona cualquier tecla para salir...");
            SafeReadKey();
        }

        static void LoadConfig()
        {
            string configPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "actualizador_config.txt");
            string userProfile = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
            string downloadsFolder = Path.Combine(userProfile, "Downloads");
            string defaultSavePath = Path.Combine(downloadsFolder, "ultima_actualizacion.dll");
            string defaultTargetApp = Path.Combine(downloadsFolder, "Extreme Injector v3.exe");

            if (File.Exists(configPath))
            {
                try
                {
                    var lines = File.ReadAllLines(configPath);
                    foreach (var line in lines)
                    {
                        var parts = line.Split(new char[] { '=' }, 2);
                        if (parts.Length == 2)
                        {
                            var key = parts[0].Trim();
                            var val = parts[1].Trim();
                            if (key == "ServerUrl") serverUrl = val;
                            else if (key == "SavePath") savePath = val;
                            else if (key == "TargetApp") targetApp = val;
                        }
                    }
                }
                catch {}
            }

            // Establecer valores por defecto si están vacíos
            if (string.IsNullOrEmpty(savePath)) savePath = defaultSavePath;
            if (string.IsNullOrEmpty(targetApp)) targetApp = defaultTargetApp;

            // Si el programa objetivo predeterminado no existe, le pedimos la ruta al usuario
            if (!File.Exists(targetApp))
            {
                Console.ForegroundColor = ConsoleColor.Yellow;
                Console.WriteLine("[!] No se encontró el programa predeterminado ('Extreme Injector v3.exe' en Descargas).");
                Console.WriteLine("    Por favor, ingresa la ruta completa de tu programa o arrastra el archivo aquí");
                Console.Write("    y presiona Enter: ");
                Console.ResetColor();
                string input = Console.ReadLine();
                if (!string.IsNullOrEmpty(input))
                {
                    // Limpiar comillas si el usuario arrastró y soltó el archivo en la consola
                    targetApp = input.Replace("\"", "").Trim();
                }
                SaveConfig(configPath);
                Console.WriteLine();
            }
            else
            {
                // Guardar la configuración predeterminada si el archivo no existía
                if (!File.Exists(configPath))
                {
                    SaveConfig(configPath);
                }
            }
        }

        static void SaveConfig(string path)
        {
            try
            {
                string content = "ServerUrl=" + serverUrl + "\r\nSavePath=" + savePath + "\r\nTargetApp=" + targetApp;
                File.WriteAllText(path, content);
            }
            catch {}
        }

        static void SafeReadKey()
        {
            try
            {
                Console.ReadKey(true);
            }
            catch (InvalidOperationException)
            {
                Console.Read();
            }
        }
    }
}
