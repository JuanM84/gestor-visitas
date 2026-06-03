# 📖 Manual de Usuario - Sistema de Gestión de Visitas

## 🎛️ Túnel Subfluvial "Raúl Uranga - Carlos Sylvestre Begnis"

Este manual de usuario describe en detalle las operaciones, flujos de trabajo y reglas operativas para los roles de **Guía (Operador)** y **Administrador**.

---

## 🔑 1. Acceso y Autenticación (Todos los Roles)

### 🚪 Iniciar Sesión (CU-001)
1. Abra el navegador e ingrese la dirección del sistema.
2. En la pantalla de **Login**, complete su **Email** y **Contraseña**.
3. Presione el botón **Ingresar**.
4. Si las credenciales son válidas, será redirigido al panel principal correspondiente a su rol.

> [!IMPORTANT]
> **Seguridad y Control de Sesión:**
> * El sistema cuenta con un control automático de inactividad (por defecto **15 minutos**).
> * Si el sistema detecta inactividad, cerrará la sesión de forma segura y lo redirigirá al Login para proteger los datos de las reservas.

---

## 👤 2. Guía de Operación Diaria (Perfil Guía)

El Guía es el encargado de interactuar con los coordinadores de los grupos y agendar los turnos diarios.

### 📅 Navegación por el Dashboard Diario
Al ingresar, accederá a la vista del **Calendario / Dashboard de Turnos**:
* **Grilla de Turnos**: Muestra los slots horarios del día seleccionado.
* **Colores de Ocupación**:
  * **Verde (Slots Disponibles)**: Hay capacidad para registrar más delegaciones.
  * **Amarillo (Media Ocupación)**: Cupos parciales ocupados.
  * **Rojo (Alta Ocupación / Lleno)**: Capacidad diaria alcanzada o slot individual ocupado.
  * **Gris / Tachado (Inhabilitado)**: Bloqueado administrativamente por feriado o mantenimiento.
* **Control de Fecha**: Use el selector mensual o las flechas izquierda/derecha para navegar a otros días y visualizar sus turnos correspondientes.

---

### 📝 Registrar una Nueva Visita
Para registrar un nuevo grupo:
1. En el Dashboard, presione el botón **Nueva Visita** (o haga clic en un horario libre).
2. **Paso 1: Asignar Gestor**:
   * Seleccione un **Gestor existente** desde el menú desplegable.
   * Si es un gestor nuevo, seleccione la pestaña *"Nuevo Gestor"* y complete: *Nombre, Empresa/Institución, Teléfono, Email, Localidad y Provincia*.
3. **Paso 2: Datos de la Delegación (Grupo)**:
   * Elija el **Tipo de Visitante**:
     * **Institución (Escuelas/Universidades)**: Seleccione la **Institución Educativa** del catálogo. Si no existe, créela ingresando su nombre, datos de contacto y procedencia. Defina el **Nivel Educativo** (*Infantes, Primario, Secundario, Terciario, Universitario, Adultos Mayores*).
     * **Particulares**: Ingrese el *Nombre del Grupo*, el *Tipo de Grupo* (*Menores, Adultos, Mixto*) y sus datos de contacto de contacto directo.
4. **Paso 3: Detalles de la Visita**:
   * **Tipo de Visita**: Elija entre *'Salón de visitas'* o *'Salón + Sala de Comando'*.
   * **Cruce del Túnel**: Marque la casilla si el grupo realizará el cruce vehicular del túnel (Solo disponible para Instituciones).
   * **Aforo**: Ingrese la *Cantidad de Personas*.
   * **Accesibilidad**: Si algún miembro del grupo requiere accesibilidad, active la casilla *"Requiere accesibilidad"* y detalle el requerimiento (ej: *'2 personas en silla de ruedas'*). **Esto es obligatorio si marca la casilla.**
   * **Observaciones**: Agregue cualquier nota operativa pertinente (ej: *'Llegan retrasados 10 min'*).
5. Presione **Confirmar Registro**.

> [!CAUTION]
> **Validaciones de Aforo y Solapamiento:**
> * El sistema no le permitirá guardar la reserva si la suma de personas del día supera el aforo diario máximo configurado (por defecto **50** o **1600** personas).
> * Tampoco se guardará si ya existe otra visita activa agendada en la misma hora exacta (Solapamiento bloqueado).

---

### ✏️ Modificar una Visita Agendada
1. En el Dashboard, ubique la reserva y presione **Ver Detalles** o **Editar**.
2. Modifique los campos necesarios (Fecha, Hora, Cantidad de Personas, Tipo de Visita, Cruce, Accesibilidad).
3. Presione **Guardar Cambios**.
4. El sistema validará nuevamente el aforo y que no haya solapamiento en el nuevo horario antes de aplicar los cambios.

---

### ❌ Cancelar una Reserva
1. Desde la vista de detalle de la visita, presione el botón **Cancelar Turno** (icono rojo de cancelar).
2. Se abrirá una ventana emergente solicitando confirmar la acción.
3. Ingrese el **Motivo de Cancelación** (opcional) para mantener la trazabilidad.
4. Confirme la acción. La reserva cambiará su estado a **'Cancelada'** de forma permanente y el cupo horario quedará libre inmediatamente para nuevas agendaciones.

---

### 📂 Gestionar Fichas de Gestores
1. En el menú lateral, ingrese a **Gestores**.
2. **Listado**: Muestra una tabla con todos los coordinadores registrados.
3. **Buscar**: Use la barra superior de búsqueda para filtrar por nombre o institución.
4. **Nuevo Gestor**: Presione *"Crear Gestor"* y complete los datos de contacto y ubicación.
5. **Editar**: Presione el icono de lápiz en la fila correspondiente, realice los cambios y guarde.

---

### 🔎 Consultar el Historial de Visitas (En desarrollo)
1. Ingrese a la sección **Historial** (Visitantes e Instituciones) desde el menú.
2. Puede buscar reservas históricas aplicando filtros combinados:
   * *Búsqueda por texto* (Nombre de Institución, Gestor, Grupo).
   * *Filtro por Fecha específica*.
   * *Filtro por Estado* (*Agendada, Realizada, Cancelada*).
3. Presione **Ver Detalles** (icono de ojo) para inspeccionar la información completa de la visita.

---

## 👑 3. Guía de Gestión Administrativa (Perfil Administrador)

El Administrador hereda todas las funciones operativas del Guía y dispone de paneles exclusivos para la gestión y analítica de datos.

### 👥 Administrar Cuentas de Usuarios
1. En el menú lateral, acceda a **Gestión de Usuarios**.
2. **Registrar Usuario**: Complete *Nombre, Email, Contraseña* y seleccione el **Rol** (*Admin, Gestor, Auditor*).
3. **Modificar**: Puede editar el nombre o cambiar la contraseña de un usuario existente.
4. **Activar/Desactivar (Baja lógica)**: Marque o desmarque la casilla *"Activo"*. Un usuario inactivo perderá de inmediato el acceso al sistema sin necesidad de borrar su historial de operaciones.

---

### 🗓️ Gestionar Calendario de Días Inhábiles
Para bloquear fechas completas (feriados, asuetos, jornadas de mantenimiento):
1. Ingrese a la sección **Configuraciones**.
2. En el panel de **Días Inhábiles**, presione **Agregar Día Inhábil**.
3. Seleccione la **Fecha** en el calendario.
4. Ingrese la **Descripción / Motivo** (ej: *'Feriado de Navidad'*, *'Mantenimiento de Servidores'*).
5. Presione **Guardar**.
6. A partir de ese momento, el día se mostrará en color gris y bloqueado en el calendario diario, impidiendo el registro de cualquier visita.
7. Para desbloquear un día, presione el botón de eliminar (icono de basura) al lado del registro.

---

### 📈 Dashboard Administrativo y Analítica Avanzada
Al ingresar al **Dashboard Gerencial**, el Administrador dispone de una suite de análisis visual interactivo:
* **Módulo de KPIs Mensuales**:
  * *Visitas Totales* del mes.
  * *Total de Personas Recibidas*.
  * *Cantidad de Cruces del Túnel* efectuados.
  * *Tasa de Cancelaciones*.
* **Gráfico de Evolución**: Renderiza las fluctuaciones diarias de ocupación. Las barras cambian de color automáticamente según la demanda:
  * **Verde (< 500 personas)**: Baja ocupación.
  * **Amarillo (500 - 1200 personas)**: Media ocupación.
  * **Rojo (≥ 1200 personas)**: Alta ocupación.
* **Top Gestores**: Muestra un ranking ordenado de los coordinadores con más personas registradas.
* **Tipo de Visitante**: Gráfico de distribución porcentual entre delegaciones escolares (`'Institución'`) y particulares.
* **Nivel Educativo**: Desglose detallado de la concurrencia estudiantil.

#### 📅 Consultar Períodos Personalizados
1. En la parte superior derecha, use las flechas junto al mes/año para analizar períodos históricos anteriores.
2. Presione **Consultar Rango** para abrir el panel de fechas personalizado, ingrese la fecha *Desde* y *Hasta* y obtenga métricas consolidadas en tiempo real.

---

### 🧾 Generación de Auditoría
El sistema registra de forma inmutable cada acción realizada para garantizar la transparencia:
1. Acceda a la pestaña **Auditoría**.
2. Visualizará una tabla con: *Usuario, Acción Realizada y Fecha/Hora exacta*.
3. Use la barra de búsqueda superior para rastrear las actividades de un operador específico o buscar palabras clave de acciones (ej: *'Canceló visita'*).

---

### ⚙️ Modificación de Parámetros Globales y Operativos
1. En la pestaña **Configuraciones**, visualice el panel de **Configuración General**.
2. **Capacidad Máxima (Aforo)**: Modifique el límite máximo de personas permitidas por día. 
   * *Rango de validación*: El valor debe ser un número entero entre 1 y 9999.
3. **Timeout de Sesión**: Ajuste los minutos de inactividad permitidos para los operadores.
   * *Rango de validación*: El valor debe ser un número entre 1 y 480 minutos.
4. Presione **Guardar Parámetros**. Las validaciones del sistema de agendamiento se adaptarán de inmediato a los nuevos límites.

---

### 📥 Descarga y Exportación de Reportes

#### 📊 Reporte Consolidado en Excel (XLSX)
1. Ingrese a la sección **Historial** (Visitantes e Instituciones).
2. Presione el botón verde **Exportar Excel**.
3. Se descargará de inmediato un archivo con el formato normalizado (`Reporte_Visitas_Tunel_YYYY-MM-DD.xlsx`) con las columnas estructuradas de visitas y sus relaciones.

#### 📑 Reporte de Actividad Mensual en PDF
1. Ingrese al **Dashboard Gerencial**.
2. Seleccione el mes y año que desea auditar.
3. Presione el botón **Exportar Mes** en la esquina superior derecha.
4. El backend compilará el cronograma del mes y generará un documento en PDF premium con membrete oficial del Túnel Subfluvial, KPIs consolidados y la tabla de concurrencia diaria. La descarga se iniciará automáticamente.

---

## 🛠️ 4. Guía de Resolución de Validaciones Comunes

| Mensaje de Error / Comportamiento | Causa Probable | Acción Sugerida |
| :--- | :--- | :--- |
| **"Aforo diario superado. Capacidad máxima: XX. Ya agendadas: YY."** | La cantidad de personas ingresadas supera el límite de aforo configurado en el sistema para ese día. | Reduzca el tamaño de la delegación en la reserva o solicite al Administrador incrementar el límite diario de aforo si la capacidad de planta lo permite (CU-017). |
| **"El horario de las XX:XX el día YYYY-MM-DD ya se encuentra ocupado..."** | Otra visita activa ya reservó esa hora exacta (bloqueo por solapamiento). | Coordine con el gestor para registrar la visita en el slot de la hora siguiente o anterior que figure en verde en el Calendario. |
| **"La fecha seleccionada es un día inhábil..."** | Se intentó agendar una visita en una fecha inhabilitada (feriado o mantenimiento). | Seleccione un día laborable. Si la fecha fue bloqueada por error, el Administrador debe removerla de la lista de Días Inhábiles (CU-012). |
| **"Debe especificar el detalle de accesibilidad..."** | Se marcó la opción de accesibilidad pero se dejó vacío el cuadro de descripción. | Complete el detalle de accesibilidad (ej: *"El grupo incluye 3 personas con movilidad reducida que requieren rampa"*). |
| **La sesión se cierra inesperadamente.** | Se superó el tiempo máximo de inactividad configurado en el sistema. | Inicie sesión nuevamente. Esto es un comportamiento de seguridad estándar. Si requiere más tiempo, solicite al Administrador elevar los minutos de timeout en Configuraciones. |
