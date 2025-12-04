# BUILD ERRORS CHECKLIST - Claude Code Guardian

**Ngay phan tich:** 2025-11-29
**Tong so loi:** 20 loi TypeScript
**Muc tieu:** Fix tat ca loi de build thanh cong

---

## TONG HOP LOI THEO NHOM

| Nhom | So loi | Do uu tien |
|------|--------|------------|
| 1. Type Mismatch (Modules vs Services) | 3 | Critical |
| 2. Missing Methods (shutdown, getDefaultConfig, getCurrentSession) | 5 | Critical |
| 3. CCGEvent Schema Invalid | 8 | High |
| 4. Constructor Signature Mismatch | 3 | High |
| 5. Logger Config Duplicate | 1 | Low |

---

## NHOM 1: TYPE MISMATCH - InitializedModules vs Modules

### Loi 1.1: hook-command.ts(59,11)
```
error TS2345: Argument of type 'InitializedModules' is not assignable to parameter of type 'Modules'.
Types of property 'memory' are incompatible.
Type 'MemoryModule' is missing the following properties from type 'MemoryService'
```

**File:** `src/bin/hook-command.ts:59`
**Nguyen nhan:**
- `InitializedModules` (trong `src/modules/index.ts`) dung cac `*Module` class
- `Modules` interface (trong `src/hooks/hook-handler.ts`) yeu cau `*Service` class
- HookRouter nhan Modules (Services) nhung truyen vao InitializedModules (Modules)

**Cach sua:**
- [ ] **Task 1.1A:** Thay doi `Modules` interface trong `hook-handler.ts` de dung Module class thay vi Service class

```typescript
// src/hooks/hook-handler.ts - BEFORE
export interface Modules {
  memory: MemoryService;
  guard: GuardService;
  process: ProcessService;
  resource: ResourceService;
  workflow: WorkflowService;
  testing: TestingService;
  documents: DocumentsService;
}

// src/hooks/hook-handler.ts - AFTER
import { MemoryModule } from '../modules/memory/index.js';
import { GuardModule } from '../modules/guard/index.js';
import { ProcessModule } from '../modules/process/index.js';
import { ResourceModule } from '../modules/resource/index.js';
import { WorkflowModule } from '../modules/workflow/index.js';
import { TestingModule } from '../modules/testing/index.js';
import { DocumentsModule } from '../modules/documents/index.js';

export interface Modules {
  memory: MemoryModule;
  guard: GuardModule;
  process: ProcessModule;
  resource: ResourceModule;
  workflow: WorkflowModule;
  testing: TestingModule;
  documents: DocumentsModule;
}
```

---

## NHOM 2: MISSING METHODS (shutdown, getDefaultConfig, getCurrentSession)

### Loi 2.1-2.3: Thieu shutdown() trong modules
```
src/modules/index.ts(338,26): error TS2339: Property 'shutdown' does not exist on type 'ResourceModule'.
src/modules/index.ts(339,26): error TS2339: Property 'shutdown' does not exist on type 'WorkflowModule'.
src/modules/index.ts(341,27): error TS2339: Property 'shutdown' does not exist on type 'DocumentsModule'.
```

**Nguyen nhan:** 3 Module class thieu method `shutdown()`:
- `ResourceModule` (src/modules/resource/index.ts)
- `WorkflowModule` (src/modules/workflow/index.ts)
- `DocumentsModule` (src/modules/documents/index.ts)

**Cach sua:**

- [ ] **Task 2.1:** Them shutdown() vao ResourceModule
```typescript
// src/modules/resource/index.ts - Them method:
async shutdown(): Promise<void> {
  // Cleanup logic if needed
}
```

- [ ] **Task 2.2:** Them shutdown() vao WorkflowModule
```typescript
// src/modules/workflow/index.ts - Them method:
async shutdown(): Promise<void> {
  await this.service.saveTasks();
}
```

- [ ] **Task 2.3:** Them shutdown() vao DocumentsModule
```typescript
// src/modules/documents/index.ts - Them method:
async shutdown(): Promise<void> {
  // Cleanup logic if needed
}
```

### Loi 2.4: Thieu getDefaultConfig() tren ConfigManager
```
src/server.ts(62,28): error TS2339: Property 'getDefaultConfig' does not exist on type 'ConfigManager'.
```

**File:** `src/server.ts:62`
**Nguyen nhan:** ConfigManager khong co method `getDefaultConfig()` nhung server.ts goi no

**Cach sua:**
- [ ] **Task 2.4:** Them getDefaultConfig() vao ConfigManager
```typescript
// src/core/config-manager.ts - Them method:
getDefaultConfig(): CCGConfig {
  return { ...DEFAULT_CONFIG };
}
```

### Loi 2.5-2.6: Thieu getCurrentSession() tren StateManager
```
src/server.ts(374,32): error TS2339: Property 'getCurrentSession' does not exist on type 'StateManager'.
src/server.ts(400,32): error TS2339: Property 'getCurrentSession' does not exist on type 'StateManager'.
```

**File:** `src/server.ts:374, 400`
**Nguyen nhan:** StateManager chi co `getSession()` nhung code goi `getCurrentSession()`

**Cach sua:**
- [ ] **Task 2.5:** Thay `getCurrentSession()` thanh `getSession()` trong server.ts
```typescript
// src/server.ts line 374 & 400 - BEFORE:
const session = stateManager.getCurrentSession();

// AFTER:
const session = stateManager.getSession();
```

---

## NHOM 3: CCGEvent SCHEMA INVALID (8 loi)

### Loi 3.1-3.3: resource.service.ts - 'usage' khong ton tai trong CCGEvent
```
src/modules/resource/resource.service.ts(133,11): error TS2353: Object literal may only specify known properties, and 'usage' does not exist in type 'CCGEvent<unknown>'.
src/modules/resource/resource.service.ts(145,9): error TS2353: ...
src/modules/resource/resource.service.ts(151,9): error TS2353: ...
```

### Loi 3.4-3.5: testing.service.ts - 'results' khong ton tai trong CCGEvent
```
src/modules/testing/testing.service.ts(67,9): error TS2353: Object literal may only specify known properties, and 'results' does not exist in type 'CCGEvent<unknown>'.
src/modules/testing/testing.service.ts(94,9): error TS2353: ...
```

### Loi 3.6-3.9: workflow.service.ts - 'task' khong ton tai trong CCGEvent
```
src/modules/workflow/workflow.service.ts(114,7): error TS2353: Object literal may only specify known properties, and 'task' does not exist in type 'CCGEvent<unknown>'.
src/modules/workflow/workflow.service.ts(138,7): error TS2353: ...
src/modules/workflow/workflow.service.ts(163,7): error TS2353: ...
src/modules/workflow/workflow.service.ts(216,7): error TS2353: ...
```

**Nguyen nhan:**
CCGEvent interface chi co cac field chuan:
```typescript
interface CCGEvent<T = unknown> {
  type: CCGEventType;
  timestamp: Date;
  data?: T;      // <-- Data nen duoc dat o day
  source?: string;
  sessionId?: string;
}
```
Nhung code dang them cac field khong hop le nhu `usage`, `results`, `task` truc tiep vao object

**Cach sua:**

- [ ] **Task 3.1:** Fix resource.service.ts - Dung data field thay vi usage
```typescript
// src/modules/resource/resource.service.ts - BEFORE (line ~131-135):
this.eventBus.emit({
  type: 'resource:checkpoint',
  usage: this.tokenUsage,    // SAI
  timestamp: new Date(),
});

// AFTER:
this.eventBus.emit({
  type: 'resource:checkpoint',
  timestamp: new Date(),
  data: { usage: this.tokenUsage },  // DUNG
  source: 'ResourceService',
});
```

- [ ] **Task 3.2:** Fix resource.service.ts - Lines 143-153 tuong tu
```typescript
// Line 143-147 AFTER:
this.eventBus.emit({
  type: 'resource:critical',
  timestamp: new Date(),
  data: { usage: this.tokenUsage },
  source: 'ResourceService',
});

// Line 148-153 AFTER:
this.eventBus.emit({
  type: 'resource:warning',
  timestamp: new Date(),
  data: { usage: this.tokenUsage },
  source: 'ResourceService',
});
```

- [ ] **Task 3.3:** Fix testing.service.ts - Dung data field thay vi results
```typescript
// src/modules/testing/testing.service.ts - Lines 65-69, 92-96
// BEFORE:
this.eventBus.emit({
  type: results.failed > 0 ? 'test:fail' : 'test:complete',
  results,                    // SAI
  timestamp: new Date(),
});

// AFTER:
this.eventBus.emit({
  type: results.failed > 0 ? 'test:fail' : 'test:complete',
  timestamp: new Date(),
  data: { results },          // DUNG
  source: 'TestingService',
});
```

- [ ] **Task 3.4:** Fix workflow.service.ts - Dung data field thay vi task (4 cho)
```typescript
// src/modules/workflow/workflow.service.ts - Lines 112-116, 136-140, 161-165, 214-218
// BEFORE:
this.eventBus.emit({
  type: 'task:start',
  task,                       // SAI
  timestamp: new Date(),
});

// AFTER:
this.eventBus.emit({
  type: 'task:start',
  timestamp: new Date(),
  data: { task },             // DUNG
  source: 'WorkflowService',
});
```

---

## NHOM 4: CONSTRUCTOR SIGNATURE MISMATCH (3 loi)

### Loi 4.1-4.2: server.ts - ConfigManager va StateManager constructor sai
```
src/server.ts(50,43): error TS2345: Argument of type 'Logger' is not assignable to parameter of type 'string'.
src/server.ts(51,41): error TS2345: Argument of type 'EventBus' is not assignable to parameter of type 'string'.
```

**File:** `src/server.ts:50-51`
**Nguyen nhan:**
- `ConfigManager` constructor: `(projectRoot: string, logger?: Logger, eventBus?: EventBus)`
- `StateManager` constructor: `(projectRoot: string, logger?: Logger, eventBus?: EventBus)`
- Nhung code dang truyen sai thu tu: `new ConfigManager(logger)` va `new StateManager(eventBus, logger)`

**Cach sua:**
- [ ] **Task 4.1:** Fix server.ts constructor calls
```typescript
// src/server.ts - BEFORE (lines 48-51):
const logger = new Logger('info', 'CCG');
const eventBus = new EventBus();
const configManager = new ConfigManager(logger);        // SAI
const stateManager = new StateManager(eventBus, logger); // SAI

// AFTER:
const logger = new Logger('info', 'CCG');
const eventBus = new EventBus();
const configManager = new ConfigManager(process.cwd(), logger, eventBus);
const stateManager = new StateManager(process.cwd(), logger, eventBus);
```

---

## NHOM 5: LOGGER CONFIG DUPLICATE (1 loi)

### Loi 5.1: logger.ts - 'console' specified more than once
```
src/core/logger.ts(74,9): error TS2783: 'console' is specified more than once, so this usage will be overwritten.
```

**File:** `src/core/logger.ts:74`
**Nguyen nhan:** Object spread co duplicate key 'console'
```typescript
this.config = {
  console: true,      // <-- Default value
  colors: true,
  format: 'pretty',
  ...levelOrConfig,   // <-- levelOrConfig co the cung co 'console'
};
```

**Cach sua:**
- [ ] **Task 5.1:** Fix logger.ts - Di chuyen defaults sang sau spread
```typescript
// src/core/logger.ts - BEFORE (lines 73-78):
this.config = {
  console: true,
  colors: true,
  format: 'pretty',
  ...levelOrConfig,
};

// AFTER - Spread truoc, defaults sau de co the override:
this.config = {
  ...levelOrConfig,
  console: levelOrConfig.console ?? true,
  colors: levelOrConfig.colors ?? true,
  format: levelOrConfig.format ?? 'pretty',
};

// HOAC don gian hon - Bo duplicate:
const defaults: LoggerConfig = {
  level: 'info',
  console: true,
  colors: true,
  format: 'pretty',
};
this.config = { ...defaults, ...levelOrConfig };
```

---

## NHOM 6: GUARD SERVICE - boolean | undefined

### Loi 6.1: guard.service.ts(165,7) - Boolean | undefined
```
src/modules/guard/guard.service.ts(165,7): error TS2322: Type 'boolean | undefined' is not assignable to type 'boolean'.
```

**File:** `src/modules/guard/guard.service.ts:165`
**Nguyen nhan:** Return value co the la undefined nhung expected boolean

**Cach sua:**
- [ ] **Task 6.1:** Fix guard.service.ts - Them default value
```typescript
// Line 165 - Them ?? false hoac !! de dam bao boolean
blocked: (this.config.strictMode || options.strict) && blockingIssues.length > 0,
// Hoac:
blocked: Boolean((this.config.strictMode || options.strict) && blockingIssues.length > 0),
```

---

## CHECKLIST THUC HIEN

### Phase 1: Critical Fixes (Loi chặn build)
- [ ] Task 1.1A: Fix Modules interface trong hook-handler.ts
- [ ] Task 2.1: Them shutdown() vao ResourceModule
- [ ] Task 2.2: Them shutdown() vao WorkflowModule
- [ ] Task 2.3: Them shutdown() vao DocumentsModule
- [ ] Task 2.4: Them getDefaultConfig() vao ConfigManager
- [ ] Task 2.5: Fix getCurrentSession -> getSession trong server.ts
- [ ] Task 4.1: Fix constructor calls trong server.ts

### Phase 2: Schema Fixes (CCGEvent)
- [ ] Task 3.1: Fix resource.service.ts line 131-135
- [ ] Task 3.2: Fix resource.service.ts lines 143-153
- [ ] Task 3.3: Fix testing.service.ts lines 65-69, 92-96
- [ ] Task 3.4: Fix workflow.service.ts (4 locations)

### Phase 3: Minor Fixes
- [ ] Task 5.1: Fix logger.ts duplicate console
- [ ] Task 6.1: Fix guard.service.ts boolean | undefined

### Phase 4: Verify Build
- [ ] Run `npx tsc --noEmit` de verify khong con loi
- [ ] Run `npm run build` de build thanh cong
- [ ] Run tests de dam bao khong break functionality

---

## THU TU THUC HIEN DE NGHI

1. **Bat dau tu Phase 1** vi day la cac loi critical chan build
2. **Lam Phase 2** de fix tat ca CCGEvent issues
3. **Lam Phase 3** cho minor fixes
4. **Chay Phase 4** de verify

**Estimated Time:** 30-45 phut de fix tat ca

---

## GHI CHU

- Tat ca fixes deu la code changes, khong thay doi architecture
- Sau khi fix, can chay lai unit tests de dam bao khong co regression
- File `tsconfig.json` hien tai la strict mode nen phai fix tat ca type errors
