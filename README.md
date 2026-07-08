# Cacahuate Frontend

Aplicación frontend en React + TypeScript + Vite para el sistema de gestión de citas y pacientes.

## Requisitos previos

Asegúrate de tener instalado:

- Node.js 20 o superior
- npm (viene con Node.js)
- Visual Studio Code

## Abrir el proyecto en Visual Studio Code

1. Abre Visual Studio Code.
2. Selecciona Archivo > Abrir Carpeta.
3. Elige la carpeta del proyecto: `Cacahuate-frontend`.
4. Abre la terminal integrada con Ctrl + `.

## Instalar dependencias

Desde la raíz del proyecto ejecuta:

```bash
npm install
```

## Ejecutar la aplicación en modo desarrollo

```bash
npm run dev
```

Vite mostrará una URL similar a:

```text
http://localhost:5173/
```

Abre esa URL en tu navegador para ver la aplicación.

## Scripts disponibles

- `npm run dev` → inicia el servidor de desarrollo.
- `npm run build` → genera la versión de producción.
- `npm run preview` → previsualiza la build generada.
- `npm run lint` → ejecuta ESLint.

## Importante para el funcionamiento

Esta interfaz consume la API backend en:

```text
https://localhost:7191/api
```

Asegúrate de que el backend esté corriendo para que funciones como login, citas y demás operaciones.

## Estructura general

- `src/components` → componentes reutilizables.
- `src/pages` → vistas principales de la app.
- `src/services` → integración con la API.
- `src/contexts` → contextos globales como autenticación.
