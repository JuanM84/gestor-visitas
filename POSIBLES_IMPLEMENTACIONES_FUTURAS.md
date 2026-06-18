# 🔮 Posibles Implementaciones Futuras
## **Sistema de Gestión de Visitas — Túnel Subfluvial**

Este documento detalla tres propuestas de expansión y optimización funcional para el sistema de visitas, basadas en la infraestructura tecnológica actual del software (Node.js/Express y React/TypeScript).

---

### 🏢 1. Gestión Independiente de Catálogo de Instituciones (CRUD)
* **Descripción:** 
  Implementar un módulo exclusivo en la interfaz de usuario para el mantenimiento, consulta e historial de las instituciones educativas registradas en el sistema.
* **Estado Actual y Viabilidad Técnica:** 
  * **Backend:** Ya cuenta con una ruta definida en `app.ts` (`/api/instituciones`) con soporte en `institucion.routes.ts` y métodos listos en `InstitucionController` (`getInstituciones` y `createInstitucion`). El servicio interactúa con el repositorio mapeando la tabla correspondiente.
  * **Frontend:** Actualmente no existe una pantalla exclusiva; la creación de instituciones se realiza de manera dinámica ("en caliente") dentro del formulario de alta de visitas (`RegistroVisita.tsx`).
* **Flujo del Caso de Uso Propuesto:**
  1. El usuario (Guía o Administrador) ingresa al nuevo panel "Instituciones" desde el Sidebar.
  2. El sistema realiza una llamada `GET /api/instituciones` para listar todas las entidades guardadas.
  3. La pantalla muestra una grilla con opciones de búsqueda avanzada por localidad, provincia o nivel educativo, y permite visualizar la cantidad de visitas históricas realizadas por cada una.
  4. Permite registrar o modificar datos de contacto (teléfono, email, provincia, localidad) sin necesidad de iniciar la programación de un turno.

---

### 📧 2. Envío Automático de Comprobante por Email
* **Descripción:** 
  Automatizar el envío del comprobante de reserva en formato PDF al correo electrónico del gestor responsable o de la institución educativa en el momento de registrar, modificar o cancelar un turno.
* **Estado Actual y Viabilidad Técnica:**
  * **Generación de PDF:** El sistema ya cuenta con el motor de Puppeteer configurado y en funcionamiento en `ExportController` (`exportarComprobanteVisita`), el cual compila los datos del grupo y gestor en un archivo PDF estructurado.
  * **Automatización:** Faltaría integrar un servicio de transporte de correo electrónico en el backend (por ejemplo, utilizando `nodemailer` con un servidor SMTP o un servicio de mensajería API).
* **Flujo del Caso de Uso Propuesto:**
  1. Al confirmar el registro de una visita (`POST /api/visitas`) o su modificación, la lógica del backend ejecuta el proceso de guardado en base de datos.
  2. En segundo plano (de manera asíncrona para no retrasar la respuesta al usuario), el backend genera el PDF de confirmación de turno.
  3. El sistema toma el correo del gestor responsable (y/o el institucional si aplica) y despacha el correo adjuntando el comprobante PDF con un asunto personalizado.
  4. En caso de cancelación de la visita (`PATCH /api/visitas/:id/cancelar`), se envía una notificación informando la baja del turno y liberando la agenda del grupo.

---

### 👥 3. Auto-reserva Externa para Gestores (Pre-registro)
* **Descripción:** 
  Habilitar un portal público o formulario externo para que los gestores o instituciones puedan autogestionar y solicitar una reserva, sujeto a la posterior aprobación o confirmación de los guías operativos del túnel.
* **Estado Actual y Viabilidad Técnica:**
  * **Reglas de Negocio:** El validador de disponibilidad del backend (`AvailabilityService.ts`) ya implementa controles automáticos concurrentes de aforo máximo diario, fechas inhábiles y solapamientos horarios.
  * **Control Administrativo:** Requiere la creación de un nuevo estado de visita (por ejemplo, `'Pendiente'`) para permitir la reserva provisional desde el exterior sin impactar la grilla definitiva de turnos activos.
* **Flujo del Caso de Uso Propuesto:**
  1. Un gestor externo accede al portal público de turnos del Túnel Subfluvial.
  2. Completa los datos de contacto, tipo de delegación y cantidad de personas, y selecciona un slot libre de la grilla de disponibilidad.
  3. El sistema valida de manera preliminar que haya aforo diario disponible y que no haya cruces horarios.
  4. Al confirmar, el sistema genera la reserva con estado `'Pendiente'` y notifica al panel administrativo.
  5. Un Guía Operativo revisa la solicitud desde el Dashboard Interno y decide "Aprobar" (cambiando el estado a `'Agendada'` y disparando el envío automático de confirmación) o "Rechazar" (liberando el slot).
