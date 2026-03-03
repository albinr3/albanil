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

## Tabs inferiores y modo inmersivo
- La barra de tabs (`app/(tabs)/_layout.tsx`) ya está ajustada para Android con modo inmersivo (se oculta la barra de navegación del sistema con `expo-navigation-bar`).
- Mantener la altura base del tab bar (`height: 72`) y su `paddingTop`/`paddingBottom` para evitar que el contenido (iconos y labels) quede pegado al borde inferior o se superponga con gestos/botones del sistema.
- No volver a usar márgenes negativos agresivos en `tabBarIconStyle` o `tabBarLabelStyle` que acerquen demasiado el contenido al borde inferior.

## Calidad minima antes de cerrar
- Ejecutar `npx tsc --noEmit`.
- Revisar `git diff` y confirmar que los cambios son solo los necesarios.

## Estilo de cambios
- Preferir soluciones simples y legibles.
- Mantener nombres consistentes con el resto del proyecto.
- Evitar refactors grandes si no son parte del requerimiento.
