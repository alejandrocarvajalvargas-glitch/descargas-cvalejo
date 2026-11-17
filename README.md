# Descargas oficiales (sitio estático)

Página para distribuir tus APK directamente, sin servidor ni base de datos.

## Estructura

```
index.html       Página principal (lista de apps)
privacy.html     Política de privacidad (completar antes de publicar)
apps.json        Configuración de las apps (editar aquí)
assets/          CSS y JS (sin claves ni secretos)
downloads/       Pon aquí los .apk (app1.apk, app2.apk, app3.apk)
_headers         Cabeceras de seguridad (Cloudflare Pages / Netlify)
```

## Publicar una app nueva o una versión nueva

1. Firma el APK con tu **keystore de release**. Ese archivo y sus contraseñas **no** van en esta carpeta.
2. Copia el APK a `downloads/` con el nombre indicado en `apps.json`.
3. Calcula su SHA-256:
   - Windows: `certutil -hashfile downloads\app1.apk SHA256`
   - Linux/macOS: `sha256sum downloads/app1.apk`
4. Pega el hash en `apps.json` (campo `sha256`, 64 caracteres hexadecimales) y actualiza `version`, `sizeMB`.

## Desplegar (dominio cvalejo.com)

Opción recomendada: **Cloudflare Pages** (gratis, HTTPS automático, lee `_headers`).
- Conecta la carpeta o el repositorio privado, sin variables de entorno.
- Asigna un subdominio, por ejemplo `descargas.cvalejo.com`, en la zona DNS de tu dominio.

Alternativa: Netlify (también lee `_headers`).

## Seguridad

- El sitio es 100 % estático: no hay backend, login ni formularios, así que no hay claves que exponer.
- No subas a esta carpeta: keystores (`.jks`, `.keystore`), `.env`, claves de API, `key.properties`, ni credenciales de Google. Hay que mantenerlos fuera del repositorio.
- Las cabeceras de `_headers` aplican CSP estricta, `nosniff` y bloqueo de iframes.
- El SHA-256 permite que quien descargue compruebe que el archivo no fue alterado.

## Sobre Google Play

Este sitio sirve para distribuir APK fuera de Play Store. No cambia las reglas de publicación en Google Play: las cuentas personales nuevas siguen sujetas a sus requisitos de pruebas cerradas antes de publicar en producción. Para usar esta página no es necesario saltarse ningún requisito de Play; las apps pueden instalarse desde aquí como cualquier APK, con la advertencia de origen desconocido de Android.
