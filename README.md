# WordCounter

> **Medición léxica cuantitativa y seguimiento de adquisición de vocabulario en inglés.**  
> Distingue el reconocimiento pasivo de la producción léxica activa con precisión clínica.

**Español** | [Read in English](README.en.md)

[![Versión de Node](https://img.shields.io/badge/node-22%2B%20(LTS)-brightgreen.svg)](https://nodejs.org/)
[![Versión de Astro](https://img.shields.io/badge/astro-7.3-purple.svg)](https://astro.build/)
[![TypeScript](https://img.shields.io/badge/typescript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/tailwind-v4-38bdf8.svg)](https://tailwindcss.com/)
[![Licencia](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

---

## Visión General y Filosofía

En la Adquisición de Segundas Lenguas (SLA), existe una división fundamental entre dos categorías léxicas:

- **Vocabulario Pasivo**: Palabras que se reconocen al leer o escuchar, pero que no se producen de manera espontánea.
- **Vocabulario Activo**: Palabras internalizadas que se pueden recuperar y utilizar espontáneamente al hablar o escribir.

La mayoría de las plataformas de idiomas (Anki, Duolingo, LingQ) se centran casi exclusivamente en el reconocimiento pasivo mediante tarjetas de memoria o lectura asistida. **WordCounter** aborda la otra mitad de la ecuación: medir la **producción lingüística real en inglés**.

WordCounter modela el vocabulario como un sistema cuantificable y auditable:
- **Contabilidad Léxica Activa**: Permite ingresar composiciones originales, ensayos o notas en inglés para extraer lemas únicos, contabilizar la frecuencia de uso y registrar límites temporales (`first_used_at` y `last_used_at`).
- **Validación Morfológica Offline**: Utiliza diccionarios Hunspell en memoria para filtrar erratas y palabras inexistentes antes de la ingestión, sin realizar llamadas a APIs externas.
- **Inventario Pasivo**: Mantiene un catálogo de palabras reconocidas (mediante entrada manual o importación de archivos CSV desde Anki o LingQ).
- **Ratio Lingüístico**: Visualiza de inmediato la tasa de conversión activo/pasivo, mostrando cómo el conocimiento pasivo se transforma en expresión activa.
- **Local-First y Privado**: Funciona con una base de datos SQLite embebida en modo Write-Ahead Logging (WAL). Sin analíticas de terceros, sin dependencias en la nube y sin bloqueos de suscripción. El texto original analizado se descarta inmediatamente tras procesarlo.

---

## Stack Tecnológico

- **Framework**: [Astro 7](https://astro.build/) (Server-Side Rendering con adaptador `@astrojs/node` standalone)
- **Islas Interactivas**: [React 19](https://react.dev/) + [Lucide Icons](https://lucide.dev/)
- **Base de Datos y ORM**: [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) + [Drizzle ORM](https://orm.drizzle.team/)
- **Validación Léxica**: [nspell](https://github.com/wooorm/nspell) + [dictionary-en](https://github.com/wooorm/dictionaries) (Motor morfológico Hunspell offline)
- **Estilos**: [Tailwind CSS v4](https://tailwindcss.com/) (Plugin de Vite con zero-runtime)
- **Testing**: [Vitest](https://vitest.dev/) (Pruebas unitarias, de integración de API y de restricciones de esquema)
- **Contenedores**: [Docker](https://www.docker.com/) y Docker Compose (Entornos de desarrollo y producción)

---

## Comenzando (Instalación Local)

### Prerrequisitos

- **Node.js**: `v22.0.0` o superior (se recomienda versión Active LTS por estabilidad en bindings nativos de SQLite)
- **pnpm**: `v11.0.0` o superior
- Herramientas de compilación C++ (requeridas por los bindings nativos de `better-sqlite3`):
  - Linux: `python3`, `make`, `g++` (`build-essential`)
  - macOS: Xcode Command Line Tools (`xcode-select --install`)
  - Windows: Visual Studio Build Tools o WSL2 (Windows Subsystem for Linux)

### 1. Instalación

Clonar el repositorio e instalar las dependencias:

```bash
git clone https://github.com/JahdielArciniegas/WordCounter.git
cd wordcounter
pnpm install
```

### 2. Servidor de Desarrollo

Iniciar el servidor local con recarga en caliente (HMR):

```bash
pnpm dev
```

Abrir el navegador en `http://localhost:4321`.

### 3. Ejecución de Pruebas

Ejecutar la suite completa con Vitest:

```bash
pnpm test
```

O en modo interactivo/watch:

```bash
pnpm test:watch
```

### 4. Compilación para Producción

Compilar el bundle standalone para producción y ejecutarlo localmente:

```bash
pnpm build
pnpm start
```

---

## Flujos con Docker

WordCounter incluye configuraciones de Docker optimizadas tanto para desarrollo ágil como para despliegue en producción.

### Desarrollo con Recarga en Vivo (`docker-compose.dev.yml`)

Ejecuta la aplicación en un contenedor aislado con montaje del código fuente y recarga automática:

```bash
docker compose -f docker-compose.dev.yml up
```

- **Características**:
  - Los cambios en el código se reflejan de inmediato sin necesidad de reconstruir la imagen.
  - La carpeta `node_modules` queda aislada en el contenedor, evitando conflictos de arquitectura o binarios con el sistema host.
  - La base de datos de desarrollo persiste en un volumen dedicado (`wordcounter-dev-data`).
  - Accesible en `http://localhost:4321`.

Para detener el contenedor de desarrollo:

```bash
docker compose -f docker-compose.dev.yml down
```

### Despliegue en Producción (`docker-compose.yml`)

Compila y despliega la imagen de producción en etapas múltiples (multi-stage build):

```bash
docker compose up -d --build
```

- **Características**:
  - El build multi-stage aísla la cadena de herramientas de compilación (`python3`, `make`, `g++`) de la imagen final de ejecución.
  - Ejecución de `pnpm prune --prod` para minimizar el tamaño final del contenedor.
  - Servidor Node SSR standalone con mapeo al puerto `4321`.
  - La base de datos SQLite persiste en un volumen nombrado (`wordcounter-data`) montado en `/data/wordcounter.db`.

Para ver los logs del servicio en producción:

```bash
docker compose logs -f
```

Para detener el contenedor de producción:

```bash
docker compose down
```

---

## Funcionalidades Principales y Uso

### 1. Ingestión de Texto y Tokenizador Activo
- Acceder al **Dashboard** o a la sección de **Vocabulario Activo** (`/active`).
- Pegar el texto redactado en inglés (ensayo, diario personal, práctica libre).
- **Ingestión con Fechas Históricas**: Permite seleccionar una fecha pasada para registrar textos anteriores. El sistema ajusta o expande con precisión los rangos temporales (`first_used_at` como la fecha más antigua observada y `last_used_at` como la más reciente).
- El motor tokeniza el texto, valida la morfología en inglés con Hunspell y actualiza atómicamente las frecuencias en SQLite.

### 2. Catálogo de Vocabulario Pasivo
- Acceder a **Vocabulario Pasivo** (`/passive`).
- Añadir palabras individuales o una lista de términos separados por comas o saltos de línea.
- Cargar archivos CSV exportados desde Anki o plataformas de idiomas.
- Todas las importaciones se ejecutan de manera idempotente (`INSERT OR IGNORE`) para evitar duplicados.

### 3. Panel Analítico y Métricas
- Visualizar el total de palabras activas únicas frente a las pasivas.
- Monitorear el **Ratio Léxico Activo / Pasivo**.
- Ordenar el vocabulario activo por:
  - **Frecuencia**: Palabras más producidas.
  - **Reciente**: Palabras utilizadas más recientemente (`last_used_at`).
  - **1° uso**: Palabras incorporadas más antiguamente (`first_used_at`).
  - **Alfabético**: Índice alfabético.

---

## Estructura del Proyecto

```text
wordcounter/
├── src/
│   ├── components/         # Islas interactivas en React 19
│   │   ├── ActiveWordsManager.tsx
│   │   └── PassiveWordsManager.tsx
│   ├── db/                 # Conexión SQLite y esquema con Drizzle ORM
│   │   ├── index.ts        # Conexión e inicialización automática de tablas
│   │   └── schema.ts       # Esquema de tablas (active_words, passive_words)
│   ├── layouts/            # Plantillas y layouts en Astro
│   │   └── Layout.astro
│   ├── pages/              # Rutas SSR y endpoints REST de la API
│   │   ├── api/
│   │   │   ├── active/     # /api/active/words, /api/active/analyze-text
│   │   │   └── passive/    # /api/passive/words, /api/passive/import
│   │   ├── active.astro    # Vista de vocabulario activo
│   │   ├── index.astro     # Dashboard principal y métricas de ratio
│   │   └── passive.astro   # Vista de vocabulario pasivo
│   ├── services/           # Lógica de dominio del negocio
│   │   ├── active.service.ts
│   │   ├── passive.service.ts
│   │   ├── tokenizer.ts
│   │   └── lexical-validator.service.ts
│   └── styles/             # Estilos globales y configuración de Tailwind CSS v4
├── tests/                  # Suite de pruebas automatizadas con Vitest
│   ├── api.test.ts         # Pruebas de contrato e integración de la API REST
│   ├── db.test.ts          # Pruebas de esquema y restricciones de base de datos
│   ├── services.test.ts    # Pruebas unitarias de servicios de dominio y tokenizador
│   └── smoke.test.ts       # Pruebas de humo de enrutamiento
├── docker-compose.yml      # Orquestación de producción
├── docker-compose.dev.yml  # Orquestación de desarrollo con recarga en vivo
├── Dockerfile              # Construcción multi-stage de producción
├── Dockerfile.dev          # Construcción del contenedor de desarrollo
├── astro.config.mjs        # Configuración de Astro con adaptador Node SSR
└── package.json            # Dependencias y scripts del proyecto
```

---

## Variables de Entorno

| Variable | Por Defecto | Descripción |
| :--- | :--- | :--- |
| `NODE_ENV` | `development` | Entorno de ejecución (`development` o `production`). |
| `HOST` | `0.0.0.0` | Interfaz de red en la que escucha el servidor. |
| `PORT` | `4321` | Puerto HTTP para la aplicación Astro. |
| `DB_PATH` | `wordcounter.db` | Ruta al archivo de base de datos SQLite (ej. `/data/wordcounter.db`). |

---

## Licencia

Este proyecto está bajo la Licencia MIT.
