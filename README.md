# aiep-educator-skills

Framework docente AIEP: el conjunto canónico de **skills de agente** + **tooling compartido**
que uso para producir material en AIEP (clases, evaluaciones, comunicación, decks, infografías,
reuniones de Vinculación con el Medio).

Nació de dos repos reales — `pro301-taller-de-aplicaciones-para-internet` (el primero) y
`proyecto-01-aiep-geogreen` (la evolución) — donde las mismas skills se fueron copiando a mano de
curso en curso. Este repo las consolida en **una sola fuente de verdad** y agrega lo que hasta
ahora vivía "de palabra" (infografías con GPT Image, decks con sello de Vinculación con el Medio).

No es una colección de skills sueltas: es un **flujo** y un **sistema visual** que sirve múltiples
contextos dentro de AIEP. Ver `docs/framework.md`.

## Principio que ordena todo: la audiencia

Las skills nacieron sesgadas a **alumnos técnicos** (carrera de programación). El aprendizaje real
es que el mismo material cambia de registro según a quién le hablo: a un alumno técnico le hablo
con código y jerga; a la directiva, a otros docentes o al socio comunitario hay que **hablarles
claro, sin tecnicismo**. Por eso la **audiencia es un eje de primera clase** del framework, no un
detalle. Ver `docs/audiencias.md`.

## Estructura

```
skills/            # las skills canónicas (SKILL.md + references/ + agents/openai.yaml para Codex)
  clase-design/        diseñar y redactar clases
  cohort-comms/        mensajes a la cohorte (WhatsApp, etc.)
  evaluacion-design/   evaluaciones y rúbricas
  slides-aiep/         identidad visual de decks AIEP
  infografias-aiep/    (nueva) infografías con GPT Image, estilo AIEP
  reuniones-vcm/       (nueva) decks de Vinculación con el Medio (sello + fusión base institucional)
packages/          # tooling compartido
  slides-system/       tema + componentes PptxGenJS (TS, build + tests)
  pptx-validator/      integridad de .pptx en Windows (.NET)
  pbip-validator/      integridad de proyectos Power BI (.NET)
cli/               # `aiep-skills sync`: instala/actualiza skills y tooling en cada repo de curso
docs/              # framework.md · audiencias.md · estructura-repo.md · estandares.md (convenciones a detalle)
```

## Cómo lo consumen los repos de curso

Cada repo (pro301, pro402, geogreen, futuros) consume este como fuente de verdad vía
`aiep-skills sync` (ver `cli/`): copia/actualiza las skills en su `.agent/skills/` y enlaza
`slides-system`. Un update aquí se propaga con un comando, en vez de copy-paste manual.
