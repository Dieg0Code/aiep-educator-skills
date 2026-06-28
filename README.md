# aiep-educator-skills

> Soy Diego Obando, analista programador titulado y docente en AIEP (Osorno, Chile). Este framework
> nació de mi propia experiencia haciendo clases: siendo programador, terminé construyendo la
> infraestructura que necesitaba para enseñar. Lo que empezó como un puñado de scripts y plantillas
> para preparar mis cursos —diseñar clases, armar presentaciones con la identidad de la institución,
> generar material de apoyo— se fue volviendo un sistema reutilizable y consistente. Lo formalicé
> aquí para tener una sola fuente de verdad y, de paso, para que cualquier docente o agente de IA
> pueda planificar con el mismo estándar.

**aiep-educator-skills** es un framework docente: un conjunto de **skills de agente** + **tooling
compartido** para producir material de AIEP (clases, evaluaciones, comunicación, decks, infografías,
reuniones de Vinculación con el Medio) de forma consistente y desde una única fuente de verdad.

No es una colección de skills sueltas: es un **flujo** y un **sistema visual** que sirve múltiples
contextos. Lo que cambia entre tareas son tres ejes —**audiencia · formato · flujo**— sobre un
patrón de repo compartido. El detalle del modelo está en [`docs/framework.md`](docs/framework.md).

## Instalación

Requiere Node 18+. Para los validadores de integridad, .NET 9.

```bash
git clone <este-repo> aiep-educator-skills
cd aiep-educator-skills
npm install      # instala workspaces (slides-system + CLI) y enlaza el binario aiep-skills
npm run build    # compila el sistema de slides y el CLI
```

## Uso (CLI `aiep-skills`)

```bash
# Andamiar un repo de curso/proyecto nuevo (estructura + onboarding + skills/tooling):
npx aiep-skills init  <ruta-del-repo>              # módulo de clases
npx aiep-skills init  <ruta-del-repo> --talleres   # proyecto (con reuniones VcM)

# Instalar/actualizar las skills y el tooling en un repo existente:
npx aiep-skills sync  <ruta-del-repo>
npx aiep-skills sync  <ruta-del-repo> --dry-run    # ver qué haría, sin escribir
npx aiep-skills sync  <ruta-del-repo> --force      # sobrescribir ediciones locales
```

- **`init`** crea el esqueleto (`docs/ cronograma/ clases|talleres/`), un `README.md` para el
  docente y un `AGENTS.md`/`CLAUDE.md` que orienta a cualquier agente, y luego sincroniza.
- **`sync`** copia las skills a `.agent/skills/` y el tooling a `tools/`, con un **lock file**
  (`aiep-skills-lock.json`) que versiona lo instalado. Protege ediciones locales: si un archivo del
  destino fue modificado a mano, no lo pisa salvo `--force`.

## Estructura

```
skills/            las skills canónicas (SKILL.md + references/ + agents/openai.yaml)
  clase-design         diseñar y redactar clases/talleres
  slides-aiep          identidad visual de los decks AIEP
  infografias-aiep     infografías con GPT Image, estilo AIEP (sin API)
  evaluacion-design    evaluaciones y rúbricas
  cohort-comms         mensajes a la cohorte (WhatsApp)
  reuniones-vcm        decks de Vinculación con el Medio (sello + registro institucional)
packages/
  slides-system        tema + componentes PptxGenJS (TypeScript, con tests)
  pptx-validator       integridad de .pptx en Windows (.NET)
  pbip-validator       integridad de proyectos Power BI (.NET)
cli/               el CLI aiep-skills (TypeScript)
docs/              framework · audiencias · estructura-repo · estandares
```

## La audiencia como eje de primera clase

Las skills nacieron sesgadas a alumnos técnicos (carrera de programación). El aprendizaje real es
que el mismo material cambia de registro según a quién le habla: a un alumno técnico se le habla con
código y jerga; a la directiva, a otros docentes o al socio comunitario hay que hablarles claro, sin
tecnicismo. Por eso la audiencia es un eje explícito del framework, documentado en
[`docs/audiencias.md`](docs/audiencias.md).

## Cómo lo consumen los repos de curso

Este repo es la fuente de verdad. Cada repo de curso o proyecto lo consume con `aiep-skills sync`:
un arreglo en un componente o una mejora en una skill se propaga con un comando, en vez del
copy-paste manual que antes mantenía varias copias idénticas a mano.

## Calidad

`npm run test:all` corre los gates de ambos workspaces: typecheck, build, tests (slides-system y
CLI) y revisión ortográfica (cspell). Los decks generados se validan además con `pptx-validator`
(.NET) para garantizar que PowerPoint los abra sin reparar.
