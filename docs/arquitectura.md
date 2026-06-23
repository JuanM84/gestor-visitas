# 🏛️ Arquitectura General del Sistema — Gestión de Visitas (Túnel Subfluvial)

Este documento describe la arquitectura de software del **Sistema de Gestión de Visitas del Túnel Subfluvial**, detallando el diseño técnico, la separación de responsabilidades en capas y cómo interactúan las tecnologías principales del stack: **React (Frontend)**, **Node.js/Express (Backend)** y **PostgreSQL (Base de Datos)**.

---

## 1. 🗺️ Diagrama de Arquitectura de Alto Nivel

El sistema sigue una arquitectura cliente-servidor desacoplada. A continuación se presenta el flujo general de comunicación entre los componentes del sistema:

```mermaid
graph TD
    subgraph Cliente ["Capa Cliente (Frontend - React)"]
        A[Navegador Web / React UI]
        B[AuthContext / Estado Global]
        C[Fetch API Client]
    end

    subgraph Servidor ["Capa de Aplicación (Backend - Node.js/Express)"]
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

## 2. 💻 Capa Cliente (Frontend - React)

El frontend está desarrollado sobre **React 18** utilizando **TypeScript** y compilado con **Vite**. La interfaz está estilizada usando **Tailwind CSS** para un diseño moderno y responsivo.

### Organización de Código
* **`src/pages/`**: Páginas principales del sistema (`Dashboard`, `Calendario`, `RegistroVisita`, `Auditoria`, etc.) que gestionan el estado local de los formularios y la renderización de las vistas.
* **`src/components/`**: Componentes UI reutilizables (botones, tablas, diálogos interactivos, componentes de gráficos para estadísticas).
* **`src/context/`**: Manejo del estado global. Contiene el `AuthContext.tsx`, que controla la sesión del usuario, almacena el token JWT en el `localStorage`, intercepta la inactividad del usuario para el cierre automático de sesión (`session_timeout_minutes`) y expone los datos del usuario logueado.
* **`src/utils/`**: Funciones auxiliares y definiciones de tipos estáticos (`visitaTypes.ts`).

### Comunicación con el Backend
El frontend se comunica con el servidor de forma asíncrona a través de la **Fetch API** de JavaScript utilizando variables de entorno (`import.meta.env.VITE_API_URL`) para definir la dirección del servidor. 

> [!NOTE]
> Todas las peticiones HTTP que requieren autorización adjuntan el token JWT guardado localmente en las cabeceras de la petición:
> `headers: { 'Authorization': 'Bearer <Token_JWT>' }`

---

## 3. ⚙️ Capa de Aplicación (Backend - Node.js + Express)

El backend está desarrollado en **Node.js** con **TypeScript**, estructurado sobre el framework web **Express**. Sigue un patrón de arquitectura limpia dividida en **4 capas principales de responsabilidad**:

```
[Cliente] ──> [Middleware (JWT)] ──> [Routes] ──> [Controllers] ──> [Services] ──> [Repositories] ──> [PostgreSQL]
```

### Capas del Backend
1. **Middlewares (`src/middleware/`)**:
   * **`auth.middleware.ts`**: Intercepta las solicitudes entrantes, extrae el token JWT del encabezado `Authorization`, lo verifica usando la clave secreta y almacena los datos decodificados en el objeto de la petición (`req.usuario`). Adicionalmente valida si el rol del usuario posee los permisos adecuados (`verificarRol`).
2. **Rutas (`src/routes/`)**:
   * Define los endpoints del sistema (ej. `/api/visitas`, `/api/usuarios`, `/api/gestores`). Asocia cada ruta con su respectivo controlador y le aplica los middlewares de autenticación necesarios.
3. **Controladores (`src/controllers/`)**:
   * Actúan como puntos de entrada de la petición HTTP. Extraen datos de la URL (`req.params`), de la query string (`req.query`) o del cuerpo (`req.body`), delegan la lógica de negocio a los servicios correspondientes y devuelven la respuesta en formato JSON con el código de estado HTTP adecuado.
4. **Servicios (`src/services/`)**:
   * Contienen toda la lógica de negocio y reglas operativas del sistema (ej. cálculo de estadísticas, verificación de aforo acumulado, validación de solapamiento de horas, etc.). 
   * Es una capa agnóstica del protocolo de transporte (no sabe que existe HTTP).
   * **`export.service.ts`**: Utiliza `puppeteer-core` y `@sparticuz/chromium` para levantar un navegador headless, renderizar una plantilla HTML en memoria e imprimirla en formato PDF (utilizado para comprobantes individuales de visitas y reportes estadísticos).
5. **Repositorios (`src/repositories/`)**:
   * Encapsulan las operaciones directas de lectura y escritura en la base de datos PostgreSQL. Utilizan consultas SQL parametrizadas nativas para máxima performance y seguridad contra inyección de SQL.

---

## 4. 🗄️ Capa de Datos (Base de Datos - PostgreSQL)

La persistencia de datos está delegada en **PostgreSQL**. La conexión se realiza a través de un pool gestionado por el driver de Node `pg` (`Pool`), optimizando la reutilización de conexiones TCP.

### Diagrama Entidad-Relación (Base de Datos Real)

```mermaid
erDiagram
    USUARIO ||--o{ VISITA : registra
    USUARIO ||--o{ LOGAUDITORIA : realiza
    GESTOR ||--o{ VISITA : coordina
    GESTOR ||--o{ GRUPO : gestiona
    INSTITUCION ||--o{ GRUPO : pertenece
    GRUPO ||--o{ VISITA : realiza
    CONFIGURACION ||--o{ VISITA : parametriza
    DIAINHABIL ||--o{ VISITA : bloquea

    USUARIO {
        string id PK
        string nombre
        string email UK
        string telefono "nullable"
        string password_hash
        string rol "Admin, Guía"
        boolean activo
    }

    GESTOR {
        string id PK
        string nombre
        string empresa_institucion "nullable"
        string telefono "nullable"
        string email "nullable"
        string localidad "nullable"
        string provincia "nullable"
        string pais "default 'Argentina'"
        string tipo "Institución Educativa, Particular"
    }

    INSTITUCION {
        string id PK
        string nombre
        string telefono "nullable"
        string email "nullable"
        string localidad "nullable"
        string provincia "nullable"
        string pais "default 'Argentina'"
    }

    GRUPO {
        string id PK
        string nombre
        string tipo_visitante "Institución, Particulares"
        string nivel_educativo "Infantes, Primario, Secundario, Terciario, Universitario, Adultos Mayores"
        string tipo_grupo "Menores, Adultos, Mixto"
        string institucion_id FK "nullable"
        string telefono "nullable"
        string email "nullable"
        string localidad "nullable"
        string provincia "nullable"
        string pais "default 'Argentina'"
        string observaciones "nullable"
        string gestor_id FK
    }

    VISITA {
        string id PK
        string gestor_id FK
        string usuario_registro_id FK
        string grupo_id FK
        date fecha
        time hora_inicio
        string tipo "Salón de visitas, Salón + Sala de Comando"
        boolean tiene_cruce_tunel "default false"
        integer cantidad_personas
        string estado "Agendada, Cancelada, Realizada"
        boolean tiene_discapacidad "default false"
        string discapacidad_detalle "nullable"
    }

    DIAINHABIL {
        string id PK
        date fecha UK
        string descripcion
    }

    CONFIGURACION {
        string clave PK "capacidad_maxima, capacidad_por_turno, session_timeout_minutes"
        string valor
    }

    LOGAUDITORIA {
        string id PK
        string usuario_id FK
        string accion
        timestamp fecha_hora "default NOW()"
    }
```

### Reglas de Negocio Implementadas en Consultas del Backend

Todas las validaciones de disponibilidad están centralizadas en `AvailabilityService` (`disponibilidad.service.ts`) y se ejecutan en el siguiente orden antes de aceptar cualquier registro o modificación de visita:

* **Aforo Diario** (`capacidad_maxima`): El backend suma todas las personas agendadas para la fecha (`SELECT SUM(cantidad_personas) ... WHERE fecha = $1 AND estado != 'Cancelada'`). Si agregar el nuevo grupo supera el límite diario configurado en `CONFIGURACION` (por defecto 300 personas), la solicitud es rechazada.

* **Días Inhábiles**: El validador cruza la fecha de la visita contra la tabla `DIAINHABIL`. Si existe un registro coincidente, la visita es rechazada automáticamente, independientemente del aforo disponible.

* **Aforo por Turno** (`capacidad_por_turno`): **Múltiples grupos pueden compartir el mismo turno horario** (misma `fecha` + `hora_inicio`). El backend suma las personas ya agendadas en ese turno específico y verifica que agregar el nuevo grupo no supere el límite por turno configurado en `CONFIGURACION` (por defecto 80 personas/turno). Esta regla reemplaza al antiguo bloqueo de "solapamiento horario" que impedía registrar más de una visita por slot.

* **Baja Lógica**: Los usuarios del sistema no son eliminados físicamente para no romper la integridad referencial de los logs de auditoría; en su lugar, se gestionan a través del campo booleano `activo`.

---

## 5. 🔄 Flujo de una Petición Común: Registro de una Visita

El siguiente diagrama de secuencia detalla cómo viaja la información entre los distintos componentes y capas al registrar una nueva visita guiada (CU-003):

```mermaid
sequenceDiagram
    autonumber
    actor U as Usuario (Guía/Admin)
    participant F as Frontend (React / RegistroVisita.tsx)
    participant M as Middleware (auth.middleware.ts)
    participant R as Router (visita.routes.ts)
    participant C as Controller (visita.controller.ts)
    participant S as Service (visita.service.ts)
    participant Rep as Repository (visita.repository.ts)
    participant DB as Base de Datos (PostgreSQL)
    participant Aud as AuditoriaService

    U->>F: Completa el formulario de visita y presiona "Registrar"
    F->>M: POST /api/visitas (Header: Authorization: Bearer JWT + Body JSON)
    M->>M: verificarToken() y verificarRol()
    alt Token o Rol Inválido
        M-->>F: 401 Unauthorized / 403 Forbidden (JSON Error)
        F-->>U: Muestra alerta con mensaje de error en pantalla
    else Token y Rol Válidos
        M->>R: Permite continuar flujo
        R->>C: postVisita(req, res)
        C->>S: crearVisita(datosVisita)
        
        %% Validar Día Inhábil
        S->>Rep: verificarDiaInhabil(fecha)
        Rep->>DB: SELECT * FROM diainhabil WHERE fecha = $1
        DB-->>Rep: Resultado
        alt Fecha Inhabilitada
            S-->>C: Lanza Error ("Fecha bloqueada por día inhábil")
            C-->>F: 400 Bad Request (JSON Error)
            F-->>U: Muestra alerta "Día Inhabilitado"
        else Fecha Disponible
            
            %% Validar Aforo Máximo
            S->>Rep: obtenerCapacidadMaxima()
            Rep->>DB: SELECT valor FROM configuracion WHERE clave = 'capacidad_maxima'
            DB-->>Rep: Capacidad (ej. 300)
            S->>Rep: calcularAforoAcumulado(fecha)
            Rep->>DB: SELECT SUM(cantidad_personas) FROM visita WHERE fecha = $1 AND estado <> 'Cancelada'
            DB-->>Rep: Total de personas agendadas (ej. 250)
            alt Aforo Excedido (250 + nuevas personas > 300)
                S-->>C: Lanza Error ("El aforo excede el límite del día")
                C-->>F: 400 Bad Request (JSON Error)
                F-->>U: Muestra alerta de "Capacidad Máxima Superada"
            else Aforo Disponible
                
                %% Validar Aforo por Turno (permite múltiples grupos en el mismo slot)
                S->>Rep: obtenerCapacidadPorTurno()
                Rep->>DB: SELECT valor FROM configuracion WHERE clave = 'capacidad_por_turno'
                DB-->>Rep: Capacidad por turno (ej. 80)
                S->>Rep: obtenerPersonasPorTurno(fecha, hora_inicio)
                Rep->>DB: SELECT SUM(cantidad_personas) FROM visita WHERE fecha = $1 AND hora_inicio = $2 AND estado <> 'Cancelada'
                DB-->>Rep: Personas ya agendadas en ese turno (ej. 50)
                alt Aforo del turno excedido (50 + nuevas personas > 80)
                    S-->>C: Lanza Error ("Capacidad del turno superada")
                    C-->>F: 400 Bad Request (JSON Error)
                    F-->>U: Muestra alerta con personas disponibles en ese turno
                else Turno con cupo disponible
                    
                    %% Insertar Visita e Impactar Auditoría
                    S->>Rep: guardarVisita(datos)
                    Rep->>DB: INSERT INTO visita (gestor_id, grupo_id, fecha, hora_inicio, ...) VALUES (...)
                    DB-->>Rep: Objeto Visita Creado (con id)
                    S->>Aud: registrarAccion(usuario_id, 'Registró visita ID: ...')
                    Aud->>DB: INSERT INTO logauditoria (usuario_id, accion, fecha_hora) VALUES (...)
                    DB-->>Aud: OK
                    S-->>C: Retorna datos de la visita registrada
                    C-->>F: 201 Created (JSON con datos de la visita)
                    F-->>U: Muestra diálogo de éxito y redirecciona al Dashboard/Calendario
                end
            end
        end
    end
```

---

## 6. 👥 Múltiples Grupos por Turno

Desde la versión actual, el sistema permite registrar **más de un grupo en el mismo turno horario** (misma `fecha` + `hora_inicio`). Esta funcionalidad reemplaza al antiguo control de solapamiento que bloqueaba cualquier segundo intento de agendado en el mismo slot.

### Modelo de Capacidad por Turno

El sistema ahora maneja **dos niveles de cupo independientes**:

| Nivel | Parámetro en BD | Descripción | Default |
|-------|----------------|-------------|--------|
| Diario | `capacidad_maxima` | Tope total de personas en el día (suma de todos los turnos) | 300 |
| Por Turno | `capacidad_por_turno` | Tope de personas en un mismo slot `fecha + hora_inicio` | 80 |

Ambos parámetros son configurables en tiempo real desde la página **Configuraciones del Sistema**, y cada cambio queda registrado automáticamente en el log de auditoría.

### Comportamiento en el Dashboard

El cronograma operativo del Dashboard fue actualizado para reflejar esta realidad:

* Los slots con **un solo grupo** se muestran como antes.
* Los slots con **múltiples grupos** muestran una cabecera con el badge `N grupos`, las personas ocupadas y el cupo restante del turno.
* Dentro de cada slot, cada grupo se lista en su propia fila con sus acciones individuales (marcar como realizada, ver detalle).
* Si el turno aún tiene cupo disponible, aparece el botón **"Agregar grupo"** directamente en la cabecera del slot.
* Si el cupo del turno se agotó, el botón no se muestra y se indica `lleno`.

### Impacto en Auditoría y Estadísticas

* Cada grupo registrado en un turno genera su **propia fila** en la tabla `VISITA` y su propio registro en `LOGAUDITORIA`.
* Las estadísticas, el Listado de Visitas y el Calendario siguen contabilizando por visita individual, por lo que múltiples grupos se suman automáticamente sin cambios en esas capas.
* El Calendario mensual muestra el **total de grupos** y **total de personas** por día, incluyendo todos los grupos de todos los turnos de ese día.

---

## 7. 🔒 Seguridad y Auditoría

La seguridad es transversal a toda la aplicación y se gestiona bajo los siguientes estándares:

* **Protección contra Inyecciones SQL**: Ninguna consulta concatena strings en backend. Todos los parámetros se introducen de manera aislada usando queries parametrizadas (ej: `$1, $2, ...` en el driver `pg`).
* **Hasheado de Contraseñas**: Las claves de los usuarios jamás se guardan en texto plano en la base de datos. Se utiliza la biblioteca **bcryptjs** en `UsuarioService` para generar y comparar los hashes de forma segura con un factor de costo elevado.
* **Control de Sesiones**: En cada inicio de sesión exitoso, el backend emite un token JWT conteniendo el `id`, `email` y `rol` del usuario. Este token tiene un tiempo de expiración dinámico gestionado a través de la clave `session_timeout_minutes` de la base de datos.
* **Pistas de Auditoría Inmutables**: El backend fuerza el registro automático de logs para cualquier acción que modifique el estado del sistema. Cada controlador invoca a `AuditoriaService` al realizar modificaciones, insertando una fila en la tabla `LOGAUDITORIA` asociando la fecha y hora exacta (`NOW()`), la acción descrita y el ID del usuario responsable.
