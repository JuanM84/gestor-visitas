# 🔍 Análisis de Errores e Inconsistencias - Base de Datos

## ⚠️ ERRORES CRÍTICOS

### 1. **ESTADOS_VISITA Inconsistentes** 🔴
**Ubicación**: `src/types/visita.types.ts`

**Problema**:
```typescript
export const ESTADOS_VISITA = ['Agendada', 'Cancelada', 'Realizada'] as const;
```

Pero en el código se usan:
- `'Confirmada'` (controllers/visita.controller.ts)
- `'Completada'` (en comentarios del BD_ESTRUCTURA.md)
- `'Realizada'` (tipos)

**Impacto**: Las validaciones fallarán si se intenta usar estados diferentes

**Solución**: Unificar estados a:
```typescript
export const ESTADOS_VISITA = ['Agendada', 'Confirmada', 'Completada', 'Cancelada'] as const;
```

---

### 2. **TIPOS_VISITA Inconsistentes** 🔴
**Ubicación**: `src/types/visita.types.ts`

**Problema**:
```typescript
export const TIPOS_VISITA = ['Salón de visitas', 'Salón + Sala de Comando'] as const;
```

En BD_ESTRUCTURA.md se menciona:
- `'Túnel'`, `'Actividades'`, `'Exposiciones'`

**Impacto**: Los tipos de visita no son claros. ¿Cuáles son los reales?

**Solución**: Definir claramente:
```typescript
export const TIPOS_VISITA = ['Salón de visitas', 'Salón + Sala de Comando'] as const;
// O usar estos otros si son los correctos:
// ['Túnel', 'Actividades', 'Exposiciones']
```

---

### 3. **Inconsistencia en Aforo Máximo** 🔴
**Ubicaciones**: 
- `src/repositories/disponibilidad.repository.ts` → Retorna 50 como default
- `src/services/configuracion.service.ts` → Retorna '50' como default
- `BD_ESTRUCTURA.md` → Menciona 300 personas por día

**Problema**: ¿El aforo máximo es 50 o 300?

```typescript
// disponibilidad.repository.ts
return 50; // DEFAULT

// configuracion.service.ts
if (clave === 'capacidad_maxima') return '50'; // DEFAULT
```

**Solución**: Definir una constante global:
```typescript
export const CAPACIDAD_MAXIMA_DIARIA = 300;
export const CAPACIDAD_MAXIMA_POR_GRUPO = 50;
```

---

## ⚠️ ERRORES IMPORTANTES

### 4. **Campo 'tipo' en Gestor No Se Inserta** 🟠
**Ubicación**: `migrate.js` vs `services/visita.service.ts`

**Problema**: El migrate.js agrega la columna `tipo` a la tabla Gestor:
```javascript
ALTER TABLE Gestor ADD COLUMN tipo VARCHAR(50) DEFAULT 'Institución Educativa'
```

Pero en visita.service.ts NUNCA se inserta este campo:
```typescript
const resGestor = await client.query(
    `INSERT INTO Gestor (nombre, empresa_institucion, telefono, email, localidad, provincia, pais) 
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    // Falta: tipo
);
```

**Solución**: Agregar el campo tipo al INSERT:
```typescript
INSERT INTO Gestor (nombre, empresa_institucion, telefono, email, localidad, provincia, pais, tipo)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id
```

---

### 5. **LogAuditoria usa LEFT JOIN** 🟠
**Ubicación**: `services/auditoria.service.ts`

**Problema**:
```typescript
LEFT JOIN Usuario u ON l.usuario_id = u.id
```

Esto permite registros huérfanos (sin usuario). Debería ser INNER JOIN:
```typescript
INNER JOIN Usuario u ON l.usuario_id = u.id
```

**Solución**: Cambiar a INNER JOIN o agregar constraint de FK en la BD.

---

### 6. **Falta Validación de Gestor Existente** 🟠
**Ubicación**: `services/visita.service.ts` (línea ~145)

**Problema**: Si se envía un `gestor_id` que no existe, la BD tirará error en el FOREIGN KEY:
```typescript
let gestorId = datos.gestor_id;
// Sin validación de que el gestor existe
```

**Solución**: Validar antes:
```typescript
if (datos.gestor_id) {
    const gestorExiste = await pool.query('SELECT id FROM Gestor WHERE id = $1', [datos.gestor_id]);
    if (!gestorExiste.rows.length) throw new Error('El gestor no existe');
    gestorId = datos.gestor_id;
}
```

---

### 7. **Falta Validación de Institución Existente** 🟠
**Ubicación**: `services/visita.service.ts` (línea ~162)

**Problema**: Similar al anterior, si `institucion_id` no existe:
```typescript
} else if (g.institucion_id) {
    const resInst = await client.query('SELECT nombre FROM Institucion WHERE id = $1', [g.institucion_id]);
    institucionId = g.institucion_id;
    // No valida si existe
}
```

**Solución**: Validar que la institución existe.

---

## ⚠️ INCONSISTENCIAS MODERADAS

### 8. **Timestamps Inconsistentes** 🟡
**Problema**: 
- LogAuditoria usa `created_at` 
- Usuario probablemente tiene `created_at`
- Pero Grupo, Gestor, Institucion, Visita NO mencionan timestamps

**Solución**: Agregar `created_at` y `updated_at` a todas las tablas:
```typescript
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

---

### 9. **Email sin Validación de Formato** 🟡
**Ubicación**: `services/usuario.service.ts` (crearUsuario)

**Problema**: Solo valida duplicados, no formato:
```typescript
const existe = await pool.query('SELECT id FROM Usuario WHERE email = $1', [datos.email]);
if (existe.rows.length > 0) {
    throw new Error('El correo electrónico ya está registrado.');
}
// Pero no valida si es un email válido
```

**Solución**: Validar formato:
```typescript
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(datos.email)) {
    throw new Error('El formato del email es inválido');
}
```

---

### 10. **Campos Nullables Inconsistentes** 🟡
**Ubicación**: Múltiples DTOs en `services/visita.service.ts`

**Problema**: 
- `NuevoGestorDto` tiene campos opcionales: `empresa_institucion?`, `telefono?`, `email?`, etc.
- `GrupoParticularesDto` tiene campos requeridos: `telefono`, `email`, `localidad`, `provincia`
- Pero para `Institución` en GrupoInstitucionDto no valida lo mismo

**Inconsistencia**: Los particulares son más estrictos que las instituciones.

**Solución**: Ser consistente con qué campos son obligatorios.

---

### 11. **Rol 'Guia' no Definido** 🟡
**Ubicación**: `services/usuario.service.ts` (crearUsuario)

```typescript
datos.rol || 'Guia'
```

Pero en la BD_ESTRUCTURA define roles como: Admin, Gestor, Auditor

**Impacto**: Inconsistencia de qué roles existen.

**Solución**: Definir constante de roles:
```typescript
export const ROLES_USUARIO = ['Admin', 'Gestor', 'Auditor'] as const;
```

---

### 12. **Falta Campo usuario_id en Grupo** 🟡
**Problema**: Cuando se crea un Grupo, no se registra quién lo creó.

**Solución**: Agregar `created_by_usuario_id` o similar.

---

## ✅ LISTA DE TAREAS RECOMENDADAS

- [ ] Unificar ESTADOS_VISITA
- [ ] Aclarar TIPOS_VISITA
- [ ] Definir CAPACIDAD_MAXIMA correctamente
- [ ] Insertar campo `tipo` en Gestor
- [ ] Cambiar LEFT JOIN a INNER JOIN en LogAuditoria
- [ ] Validar Gestor existente antes de insertar Visita
- [ ] Validar Institución existente antes de insertar Visita
- [ ] Agregar timestamps (created_at, updated_at) a todas las tablas
- [ ] Validar formato de email en usuario.service.ts
- [ ] Definir y validar roles constantemente
- [ ] Agregar indices en FK (gestor_id, institucion_id, usuario_id, grupo_id)
- [ ] Revisar y estandarizar campos nullables

---

## 📊 RESUMEN

| Severidad | Cantidad | Descripción |
|-----------|----------|-------------|
| 🔴 Crítico | 3 | Estados, tipos de visita, aforo inconsistentes |
| 🟠 Importante | 4 | Campo tipo no se inserta, validaciones faltantes |
| 🟡 Moderado | 5 | Timestamps faltantes, validaciones, roles |
| **TOTAL** | **12** | **Errores/inconsistencias identificadas** |
