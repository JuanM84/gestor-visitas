# 🏛️ Sistema de Gestión de Visitas — Túnel Subfluvial

Este es el repositorio del **Sistema de Gestión de Visitas del Túnel Subfluvial "Uranga - Sylvestre Begnis"**. Es una solución integral diseñada para digitalizar, coordinar y auditar la reserva de turnos, el aforo y la emisión de reportes estadísticos y comprobantes de visitas guiadas.

El sistema cuenta con una arquitectura desacoplada formada por un **Frontend SPA** (React + TypeScript) y un **Backend RESTful** (Express + PostgreSQL).

---

## Documentación

**Acceso a la documentación del sistema:**[Gestor de Visitas](https://mintlify.wiki/JuanM84/gestor-visitas)

---
## 🗺️ Arquitectura de Alto Nivel

La comunicación entre componentes se realiza mediante peticiones HTTPS asíncronas con transferencia de datos en formato JSON y autenticación basada en tokens JWT:

```mermaid
graph TD
    subgraph Cliente ["Capa Cliente (Frontend - React)"]
        A[Navegador Web / React UI]
        B[AuthContext / Estado Global]
        C[Fetch API Client]
    end

    subgraph Servidor ["Capa de Aplicación (Backend - Express)"]
        D[Middleware de Seguridad: CORS / JWT]
        E[Rutas Express / Routes]
        F[Controladores / Controllers]
        G[Servicios de Negocio / Services]
        H[Repositorios de Datos / Repositories]
        I[Generador de PDFs / Puppeteer-Core]
    end

    subgraph Persistencia ["Capa de Datos"]
        J[(PostgreSQL DB)]
    end

    subgraph API_Externa ["Servicios Externos"]
        K[API de Georreferenciación Gob.ar]
    end

    A --> B
    B --> C
    C -->|Petición HTTPS + JWT / JSON| D
    D --> E
    E --> F
    F --> G
    G --> H
    G -.->|Renderiza HTML a PDF| I
    A -.->|Normaliza Provincias/Localidades| K
    H -->|Query SQL / pg Pool| J
    J -->|Datos resultantes| H
    H --> G
    G --> F
    F -->|Respuesta HTTP JSON / Archivo PDF| C
    C --> A
```

---

## 🚀 Características Principales

*   **Autenticación y Control de Roles:** Seguridad por token JWT con perfiles diferenciados (`Admin` y `Guía`) y cierre de sesión automático configurable por inactividad.
*   **Gestión de Aforo Multi-nivel (Múltiples Grupos por Turno):**
    *   **Límite Diario (`capacidad_maxima`):** Suma total diaria para evitar sobrecargar las instalaciones (por defecto 1600 personas).
    *   **Límite por Turno (`capacidad_por_turno`):** Permite registrar más de un grupo en el mismo slot horario (`fecha` + `hora_inicio`), sumando sus integrantes hasta alcanzar un aforo seguro (por defecto 80 personas).
*   **Calendario Mensual Interactivo:** Renderizado dinámico de la disponibilidad y estado de cada día (Slots libres, Alta Ocupación o Día Inhabilitado).
*   **Días Inhábiles:** Bloqueo preventivo de fechas especiales o feriados nacionales.
*   **Pistas de Auditoría:** Registro automático de las acciones realizadas por cada usuario (`crear`, `modificar`, `cancelar`, `configurar`), asegurando la trazabilidad del sistema.
*   **Generación Automatizada de PDFs (Headless Chromium):**
    *   Cronograma operativo diario de visitas para el personal de guías.
    *   Comprobante de reserva individual para el gestor.
    *   Reportes y gráficos de estadísticas mensuales y por períodos personalizados.
*   **Normalización Geográfica:** Integración con la API oficial de Georreferenciación de la República Argentina para registrar localidades y provincias de manera uniforme.

---

## 🛠️ Tecnologías y Dependencias

### Frontend
*   **Core:** React 19, TypeScript, Vite
*   **Estilos:** Tailwind CSS 3, PostCSS, Autoprefixer
*   **Ruteo:** React Router DOM 7
*   **Utilidades:** Excel XLSX parser/exporter, Tailwind-merge, Clsx

### Backend
*   **Core:** Node.js, Express 5, TypeScript 6
*   **Base de Datos:** PostgreSQL con pool de conexiones (`pg` 8)
*   **Seguridad:** BcryptJS (hasheado de contraseñas), JSONWebToken (sesiones JWT)
*   **Generador PDF:** Puppeteer-core + `@sparticuz/chromium` (headless)
*   **Documentación API:** Swagger UI Express + Swagger JSDoc (OpenAPI 3.0)

---

## 📂 Estructura del Proyecto

```
dev/
├── backend/                  # Código fuente del Servidor REST
│   ├── src/
│   │   ├── config/           # Base de datos y configuración de Swagger
│   │   ├── controllers/      # Controladores HTTP (reciben request y envían response)
│   │   ├── middleware/       # Autenticación JWT y validación de roles
│   │   ├── repositories/     # Consultas SQL nativas a la base de datos
│   │   ├── routes/           # Rutas expuestas y anotaciones de Swagger
│   │   ├── services/         # Lógica y reglas de negocio del sistema
│   │   ├── types/            # Tipos e interfaces estáticas
│   │   └── utils/            # Validadores y utilidades
│   ├── migrate.js            # Migración e inicialización de la base de datos
│   └── tsconfig.json
├── frontend/                 # Código fuente del Cliente React
│   ├── src/
│   │   ├── components/       # Componentes UI reutilizables
│   │   ├── context/          # Manejo global del estado de autenticación
│   │   ├── pages/            # Vistas principales de la aplicación
│   │   └── utils/            # Tipos de datos comunes y utilidades
│   └── tailwind.config.js
└── docs/                     # Documentación de arquitectura y diseño del sistema
```

---

## ⚙️ Instalación y Configuración Local

### Requisitos Previos
*   **Node.js** (Versión 20.x o superior)
*   **PostgreSQL** (Servicio local en puerto `5432` o instancia en la nube)

---

### 1. Configuración de la Base de Datos

1. Cree una base de datos en PostgreSQL llamada `tunel_subfluvial` (o el nombre de su elección).
2. Configure el archivo `.env` del backend para vincularse a la misma.

---

### 2. Configuración y Arranque del Backend

1. Ingrese a la carpeta del servidor:
   ```bash
   cd backend
   ```
2. Instale las dependencias del proyecto:
   ```bash
   npm install
   ```
3. Cree un archivo `.env` en la raíz de `/backend` basado en el siguiente ejemplo:
   ```env
   PORT=3000
   FRONTEND_URL=http://localhost:5173
   JWT_SECRET=tu_clave_secreta_super_segura
   JWT_EXPIRY=24h

   # Configuración de Base de Datos Local
   DB_USER=postgres
   DB_HOST=localhost
   DB_NAME=tunel_subfluvial
   DB_PASSWORD=tu_contraseña
   DB_PORT=5432

   # O URL completa (para entornos en la nube)
   # DATABASE_URL=postgresql://user:password@host:port/db
   ```
4. Ejecute el script de migración para estructurar e inicializar los datos de prueba (creará el usuario administrador `admin@tunel.com` / `admin123`):
   ```bash
   node migrate.js
   # Opcional (Migración de aforo por turno si aplica):
   node migrate_capacidad_turno.js
   ```
5. Inicie el servidor en modo desarrollo:
   ```bash
   npm run dev
   ```
   *El servidor quedará corriendo en: http://localhost:3000*

---

### 3. Configuración y Arranque del Frontend

1. Ingrese a la carpeta del cliente:
   ```bash
   cd ../frontend
   ```
2. Instale las dependencias:
   ```bash
   npm install
   ```
3. Cree un archivo `.env` en la raíz de `/frontend`:
   ```env
   VITE_API_URL=http://localhost:3000
   ```
4. Inicie el servidor de desarrollo Vite:
   ```bash
   npm run dev
   ```
   *El frontend quedará accesible en: http://localhost:5173*

---

## 📖 Documentación de la API (Swagger)

Con el backend en ejecución, puedes consultar e interactuar con toda la documentación oficial de la API de forma interactiva (OpenAPI 3.0):

*   **URL:** [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

Esta interfaz permite probar las llamadas HTTP directamente. Para probar endpoints protegidos:
1. Dirígete a `/api/auth/login` y obtén un token válido.
2. Presiona el botón **Authorize** en la parte superior derecha de Swagger.
3. Ingrese el valor `Bearer <TU_TOKEN_JWT>`.

---

## 📦 Compilación para Producción

### Servidor (Backend)
Compila el código TypeScript a JavaScript de distribución:
```bash
cd backend
npm run build
```
Los archivos optimizados se generarán en la carpeta `/dist`. Para iniciar en producción:
```bash
npm start
```

### Cliente (Frontend)
Genera los assets estáticos HTML/JS/CSS optimizados:
```bash
cd frontend
npm run build
```
Los archivos de distribución se generarán en `/dist` y están listos para ser servidos por un hosting estático (Vercel, Netlify, Nginx, etc.).
