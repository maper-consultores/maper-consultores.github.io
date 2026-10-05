# Sitio de MAPER

Esta carpeta contiene la web del despacho, su página de contacto. La identidad está concentrada en `marca.json`, para que el nombre y los datos sean iguales en todas las páginas.

## Cómo cambiar la marca

1. Abre **ABRIR EDITOR.cmd** con doble clic. Se abrirá el editor en tu navegador.
2. Cambia nombre, complemento, eslogan, logo, correo, WhatsApp o enlaces.
3. Revisa Inicio y Contacto, también en vista móvil.
4. Pulsa **Guardar en el sitio**. Los cambios quedan guardados en los archivos locales.
5. Mantén abierta la ventana del editor mientras trabajas; ciérrala al terminar.

Guardar no publica cambios en Internet. Para actualizar el sitio público, publica esta carpeta en el repositorio existente. No cambies la dirección pública ni los enlaces de redes hasta que esas direcciones estén confirmadas.

## Dónde está cada cosa

- `index.html` y `contacto/`: páginas públicas. Sus rutas se conservan.
- `assets/`: estilos, tipografía, logos y funciones compartidas.
- `scripts/`: editor local.
- `marca.json`: nombre, datos y enlaces de la marca.
- `.git` y `.github`: historial y configuración de GitHub.

El editor utiliza Python sin paquetes adicionales y escucha sólo en este ordenador. Los dos archivos de inicio detectan Python y Git disponibles, incluidos los instalados normalmente. Si falta una herramienta, la instalan con WinGet para el usuario actual. El editor requiere Python 3.10 o posterior y no necesita paquetes adicionales.

Los archivos históricos de NUMERA permanecen en `assets/logos` como referencia; el logo utilizado actualmente se configura desde el editor.

## En otra computadora Windows

Usa la carpeta completa del sitio, incluidos scripts y el historial .git. La carpeta puede estar en otra unidad: los accesos usan su propia ubicación. Abre ABRIR EDITOR.cmd para editar y SUBIR A GITHUB.cmd para publicar. Solo se instala la herramienta que falta; no se reinstalan las disponibles. La primera instalación necesita Internet y WinGet (Instalador de aplicaciones de Microsoft). Si Windows solicita permisos, autorízalos. En otra PC, GitHub puede pedir iniciar sesión con una cuenta que tenga acceso al repositorio. Cierra la ventana del editor al terminar; cada inicio utiliza un puerto libre.
