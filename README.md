Es una app móvil para tu papá, que es albañil / maestro constructor en República Dominicana, y que hoy maneja todo en un cuaderno (y usa WhatsApp a medias).

La app le sirve para controlar su cuadrilla y los pagos semanales sin complicarse:

HOY (Asistencia): marcar cada día quién trabajó y quién no, y anotar extras (por horas de más o ayudas). También soporta medio día.

Adelantos: registrar los préstamos/adelantos que da durante la semana (muy frecuente).

Pagos (Sábado): calcular automáticamente cuánto le toca a cada trabajador en la semana (días × tarifa + extras − adelantos), y permitir “cerrar” la semana cuando ya pagó.

Trabajadores: guardar el apodo/nombre de cada trabajador y su tarifa diaria, con activos/inactivos porque la gente cambia mucho.

Historial: ver semanas pagadas y el historial por trabajador para evitar pérdidas o confusiones si se pierde el cuaderno.

En resumen: es un “cuaderno digital” ultra simple, pensado para obra, que le ahorra cuentas, reduce errores y le deja todo registrado.

## Regla de Medio Día

La app maneja `Medio día` como una regla especial para evitar doble conteo:

- Si el trabajador está en `NO`, solo se puede usar el preset `Medio día` (los demás extras quedan inhabilitados).
- El monto de `Medio día` se calcula automáticamente como la mitad de la tarifa diaria del trabajador (redondeado al peso).
- En nómina, `Medio día` suma `0.5` días trabajados.
- Si un registro estaba en `Medio día` y se cambia a `SÍ`, se elimina ese extra para que cuente solo `1` día.
- Si se cambia de `SÍ` a `NO`, se limpian los extras de ese día.

Ejemplo: lunes `SÍ` (1 día) + martes `Medio día` (0.5) = `1.5 días` en Pagos.

## Backup automático diario (Supabase)

La app intenta crear 1 backup diario al iniciar.

Configurar en `.env`:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_SUPABASE_BACKUP_BUCKET`
- `EXPO_PUBLIC_BACKUP_PROJECT_ID`

El backup guarda snapshot JSON de tablas clave (`workers`, `attendance`, `advances`, `payroll_weeks`, `payroll_entries`) para poder auditar o restaurar después.
