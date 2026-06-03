# 📋 Auditoría y Mapeo Real de Casos de Uso - Sistema de Visitas

A partir de una auditoría estricta del código fuente del frontend en React y el backend en Node.js/Express, se ha mapeado el estado de los **17 Casos de Uso** definidos en las especificaciones. 

Este análisis identifica qué funciones están completamente operativas, cuáles tienen implementaciones parciales y cuáles son pendientes ("gaps") entre la especificación teórica y el software real.

---

## 🗺️ Mapa de Casos de Uso Actuales (Mermaid)

Este diagrama representa visualmente las interacciones de los actores con las funcionalidades del sistema tal como están codificadas hoy:

```mermaid
leftToRightDirection
actor Guia as "👤 Guía (Operador)"
actor Admin as "👑 Administrador"

rectangle "Sistema de Gestión de Visitas" {
    %% Casos de Uso - Guía
    usecase CU001 as "CU-001: Autenticarse
    (Completo)"
    usecase CU002 as "CU-002: Ver Dashboard
    (Completo)"
    usecase CU003 as "CU-003: Registrar Visita
    (Completo)"
    usecase CU004 as "CU-004: Modificar Visita
    (Completo)"
    usecase CU005 as "CU-005: Cancelar Visita
    (Completo)"
    usecase CU006 as "CU-006: Gestionar Gestores
    (Completo)"
    usecase CU007 as "CU-007: Ver Historial
    (Completo)"
    usecase CU008 as "CU-008: Exportar Confirmación
    (Pendiente)"
    usecase CU009 as "CU-009: Agendar Descanso
    (Pendiente)"

    %% Casos de Uso - Admin
    usecase CU010 as "CU-010: Gestionar Usuarios
    (Completo)"
    usecase CU011 as "CU-011: Configurar Sistema
    (Completo)"
    usecase CU012 as "CU-012: Días Inhábiles
    (Completo)"
    usecase CU013 as "CU-013: Generar Estadísticas
    (Completo)"
    usecase CU014 as "CU-014: Logs de Auditoría
    (Completo)"
    usecase CU015 as "CU-015: Dashboard Admin
    (Completo)"
    usecase CU016 as "CU-016: Exportar Reportes
    (Parcial)"
    usecase CU017 as "CU-017: Configurar Visitas
    (Completo)"
}

%% Relaciones de Herencia de Actores
Admin --|> Guia

%% Relaciones de Guía
Guia --> CU001
Guia --> CU002
Guia --> CU003
Guia --> CU004
Guia --> CU005
Guia --> CU006
Guia --> CU007
Guia -.-> CU008 : "Sin Botón en UI"
Guia -.-> CU009 : "No Implementado"

%% Relaciones de Admin
Admin --> CU010
Admin --> CU011
Admin --> CU012
Admin --> CU013
Admin --> CU014
Admin --> CU015
Admin --> CU016
Admin --> CU017
```

---

## 📊 Matriz de Casos de Uso: Especificado vs. Implementado

> [!IMPORTANT]
> **Definiciones de Estado:**
> * **Completo**: El flujo principal está codificado en frontend y backend y cumple con las reglas.
> * **Parcial**: El backend tiene soporte/endpoints para el caso de uso, pero el frontend no los expone por completo.
> * **Pendiente**: No existe implementación funcional o faltan integraciones clave.

| ID | Caso de Uso | Actor | Estado | Componente Frontend | Ruta Backend / Servicio | Observaciones y Gaps Operativos |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **CU-001** | Autenticarse | Guía, Admin | **Completo** | `Login.tsx`<br>`AuthContext.tsx` | `POST /api/auth/login`<br>`AuthService` | Cuenta con control de expiración de sesión automático en frontend. |
| **CU-002** | Ver Dashboard | Guía, Admin | **Completo** | `Dashboard.tsx`<br>`Calendario.tsx` | `GET /api/visitas?fecha=...`<br>`VisitaService` | Grilla interactiva diaria con estados por colores y detalles de turnos. |
| **CU-003** | Registrar Visita | Guía, Admin | **Completo** | `RegistroVisita.tsx` | `POST /api/visitas`<br>`VisitaService` | **Excelente:** Soporta validaciones cruzadas de aforo, Georef API para provincias/localidades y creación en caliente de gestores e instituciones. |
| **CU-004** | Modificar Visita | Guía, Admin | **Completo** | `EditarVisita.tsx` | `PUT /api/visitas/:id`<br>`VisitaService` | Re-evalúa el aforo y disponibilidad de solapamiento si se altera la fecha/hora. |
| **CU-005** | Cancelar Visita | Guía, Admin | **Completo** | `DetalleVisita.tsx`<br>`ListadoVisitas.tsx` | `PATCH /api/visitas/:id/cancelar` | Solicita motivo de cancelación en ventana emergente e impacta la auditoría. |
| **CU-006** | Gestionar Gestores | Guía, Admin | **Completo** | `Gestores.tsx` | `/api/gestores` (CRUD)<br>`GestorService` | Soporta filtros dinámicos, edición persistente de contactos y validación de campos geográficos. |
| **CU-007** | Ver Historial | Guía, Admin | **Completo** | `ListadoVisitas.tsx` | `GET /api/visitas/historial` | Paginación simple en tabla reactiva con búsqueda rápida. |
| **CU-008** | Exportar Confirmación PDF | Guía, Admin | **Pendiente** | *Ninguno* | *Ninguno* | > [!WARNING]<br>**GAP DETECTADO:** No hay una función para exportar la confirmación individual (comprobante de turno) de una visita en PDF ni en la pantalla de detalle ni de registro. |
| **CU-009** | Agendar Descanso | Guía, Admin | **Pendiente** | *Ninguno* | *Ninguno* | > [!WARNING]<br>**GAP DETECTADO:** Aunque el validador de disponibilidad del backend menciona la frase *"o bloqueado por un descanso"*, no existe la entidad, el CRUD ni el tipo de visita `'Descanso'` en la BD para pausar turnos individuales. |
| **CU-010** | Gestionar Usuarios | Admin | **Completo** | `GestionUsuarios.tsx` | `/api/usuarios` (CRUD)<br>`UsuarioService` | Permite altas, bajas lógicas (activo/inactivo), cambio de contraseña y redefinición de roles. |
| **CU-011** | Configurar Sistema | Admin | **Completo** | `Configuraciones.tsx` | `/api/configuracion` (Clave-Valor) | Implementado con el esquema flexible de clave-valor. |
| **CU-012** | Gestionar Días Inhábiles | Admin | **Completo** | `Configuraciones.tsx` | `/api/dias-inhabiles` (CRUD)<br>`DiaInhabilService` | Valida que no se bloqueen fechas pasadas y actualiza el aforo a inhabilitado en el calendario. |
| **CU-013** | Generar Estadísticas | Admin | **Completo** | `DashboardAdmin.tsx`<br>`StatsBlocks` | `/api/estadisticas/admin`<br>`EstadisticasService` | Muestra KPIs, evolución con bar chart (escalado dinámico de aforo) y rankings. |
| **CU-014** | Ver Logs de Auditoría | Admin | **Completo** | `Auditoria.tsx` | `/api/auditoria`<br>`AuditoriaService` | Visualización inmutable ordenada cronológicamente de todas las operaciones de registro, edición y cancelación. |
| **CU-015** | Dashboard Admin | Admin | **Completo** | `DashboardAdmin.tsx` | `/api/estadisticas/admin` | Vista integral con control de períodos mensuales. |
| **CU-016** | Exportar Reportes | Admin | **Parcial** | `DashboardAdmin.tsx`<br>`ListadoVisitas.tsx` | `/api/estadisticas/exportar`<br>`exportar/diario`<br>`exportar/rango` | > [!NOTE]<br>**GAP DE INTEGRACIÓN:** El backend tiene soporte avanzado de Puppeteer para generar PDFs diarios y de rango personalizado, pero el frontend no expone botones para descargarlos (el de rango solo se consulta en pantalla y el diario no se enlaza). Faltan esos dos botones de descarga en la UI. |
| **CU-017** | Configurar Visitas | Admin | **Completo** | `Configuraciones.tsx` | `ConfiguracionService` | Controla directamente el aforo máximo diario (`capacidad_maxima`) y el timeout de sesión. |

---

## 🔍 Análisis Detallado de Gaps (Brechas de Desarrollo)

### Gap 1: Confirmación de Visita Individual en PDF (CU-008)
* **Requisito Especificado**: Permitir al Guía u operador descargar un comprobante PDF del turno asignado con los datos de contacto y del gestor para enviárselo al grupo.
* **Estado Actual**: Faltante.
* **Recomendación**: Crear un endpoint `GET /api/visitas/:id/exportar` en el backend utilizando el mismo motor de Puppeteer que ya usas para otros reportes. Luego, añadir un botón de "Descargar Comprobante PDF" en la interfaz `DetalleVisita.tsx`.

### Gap 2: Pausas Horarias / Agendar Descanso (CU-009)
* **Requisito Especificado**: Bloquear un slot de horario específico de un día determinado para realizar pausas operativas o almuerzos.
* **Estado Actual**: Faltante.
* **Recomendación**: La forma más limpia de implementar esto sin alterar la base de datos es permitir la creación de una "Visita ficticia" cuyo `tipo_visitante` sea `'Particular'` y su nombre de grupo/observación sea `'Descanso Operativo'`. Así, al ocupar el slot del horario con cantidad de personas = 0, el validador de solapamiento impedirá que se reserve esa hora de forma automática. Faltaría crear un botón directo de "Bloquear Horario (Descanso)" en el dashboard o calendario.

### Gap 3: Descarga de Reportes PDF Diarios y por Rango (CU-016)
* **Requisito Especificado**: Permitir al Administrador descargar un cronograma del día en PDF para entregárselo a los guías de planta, y exportar un PDF consolidado para rangos de fechas personalizados.
* **Estado Actual**: **Parcial**. El backend ya tiene los servicios listos y optimizados (`generarReporteDiarioPDF` y `generarReporteRangoPDF`). Sin embargo:
  1. En el frontend del Calendario o Dashboard Diario no hay ningún botón de "Imprimir Cronograma del Día (PDF)".
  2. En el modal de "Consultar Rango" de `DashboardAdmin.tsx`, el administrador puede ver las estadísticas consolidadas, pero no tiene un botón para disparar la descarga del PDF del período.
* **Recomendación**: Incorporar los botones de llamada de descarga en el frontend apuntando a `api/estadisticas/exportar/diario?fecha=...` y `api/estadisticas/exportar/rango?desde=...&hasta=...` respectivamente.
