# Agent Instructions

## Objetivo
- Mantener cambios pequenos, seguros y consistentes con la app existente.

## Reglas de implementacion
- No romper estilos o flujos existentes sin necesidad.
- Reutilizar componentes y utilidades antes de crear logica nueva.
- Evitar duplicar codigo si ya hay un patron compartido.

## Safe area y footers fijos
- Si una pantalla tiene footer sticky (boton fijo abajo), usar:
  - `SCREEN_SAFE_AREA_EDGES`
  - `useStickyFooterLayout(...)`
- No hardcodear `paddingBottom` para footers sin considerar `insets.bottom`.

## Calidad minima antes de cerrar
- Ejecutar `npx tsc --noEmit`.
- Revisar `git diff` y confirmar que los cambios son solo los necesarios.

## Estilo de cambios
- Preferir soluciones simples y legibles.
- Mantener nombres consistentes con el resto del proyecto.
- Evitar refactors grandes si no son parte del requerimiento.
