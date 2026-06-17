using System;
using System.ComponentModel;
using System.Diagnostics;
using System.IO;
using System.Net;

namespace DllLoader
{
    class Program
    {
        static void Main(string[] args)
        {
            Console.Title = "DLL Auto Updater & Loader";
            Console.ForegroundColor = ConsoleColor.Cyan;
            Console.WriteLine("=============================================");
            Console.WriteLine("       Buscando actualizaciones de DLL...    ");
            Console.WriteLine("=============================================");
            Console.WriteLine("");
            Console.ResetColor();

            // Configuración
            string serverUrl = "http://localhost:3000/api/download/latest";
            string userProfile = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
            string downloadsFolder = Path.Combine(userProfile, "Downloads");
            string savePath = Path.Combine(downloadsFolder, "ultima_actualizacion.dll");
            
            // Asumiendo que el inyector está en Descargas, dentro de su carpeta o suelto
            string injectorPath = Path.Combine(downloadsFolder, "Extreme Injector v3.exe");
            
            // Alternativa: la carpeta real donde lo tienes guardado
            string injectorPathAlt = Path.Combine(downloadsFolder, "Extreme.Injector.v3.7.3.-.by.master131", "Extreme Injector v3.exe");

            try
            {
                Console.WriteLine("[*] Conectando con la consola web...");
                using (WebClient client = new WebClient())
                {
                    // Si tienes problemas de HTTPS, descomenta la siguiente línea:
                    // ServicePointManager.SecurityProtocol = SecurityProtocolType.Tls12;
                    client.DownloadFile(serverUrl, savePath);
                }
                
                Console.ForegroundColor = ConsoleColor.Green;
                Console.WriteLine("[+] ¡Exito! Nueva DLL descargada en:");
                Console.WriteLine("    " + savePath);
                Console.ResetColor();
            }
            catch (Exception ex)
            {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine("[-] No se pudo descargar la actualizacion.");
                Console.WriteLine("    Detalle: " + ex.Message);
                Console.ForegroundColor = ConsoleColor.Yellow;
                Console.WriteLine("    Asegurate de que tu servidor Node.js este corriendo.");
                Console.ResetColor();
                Console.WriteLine("\nPresiona cualquier tecla para salir...");
                Console.ReadKey();
                return;
            }

            Console.WriteLine("\n[*] Buscando Extreme Injector v3...");

            string finalInjectorPath = "";
            if (File.Exists(injectorPath))
            {
                finalInjectorPath = injectorPath;
            }
            else if (File.Exists(injectorPathAlt))
            {
                finalInjectorPath = injectorPathAlt;
            }

            if (!string.IsNullOrEmpty(finalInjectorPath))
            {
                Console.ForegroundColor = ConsoleColor.Green;
                Console.WriteLine("[+] Abriendo Extreme Injector v3...");
                Console.ResetColor();
                try
                {
                    Process.Start(finalInjectorPath);
                }
                catch (Exception ex)
                {
                    Console.ForegroundColor = ConsoleColor.Red;
                    Console.WriteLine("[-] Error al abrir el inyector: " + ex.Message);
                    Console.ResetColor();
                }
            }
            else
            {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine("[-] No se encontro 'Extreme Injector v3.exe' en tus Descargas.");
                Console.WriteLine("    Por favor abre el inyector manualmente y selecciona la dll:");
                Console.WriteLine("    " + savePath);
                Console.ResetColor();
            }

            Console.WriteLine("\nProceso terminado. Presiona cualquier tecla para salir...");
            Console.ReadKey();
        }
    }
}
