# 📊 Estructura de Base de Datos - Túnel Subfluvial

## Diagrama UML Entidad-Relación

```mermaid
erDiagram
    USUARIO ||--o{ VISITA : registra
    USUARIO ||--o{ LOGAUDITORIA : realiza
    GESTOR ||--o{ VISITA : gestiona
    GESTOR ||--o{ GRUPO : gestiona
    INSTITUCION ||--o{ GRUPO : pertenece
    GRUPO ||--o{ VISITA : participa
    CONFIGURACION ||--o{ VISITA : ""
    DIAINHABIL ||--|| VISITA : anula

    USUARIO {
        string id PK
        string nombre
        string email UK
        string telefono "nullable"
        string password_hash
        string rol "Admin, Guía"
        boolean activo
        timestamp created_at
    }

    GESTOR {
        string id PK
        string nombre
        string empresa_institucion
        string telefono
        string email
        string localidad
        string provincia
        string pais
        string tipo "Institución Educativa, Particular"
    }

    INSTITUCION {
        string id PK
        string nombre
        string telefono
        string email
        string localidad
        string provincia
        string pais
    }

    GRUPO {
        string id PK
        string nombre
        string tipo_visitante "Institución, Particulares"
        string nivel_educativo "Infantes, Primario, Secundario, Terciario, Universitario, Adultos Mayores"
        string tipo_grupo "Menores, Adultos, Mixto"
        string id_institucion FK
        string telefono
        string email
        string localidad
        string provincia
        string pais
        string observaciones
        string id_gestor FK
    }

    VISITA {
        string id PK
        string id_gestor FK
        string id_usuario_registro FK
        string id_grupo FK
        date fecha
        time hora_inicio
        string tipo "Túnel, Actividades, Exposiciones"
        boolean tiene_cruce_tunel
        integer cantidad_personas
        string estado "Agendada, Confirmada, Completada, Cancelada"
        boolean tiene_discapacidad
        string discapacidad_detalle
        timestamp created_at
        timestamp updated_at
    }

    DIAINHABIL {
        string id PK
        date fecha UK
        string descripcion
    }

    CONFIGURACION {
        string id PK
        string clave UK
        string valor
    }

    LOGAUDITORIA {
        string id PK
        string id_usuario FK
        string accion
        timestamp fecha_hora
    }
```

## 📋 Descripción de Tablas

### 1. **USUARIO**
Gestiona los usuarios del sistema
- **Roles**: Admin, Guía
- Autenticación por email/password
- Datos de contacto propios: `email` y `telefono` (editables por el propio usuario desde su perfil)
- Control de activación/desactivación (el Admin puede desactivar y reactivar cuentas)

### 2. **GESTOR**
Personas/instituciones que coordinan visitas
- Datos de contacto y ubicación
- Tipo de gestor (Institución educativa o Particular)

### 3. **INSTITUCION**
Instituciones educativas que visitan el túnel
- Información de contacto
- Ubicación geográfica

### 4. **GRUPO**
Agrupa visitantes bajo un mismo coordinador
- Puede ser una institución o grupo de particulares
- Contiene: nivel educativo, tipo de grupo (menores/adultos/mixto)
- Relación con Gestor e Institución

### 5. **VISITA**
Evento de visita al túnel
- Fecha, hora y tipo de visita
- Cantidad de personas
- Control de discapacidades
- Validación de aforo (cantidad_personas)
- Estados: Agendada, Confirmada, Completada, Cancelada
- Registra al usuario que crea la visita

### 6. **DIAINHABIL**
Fechas cerradas para visitas
- Reutilización del mismo día inhabilita todas las visitas
- Cada fecha se puede registrar una sola vez

### 7. **CONFIGURACION**
Parámetros globales del sistema
- Capacidad máxima (aforo): 300 personas por día
- Otros parámetros configurables

### 8. **LOGAUDITORIA**
Registro de todas las acciones en el sistema
- Quién realizó la acción
- Qué acción realizó
- Cuándo se realizó

## 🔗 Relaciones Principales

| Relación | Tipo | Descripción |
|----------|------|-------------|
| Usuario → Visita | 1:N | Un usuario registra muchas visitas |
| Gestor → Visita | 1:N | Un gestor puede coordinar muchas visitas |
| Gestor → Grupo | 1:N | Un gestor coordina múltiples grupos |
| Institución → Grupo | 1:N | Una institución puede tener múltiples grupos |
| Grupo → Visita | 1:N | Un grupo realiza múltiples visitas |
| Usuario → LogAuditoria | 1:N | Un usuario realiza múltiples acciones |

## ⚙️ Validaciones en BD

1. **Aforo**: Máximo 300 personas por día
2. **Disponibilidad**: No se pueden registrar visitas en días inhabiles
3. **Solapamiento**: No pueden haber dos visitas en la misma hora
4. **Tipos**: Validación de ENUM para tipos de visita, estado, rol, etc.
