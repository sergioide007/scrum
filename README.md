# Scrum Board — Spec-Driven Development

> **Arquitectura: Cliente puro · Portable · Sin infraestructura · SDD-ready**

---

## Por qué es solo cliente (sin backend)

Este tablero es una aplicación **100 % estática**: un solo archivo HTML que corre directamente en el navegador, sin servidor, sin base de datos, sin despliegue de infraestructura.

La decisión es intencional y se justifica en tres principios arquitectónicos:

### 1. Portabilidad máxima

| Escenario | Resultado |
|---|---|
| Abrir `index.html` localmente | Funciona |
| Servir desde GitHub Pages / S3 | Funciona |
| Integrar como WebView en VS Code (extensión Alpaquitay) | Funciona |
| Distribuir como ZIP a un equipo | Funciona |
| Sin conexión a internet | Funciona |

Un backend añadiría una restricción de topología: el tablero solo funcionaría donde el servidor sea alcanzable. El cliente puro elimina esa restricción por diseño.

### 2. Cero fricción operacional para SDD

En **Spec-Driven Development** el artefacto central es el `SPEC.md` versionado en Git junto al código. El tablero actúa como editor visual de ese spec, no como sistema de registro permanente. Los datos relevantes viajan en dos formas:

- **`localStorage`** → sesión de trabajo local (volátil por diseño, igual que un archivo abierto en el editor)
- **Descarga JSON/SPEC.md** → snapshot persistente que se versiona en el repositorio

Guardar en una BD reemplazaría el flujo `spec → git` por un flujo `spec → BD → git`, añadiendo una fuente de verdad adicional sin beneficio real para el ciclo SDD.

### 3. Administración continua sin estado remoto

El equipo puede hacer `git pull` y tener la herramienta actualizada sin migraciones de esquema, sin seeders, sin gestión de entornos. El estado del board se **descarga como JSON** antes de cada actualización y se **reimporta** si es necesario.

---

## Modelo de datos y flujo de estado

```
┌─────────────────────────────────────────────────────────┐
│                      BROWSER / WEBVIEW                  │
│                                                         │
│   DATA (seed)  ──► initState() ──► STATE (runtime)      │
│   [hardcoded]                      [JS heap]            │
│                                         │               │
│                                    persist()            │
│                                         │               │
│                                    localStorage         │
│                                    "scrumState"         │
│                                         │               │
│                              ┌──────────┴───────────┐   │
│                              │   Export / Download  │   │
│                              │  JSON  │  SPEC.md    │   │
│                              └──────────┬───────────┘   │
└─────────────────────────────────────────┼───────────────┘
                                          │
                                     git commit
                                    (versiona el estado)
```

El ciclo completo es:

1. El equipo trabaja en el tablero → `localStorage` persiste automáticamente.
2. Al cerrar el sprint, se descarga `SPEC-Sprint-N.md` y se hace `git commit`.
3. En la siguiente sesión, `initState()` restaura el estado desde `localStorage` o del seed `DATA`.

---

## Arquitectura interna — Capas actuales

```
┌──────────────────────────────────────────┐
│              UI Layer                    │
│   renderBoard · renderBacklog · Charts   │
│   Modal system · Drag & Drop             │
└───────────────────┬──────────────────────┘
                    │ lee/escribe
┌───────────────────▼──────────────────────┐
│           Domain / State Layer           │
│   STATE: { team, epics, sprints, items } │
│   initState() · persist() · uid()        │
└───────────────────┬──────────────────────┘
                    │
┌───────────────────▼──────────────────────┐
│         Storage Adapter (actual)         │
│         localStorage                     │
│         JSON download (Blob URL)         │
└──────────────────────────────────────────┘
```

---

## Cómo agregar una BD — Puertos y Adaptadores

El **Domain/State Layer** ya actúa como un puerto implícito: todo acceso al estado pasa por `initState()` y `persist()`. Convertir la aplicación a persistencia en servidor requiere implementar un **StoragePort** y enchufar el adaptador correspondiente, sin tocar la lógica de dominio ni la UI.

### Definición del puerto

```js
// port: StoragePort
const StoragePort = {
  async load()  { /* → Promise<StateSnapshot> */ },
  async save(state) { /* Promise<void> */ },
  async exportSpec(sprintId) { /* → Promise<string> */ },
};
```

### Adaptador actual (localStorage)

```js
const LocalStorageAdapter = {
  async load()  { return JSON.parse(localStorage.getItem('scrumState') ?? 'null'); },
  async save(s) { localStorage.setItem('scrumState', JSON.stringify(s)); },
  async exportSpec(sprintId) { /* genera SPEC.md en memoria */ },
};
```

### Adaptador MySQL (ejemplo)

```js
const MySQLAdapter = {
  baseUrl: '/api',                                    // REST thin proxy
  async load()  { return fetch(`${this.baseUrl}/state`).then(r => r.json()); },
  async save(s) { return fetch(`${this.baseUrl}/state`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(s),
    });
  },
  async exportSpec(sprintId) { return fetch(`${this.baseUrl}/spec/${sprintId}`).then(r => r.text()); },
};
```

Schema sugerido (MySQL):

```sql
CREATE TABLE scrum_snapshots (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  team_id     VARCHAR(64) NOT NULL,
  snapshot    JSON        NOT NULL,
  created_at  TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_team (team_id)
);
```

### Adaptador DynamoDB (ejemplo)

```js
const DynamoDBAdapter = {
  async load() {
    const { Item } = await dynamoClient.send(new GetCommand({
      TableName: 'ScrumState',
      Key: { pk: 'STATE', sk: teamId },
    }));
    return Item?.snapshot ?? null;
  },
  async save(state) {
    await dynamoClient.send(new PutCommand({
      TableName: 'ScrumState',
      Item: { pk: 'STATE', sk: teamId, snapshot: state, updatedAt: Date.now() },
    }));
  },
};
```

### Diagrama de sustitución

```
┌───────────────────────────────────────────────────────────┐
│                    Domain / State Layer                   │
│                  (sin cambios, agnóstico)                 │
└──────────────────────────┬────────────────────────────────┘
                           │ StoragePort
          ┌────────────────┼────────────────┐
          │                │                │
  ┌───────▼──────┐ ┌───────▼──────┐ ┌──────▼───────┐
  │ LocalStorage │ │    MySQL     │ │   DynamoDB   │
  │   Adapter    │ │   Adapter    │ │   Adapter    │
  │  (por ahora) │ │   (futuro)   │ │   (futuro)   │
  └──────────────┘ └──────────────┘ └──────────────┘
```

Para activar un adaptador diferente basta cambiar **dos líneas** en el boot:

```js
// antes
const storage = LocalStorageAdapter;

// después (MySQL)
const storage = MySQLAdapter;

// después (DynamoDB)
const storage = DynamoDBAdapter;
```

---

## Por qué el estado en memoria + JSON es suficiente para SDD

En Spec-Driven Development el ciclo de vida de un sprint es:

```
SPEC.md (git)
    │
    ▼
Tablero (editor visual del spec)
    │  trabajo del sprint
    ▼
SPEC-Sprint-N.md (descargado)
    │
    git commit → historia del proyecto
```

El tablero **no es el sistema de registro**: el repositorio Git lo es. La BD persistiría estado que ya vive en Git de forma más expresiva (diff, blame, PR history). Añadir una BD para uso individual o de equipo pequeño reemplazaría una herramienta de colaboración excelente (Git) por una capa de infraestructura adicional sin beneficio neto.

Cuando el equipo crezca y necesite colaboración en tiempo real (múltiples usuarios editando simultáneamente), el adaptador MySQL o DynamoDB se enchufará sin reescribir la lógica de negocio.

---

## Stack técnico

| Componente | Tecnología | Motivo |
|---|---|---|
| Rendering | Vanilla JS DOM | Cero dependencias de framework, máxima portabilidad |
| Charts | Chart.js 4.4 (CDN) | Burndown y velocidad sin servidor de assets propio |
| Fonts | IBM Plex (Google Fonts) | Consistencia con el design system de Alpaquitay |
| Persistencia | localStorage | Cero infraestructura, funciona offline |
| Export | Blob URL + `<a download>` | Descarga SPEC.md sin backend |
| AI bridge | `window.__alpaquitay` | Integración opcional con extensión VS Code Alpaquitay |

---

## Integración con Alpaquitay (VS Code)

El tablero detecta automáticamente si está corriendo dentro de la extensión Alpaquitay:

```js
if (window.__alpaquitay) {
  AQ.connected = true;             // modo integrado
} else {
  AQ._mock(prompt);                // modo simulación offline
}
```

En modo integrado, las acciones AI (estimar, refinar historias, generar SPEC) se delegan al LLM configurado en la extensión. En modo simulación, respuestas predefinidas permiten demostrar el flujo completo sin conexión al modelo.

---

## Estructura del repositorio

```
scrum/
├── index.html    ← aplicación completa (HTML + CSS + JS inline)
└── README.md     ← este documento
```

> La colocación de CSS y JS en `index.html` es deliberada para la fase actual:
> garantiza que el archivo sea autónomo y desplegable como unidad atómica.
> Cuando el tablero se integre como WebView en Alpaquitay, se separará en módulos ESM.

---

## Licencia

MIT — libre uso, modificación y distribución.
