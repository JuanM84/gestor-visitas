# **Especificación de Casos de Uso** 

# **Sistema: Sistema de Gestión de Visitas \- Túnel Subfluvial**

## **1\. Casos de Uso \- Guía**

### **3.1. Autenticarse (CU-001)**

| Actor | Guía, Administrador |
| :---- | :---- |
| **Descripción** | Permite al usuario ingresar al sistema mediante credenciales válidas. |
| **Precondiciones** | El usuario debe estar registrado y activo. |
| **Flujo Principal** | 1\. Ingresa al login. 2\. Ingresa email y contraseña. 3\. Sistema valida credenciales. 4\. Registra en log de auditoría. 5\. Redirige al dashboard correspondiente. |

### 

### **3.2. Ver Dashboard (CU-002)**

| Actor | Guía |
| :---- | :---- |
| **Descripción** | Permite visualizar las visitas agendadas para el día actual y navegar a otras fechas. |
| **Precondiciones** | Usuario autenticado. |
| **Flujo Principal** | 1\. Accede al dashboard. 2\. Sistema muestra visitas del día actual. 3\. Usuario utiliza calendario para cambiar de fecha. 4\. Sistema actualiza la grilla de turnos. |

### **3.3. Registrar Visita (CU-003)**

| Actor | Guía |
| :---- | :---- |
| **Descripción** | Permite agendar una nueva visita para un grupo específico. |
| **Precondiciones** | Fecha seleccionada debe ser hábil y tener slots disponibles. |
| **Flujo Principal** | 1\. Selecciona fecha y hora. 2\. Asigna o crea Gestor. 3\. Ingresa datos del Grupo (nombre, tipo, personas). 4\. Define tipo de visita (Complejo/Comando/Cruce). 5\. Confirma registro. 6\. Sistema valida, guarda y registra auditoría. |

### 

### **3.4. Modificar Visita (CU-004)**

| Actor | Guía |
| :---- | :---- |
| **Descripción** | Permite editar los datos de una visita agendada (fecha, cantidad, estado). |
| **Precondiciones** | Visita existente y no cancelada/finalizada. |
| **Flujo Principal** | 1\. Selecciona 'Editar' en una visita. 2\. Modifica campos. 3\. Guarda cambios. 4\. Sistema re-evalúa disponibilidad si cambió horario. 5\. Actualiza base de datos y log. |

### 

### **3.5. Cancelar Visita (CU-005)**

| Actor | Guía |
| :---- | :---- |
| **Descripción** | Cambia el estado de una visita a Cancelada, liberando el cupo horario. |
| **Flujo Principal** | 1\. Selecciona 'Cancelar' en visita. 2\. Confirma acción (opcional: motivo). 3\. Sistema actualiza estado. 4\. Libera slot horario en el dashboard. |

### 

### **3.6. Gestionar Gestores (CU-006)**

| Actor | Guía |
| :---- | :---- |
| **Descripción** | Operaciones CRUD sobre las entidades o personas que organizan los grupos. |
| **Flujo Principal** | 1\. Accede al módulo Gestores. 2\. Puede listar, crear nuevo, editar o dar de baja un gestor. 3\. Sistema valida datos (email único, campos requeridos) y persiste. |

### 

### **3.7. Ver Historial de Visitas (CU-007)**

| Actor | Guía |
| :---- | :---- |
| **Descripción** | Búsqueda y visualización de visitas pasadas mediante filtros. |
| **Flujo Principal** | 1\. Ingresa a 'Historial'. 2\. Aplica filtros (rango fechas, gestor, estado). 3\. Sistema devuelve listado paginado. |

### 

### **3.8. Exportar Confirmación PDF (CU-008)**

| Actor | Guía |
| :---- | :---- |
| **Descripción** | Genera un comprobante imprimible con los datos de la visita agendada. |
| **Flujo Principal** | 1\. Tras crear visita o desde detalle, presiona 'Exportar PDF'. 2\. Sistema genera documento con logo, datos del grupo, fecha, hora y gestor. 3\. Descarga al dispositivo local. |

### 

### **3.9. Agendar Descanso (CU-009)**

| Actor | Guía |
| :---- | :---- |
| **Descripción** | Bloquea un slot horario para pausas operativas. |
| **Flujo Principal** | 1\. Selecciona 'Agendar Descanso'. 2\. Elige horario disponible. 3\. Sistema crea registro tipo 'Descanso', bloqueando turnos para esa franja. |

## ---

## 

## 

## 

## 

## 

## **2\. Casos de Uso \- Administrador**

*Nota: El Administrador hereda todos los Casos de Uso del Guía (CU-001 a CU-009).*

### **4.1. Gestionar Usuarios (CU-010)**

| Actor | Administrador |
| :---- | :---- |
| **Descripción** | Alta, modificación y baja lógica de usuarios del sistema. |
| **Flujo Principal** | 1\. Accede a módulo Usuarios. 2\. Crea nuevo usuario definiendo email, contraseña inicial y rol (Guía/Admin). 3\. Sistema encripta contraseña y guarda registro. |

### 

### **4.2. Configurar Sistema (CU-011)**

| Actor | Administrador |
| :---- | :---- |
| **Descripción** | Modificación de parámetros globales (ej. variables de entorno del sistema). |
| **Flujo Principal** | 1\. Accede a Configuración General. 2\. Modifica parámetros transversales de la aplicación. 3\. Guarda cambios y registra en auditoría. |

### 

### **4.3. Gestionar Días Inhábiles (CU-012)**

| Actor | Administrador |
| :---- | :---- |
| **Descripción** | Administración de calendario para bloquear días completos por feriados o mantenimiento. |
| **Flujo Principal** | 1\. Accede a Calendario de Días Inhábiles. 2\. Selecciona fecha y asigna motivo. 3\. Sistema bloquea turnos para esa fecha de forma global. |

### 

### **4.4. Generar Estadísticas (CU-013)**

| Actor | Administrador |
| :---- | :---- |
| **Descripción** | Cálculo bajo demanda de métricas no incluidas en el dashboard en vivo. |
| **Flujo Principal** | 1\. Accede a módulo Estadísticas Avanzadas. 2\. Define rango de fechas y métricas a cruzar. 3\. Sistema procesa la consulta y renderiza gráficos. |

### 

### **4.5. Ver Logs de Auditoría (CU-014)**

| Actor | Administrador |
| :---- | :---- |
| **Descripción** | Consulta del historial de acciones del sistema con trazabilidad por usuario. |
| **Flujo Principal** | 1\. Accede a Auditoría. 2\. Aplica filtros (usuario, acción, fecha). 3\. Sistema muestra tabla inmutable con los registros (quién hizo qué y cuándo). |

### 

### **4.6. Visualizar Dashboard Administrativo (CU-015)**

| Actor | Administrador |
| :---- | :---- |
| **Descripción** | Acceso a la vista gerencial con KPIs (ocupación, cancelaciones, tendencias). |
| **Flujo Principal** | 1\. Ingresa al sistema. 2\. Se renderiza la vista 'Dashboard Admin'. 3\. El sistema carga los widgets con los totales mensuales, gráficos de evolución y ranking de gestores. |

### 

### **4.7. Exportar Reportes (CU-016)**

| Actor | Administrador |
| :---- | :---- |
| **Descripción** | Extracción de datos estadísticos o listados en formatos manejables. |
| **Flujo Principal** | 1\. Desde el Dashboard Admin o Historial, selecciona 'Exportar'. 2\. Selecciona formato (CSV/Excel o PDF). 3\. Sistema compila la información y permite la descarga. |

### 

### **4.8. Gestionar Configuración de Visitas (CU-017)**

| Actor | Administrador |
| :---- | :---- |
| **Descripción** | Modificación de parámetros operativos de la tabla Configuracion (Aforo, Tiempos). |
| **Flujo Principal** | 1\. Accede a Parámetros de Visitas. 2\. Ajusta 'capacidad\_maxima' (ej. de 50 a 40 personas) o 'duracion\_visita\_minutos'. 3\. Guarda cambios. 4\. El sistema utiliza estos nuevos valores para futuras validaciones de agendamiento. |

