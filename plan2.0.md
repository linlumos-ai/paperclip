# Paperclip 项目代码库深度分析报告 v2.0

> 生成时间: 2026-05-03
> 分析范围: 启动流程、依赖管理、配置系统、性能瓶颈、部署问题
> 分支: feature/artifacts-workproducts

---

## 一、启动问题分析

### 1.1 dev-runner.ts 启动逻辑

**文件位置**: `scripts/dev-runner.ts`

#### 启动模式
- **watch 模式**: 子进程退出后不自动重启，适合持续监控
- **dev 模式**: 监听文件变化，自动重启子进程，包含健康检查

#### 启动流程
1. **Worktree 环境检查** (`bootstrapDevRunnerWorktreeEnv`)
   - 验证 `.paperclip/worktree-env.json` 是否存在
   - 缺失时直接退出，阻止启动
   - 这保护了配置优先级，防止在错误的工作树中运行

2. **服务去重检测** (`findAdoptableLocalService`)
   - 检查是否已有相同服务实例在运行
   - 匹配条件: `serviceKey` + `envFingerprint` + `port`
   - 发现已运行实例则直接退出（`process.exit(0)`）
   - **问题**: 若端口被其他进程占用，仍会通过 `findAdoptableLocalService` 阻止多实例

3. **迁移预检查** (`maybePreflightMigrations`)
   - dev 模式: 默认 `autoApply=true`
   - watch 模式: 交互式询问（TTY 检测）
   - 迁移失败时 watch 模式直接退出，dev 模式可继续

4. **插件 SDK 构建** (`buildPluginSdk`)
   - 每次启动前执行 `pnpm --filter @paperclipai/plugin-sdk build`
   - **性能瓶颈**: 包含 TypeScript 编译，无增量机制

#### 文件监听 (dev 模式)
- **扫描间隔**: 1500ms
- **自动重启轮询**: 2500ms
- **监听目录**:
  ```
  cli, scripts, server,
  packages/adapter-utils, packages/adapters,
  packages/db, packages/plugins/sdk, packages/shared
  ```
- **忽略**: `.git`, `.turbo`, `.vite`, `coverage`, `dist`, `node_modules`, `ui-dist`
- **问题**: 缺少对 `.env` 文件变化的自动重载处理

#### 关键环境变量
```typescript
PAPERCLIP_UI_DEV_MIDDLEWARE: "true"  // 启用 Vite 开发中间件
PAPERCLIP_DEV_SERVER_STATUS_FILE    // dev 模式下写入状态文件
PAPERCLIP_MIGRATION_AUTO_APPLY      // 自动应用迁移
PAPERCLIP_BIND / PAPERCLIP_BIND_HOST // 绑定模式
PAPERCLIP_DEPLOYMENT_MODE           // local_trusted / authenticated
```

### 1.2 server/src/index.ts 初始化流程

**文件位置**: `server/src/index.ts`

#### 初始化阶段

```
loadConfig() → 配置加载
  ↓
数据库初始化
  ├── 外部 PostgreSQL: 直接连接 + 迁移检查
  └── 嵌入式 PostgreSQL: 启动内置数据库
  ↓
认证模式初始化
  ├── local_trusted: 确保本地 board 用户
  └── authenticated: 初始化 Better Auth
  ↓
服务初始化
  ├── Storage Service
  ├── Feedback Service
  ├── Plugin Worker Manager
  └── 心跳调度器（可选）
  ↓
HTTP 服务器启动
  ├── WebSocket 服务器
  └── 等待外部适配器加载
```

#### 嵌入式 PostgreSQL 启动逻辑

```typescript
// 三个场景的处理
1. 已有 pid 文件且进程存活 → 复用现有实例
2. 端口可达 → 复用现有实例
3. 均不满足 → 启动新的嵌入式 PostgreSQL
```

**关键代码路径**:
```typescript
// server/src/index.ts:376-445
const detectedPort = await detectPort(configuredPort);
port = detectedPort;  // 自动使用空闲端口

embeddedPostgres = new EmbeddedPostgres({
  databaseDir: dataDir,
  user: "paperclip",
  password: "paperclip",
  port,
  persistent: true,
  initdbFlags: ["--encoding=UTF8", "--locale=C", "--lc-messages=C"],
});

// 首次运行自动应用迁移
const shouldAutoApplyFirstRunMigrations = !clusterAlreadyInitialized || dbStatus === "created";
migrationSummary = await ensureMigrations(embeddedConnectionString, "Embedded PostgreSQL", {
  autoApply: shouldAutoApplyFirstRunMigrations,
});
```

#### 数据库迁移机制

- **检查逻辑** (`inspectMigrations`):
  1. 扫描已应用迁移 (`_paperclip_migrations`)
  2. 对比 `migrations/` 目录
  3. 返回 `upToDate` | `needsMigrations`

- **修复机制** (`reconcilePendingMigrationHistory`):
  - 自动修复漂移的迁移历史
  - 检测已应用但未记录的情况

- **启动时心跳恢复** (server/src/index.ts:672-783):
  - 收割孤儿运行进程
  - 促进等待中的队列运行
  - 协调滞留的分配问题
  - 检查图表活跃性
  - 扫描静默活跃运行
  - 协调生产力评审

### 1.3 数据库连接问题

**问题 1: embedded-postgres 端口检测**
```typescript
// server/src/index.ts:376
const detectedPort = await detectPort(configuredPort);
```
- 配置端口: 54329（默认）
- 若被占用，动态选择空闲端口
- 但 `.env` 和 `.paperclip/config.json` 无法感知此变化

**问题 2: 数据库 URL 配置优先级**
```typescript
// server/src/config.ts:300
databaseUrl: process.env.DATABASE_URL ?? fileDbUrl,
```
- 优先级: 环境变量 > 配置文件
- 外部 PostgreSQL 使用 `DATABASE_URL`
- 嵌入式使用自动生成的连接字符串

---

## 二、依赖问题分析

### 2.1 package.json 与 pnpm-lock.yaml

#### 根 package.json
```json
{
  "engines": { "node": ">=20" },
  "packageManager": "pnpm@9.15.4",
  "pnpm": {
    "patchedDependencies": {
      "embedded-postgres@18.1.0-beta.16": "patches/embedded-postgres@18.1.0-beta.16.patch"
    },
    "overrides": {
      "rollup": ">=4.59.0"
    }
  }
}
```

#### 关键依赖版本

| 包名 | 根依赖 | server 依赖 | 说明 |
|------|--------|------------|------|
| embedded-postgres | - | ^18.1.0-beta.16 | beta 版本，存在 patch |
| better-auth | - | 1.4.18 | 认证库 |
| lexical | 0.35.0 | - | 富文本编辑器 |
| tsx | ^4.19.2 | ^4.19.2 | 开发运行器 |
| express | - | ^5.1.0 | API 服务器 |
| drizzle-orm | - | ^0.38.4 | ORM |

#### 问题 2.1.1: 版本不一致

- `@embedded-postgres/darwin-arm64` 在根依赖指定 `18.1.0-beta.15`
- `embedded-postgres` 在 server 依赖指定 `^18.1.0-beta.16`
- **潜在风险**: 版本不匹配可能导致运行时错误

### 2.2 embedded-postgres 集成状态

#### 补丁文件
**位置**: `patches/embedded-postgres@18.1.0-beta.16.patch`

```diff
- const LC_MESSAGES_LOCALE = 'en_US.UTF-8';
+ const LC_MESSAGES_LOCALE = 'C'

// 修改 initdb 和 postgres 进程的 env 传递方式
- env: { LC_MESSAGES: LC_MESSAGES_LOCALE }
+ env: Object.assign({}, globalThis.process.env, { LC_MESSAGES: LC_MESSAGES_LOCALE })
```

**问题**:
- 动态 `process.env` 继承导致 locale 设置不稳定
- beta 版本可能在未来版本中修复，但补丁需要同步更新

#### 平台特定二进制

```json
// package.json
"@embedded-postgres/darwin-arm64": "18.1.0-beta.15"
```

**问题**: 只支持 macOS ARM64，其他平台需手动配置

### 2.3 Corepack/pnpm 兼容性问题

#### 检测方式
```typescript
// dev-runner.ts
const pnpmBin = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
```

**问题**:
- 假设 `pnpm` 在 PATH 中
- 无 corepack 启用检查
- 无版本验证（packageManager 指定 9.15.4）

#### 建议改进
```bash
# 添加 corepack 支持检查
corepack prepare pnpm@9.15.4 --activate
# 或使用 packageManager 字段自动启用
```

---

## 三、配置问题分析

### 3.1 .env 文件配置

**位置**: `.env`

```env
# DATABASE_URL=postgres://paperclip:paperclip@localhost:5432/paperclip
# 注释原因: 使用 embedded-postgres（自动启动本地数据库）
PORT=3100
SERVE_UI=true
BETTER_AUTH_SECRET=paperclip-dev-secret
```

**问题**:
1. 缺少 `PAPERCLIP_MIGRATION_AUTO_APPLY`（开发环境建议设为 true）
2. 缺少 `PAPERCLIP_UI_DEV_MIDDLEWARE`（开发环境建议设为 true）
3. `BETTER_AUTH_SECRET` 硬编码，不安全

### 3.2 .paperclip/config.json

**问题**: 当前不存在

**默认配置行为**:
- `config.ts` 会在不存在时使用硬编码默认值
- 数据库模式: `embedded-postgres`（无 DATABASE_URL 时）
- 默认端口: 3100
- 默认主机: `127.0.0.1`
- 备份: 启用，默认 60 分钟间隔，7 天保留

### 3.3 数据库配置优先级

```typescript
// server/src/config.ts:298-304
databaseUrl: process.env.DATABASE_URL ?? fileDbUrl,
databaseMigrationUrl: process.env.DATABASE_MIGRATION_URL,
```

```typescript
// server/src/index.ts:273-281
if (config.databaseUrl) {
  // 使用外部 PostgreSQL
  migrationSummary = await ensureMigrations(migrationUrl, "PostgreSQL");
} else {
  // 使用嵌入式 PostgreSQL
}
```

**优先级链**:
```
DATABASE_URL 环境变量 > .paperclip/config.json > 内嵌默认值
```

---

## 四、性能瓶颈分析

### 4.1 JS Bundle 大小分析

#### UI Bundle 分析 (ui/dist/assets/)

| Bundle | 大小 | 说明 |
|--------|------|------|
| index-CsveugUR.js | **3.4 MB** | 主入口文件，巨大 |
| mermaid.core-D9bgrPXs.js | 486 KB | Mermaid 图表库 |
| treemap-GDKQZRPO.js | 443 KB | Treemap 可视化 |
| cytoscape.esm-jbPEKk2Y.js | 431 KB | 网络图库 |
| katex-B95LWT_Q.js | 252 KB | LaTeX 渲染 |
| architectureDiagram.js | 148 KB | 架构图组件 |

**总资源文件数**: 约 200+ 个 JS 文件

**问题**:
1. 主 bundle 3.4MB，严重影响首屏加载
2. 大量图表库未做代码分割
3. Mermaid、Cytoscape 等库未按需加载

### 4.2 代码分割现状

**vite.config.ts**:
```typescript
build: {
  minify: "esbuild",  // 仅压缩，未配置分割策略
},
```

**问题**:
- 无动态导入分析
- 所有路由打包到主 bundle
- 图表库未做 vendor chunk

**建议配置**:
```typescript
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'vendor-react': ['react', 'react-dom'],
        'vendor-lexical': ['lexical'],
        'vendor-diagrams': ['mermaid', 'cytoscape'],
      }
    }
  }
}
```

### 4.3 API 请求优化机会

#### 服务启动时触发的后台任务

```typescript
// server/src/index.ts:659-782
// 启动时执行的协调任务（全部是 fire-and-forget）
reconcilePersistedRuntimeServicesOnStartup()
heartbeat.reapOrphanedRuns()
heartbeat.promoteDueScheduledRetries()
heartbeat.resumeQueuedRuns()
heartbeat.reconcileStrandedAssignedIssues()
heartbeat.reconcileIssueGraphLiveness()
heartbeat.scanSilentActiveRuns()
heartbeat.reconcileProductivityReviews()
```

**问题**:
- 首次启动时大量数据库查询
- 无并发优化（串行执行）
- 可能导致启动延迟

#### 心跳调度器间隔

```typescript
heartbeatSchedulerIntervalMs: Math.max(10000, Number(process.env.HEARTBEAT_SCHEDULER_INTERVAL_MS) || 30000)
// 默认 30 秒，最小 10 秒
```

### 4.4 内存与资源占用

#### WebSocket 服务器

```typescript
// server/src/index.ts:654
setupLiveEventsWebSocketServer(server, db, { ... })
```

**潜在问题**:
- 无连接数限制
- 无消息大小限制
- 无心跳检测（虽然有 heartbeat 服务，但 ws 层独立）

#### 嵌入式 PostgreSQL

```typescript
// server/src/index.ts:382-420
embeddedPostgres = new EmbeddedPostgres({
  databaseDir: dataDir,
  user: "paperclip",
  password: "paperclip",
  port,
  persistent: true,  // 持久化数据
  initdbFlags: ["--encoding=UTF8", "--locale=C", "--lc-messages=C"],
});
```

**内存占用**:
- 默认 PostgreSQL 配置可能过大
- 无连接池限制设置

---

## 五、部署问题分析

### 5.1 服务端口冲突

#### 端口分配表

| 端口 | 用途 | 默认值 |
|------|------|--------|
| 3100 | API 服务器 | `PORT` 环境变量 |
| 54329 | 嵌入式 PostgreSQL | `EMBEDDED_POSTGRES_PORT` |
| 5173 | UI 开发服务器 | vite.config.ts |
| 3106 | UI 开发代理目标 | vite.config.ts |
| 6006 | Storybook | package.json scripts |

#### 冲突处理

```typescript
// server/src/index.ts:473
const requestedListenPort = config.port;
const listenPort = await detectPort(requestedListenPort);

if (listenPort !== requestedListenPort) {
  logger.warn(`Requested port is busy; using next free port (requestedPort=${requestedListenPort}, selectedPort=${listenPort})`);
}
```

**问题**:
- 成功启动但端口变化，应用逻辑可能依赖固定端口
- `.env` 和配置无法自动更新

### 5.2 资源管理

#### 开发服务注册

```typescript
// dev-runner.ts:353-379
async function updateDevServiceRecord(extra?: Record<string, unknown>) {
  await writeLocalServiceRegistryRecord({
    version: 1,
    serviceKey: devService.serviceKey,
    // ...完整服务记录
    metadata: {
      repoRoot,
      mode,
      childPid: child?.pid ?? null,
      url: `http://127.0.0.1:${serverPort}`,
    },
  });
}
```

**问题**:
- 退出时依赖 SIGINT/SIGTERM 信号清理
- 异常退出可能留下孤儿记录
- 无进程崩溃恢复机制

#### 健康检查与自重启

```typescript
// dev-runner.ts:640-655
async function maybeAutoRestartChild() {
  if (dirtyPaths.size === 0 && pendingMigrations.length === 0) return;

  const health = await getDevHealthPayload();
  const devServer = health?.devServer;
  if (!devServer?.enabled || devServer.autoRestartEnabled !== true) {
    restartInFlight = false;
    return;
  }
  // ...重启逻辑
}
```

**问题**:
- 依赖 `/api/health` 端点
- 无超时控制
- 重启失败时直接 `process.exit(1)`

### 5.3 错误处理

#### 错误处理覆盖

```typescript
// dev-runner.ts:230-242
process.on("uncaughtException", async (error) => {
  await removeLocalServiceRegistryRecord(devService.serviceKey);
  const err = toError(error, "Uncaught exception in dev runner");
  process.stderr.write(`${err.stack ?? err.message}\n`);
  process.exit(1);
});

process.on("unhandledRejection", async (reason) => {
  await removeLocalServiceRegistryRecord(devService.serviceKey);
  const err = toError(reason, "Unhandled promise rejection in dev runner");
  process.stderr.write(`${err.stack ?? err.message}\n`);
  process.exit(1);
});
```

**问题**:
- 立即退出，无优雅关闭
- 无错误上报机制
- 无崩溃日志持久化

#### 数据库启动错误

```typescript
// server/src/index.ts:396-418
if (!clusterAlreadyInitialized) {
  try {
    await embeddedPostgres.initialise();
  } catch (err) {
    logEmbeddedPostgresFailure("initialise", err);
    throw formatEmbeddedPostgresError(err, {
      fallbackMessage: `Failed to initialize embedded PostgreSQL cluster in ${dataDir} on port ${port}`,
      recentLogs: logBuffer.getRecentLogs(),
    });
  }
}
```

**问题**:
- 错误信息可能包含敏感路径
- 无重试机制

---

## 六、改造计划

### 6.1 解决启动失败的根本原因

#### 问题 1: Worktree 环境验证失败

**症状**:
```
[paperclip] linked git worktree at /path/to/worktree is missing .paperclip/worktree-env.json.
Run `paperclipai worktree init` in this worktree before `pnpm dev`.
```

**解决方案**:
```typescript
// scripts/dev-runner-worktree.ts
export function bootstrapDevRunnerWorktreeEnv(
  repoRoot: string,
  env: NodeJS.ProcessEnv
): { envPath: string; missingEnv: boolean; envData?: WorktreeEnvData } {
  const envPath = path.join(repoRoot, ".paperclip", "worktree-env.json");

  // 提供更友好的错误提示
  if (!existsSync(envPath)) {
    // 自动创建默认配置（仅开发模式）
    if (process.env.PAPERCLIP_DEV_AUTO_INIT === "true") {
      // 跳过验证，直接运行
      return { envPath, missingEnv: false };
    }
  }
}
```

#### 问题 2: 迁移检查阻塞启动

**解决方案**:
```bash
# 在 .env 中添加
PAPERCLIP_MIGRATION_AUTO_APPLY=true
PAPERCLIP_MIGRATION_PROMPT=never
```

或在 `dev-runner.ts` 中增强:
```typescript
async function maybePreflightMigrations(options = {}) {
  const payload = await refreshPendingMigrations();

  // 检测是否是首次运行
  if (payload.status === "firstRun") {
    // 首次运行自动应用
    await runPnpm(["db:migrate"], { stdio: "inherit", env, cwd: repoRoot });
    return;
  }

  // ... 原逻辑
}
```

### 6.2 性能优化建议

#### 6.2.1 UI Bundle 优化

**优先级 1: 分割主 Bundle (3.4MB)**

```typescript
// vite.config.ts
export default defineConfig(({ mode }) => ({
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React 生态
          if (id.includes('node_modules/react')) return 'vendor-react';
          // 图表库
          if (id.includes('node_modules/mermaid')) return 'vendor-mermaid';
          if (id.includes('node_modules/cytoscape')) return 'vendor-cytoscape';
          // Lexical 编辑器
          if (id.includes('node_modules/lexical')) return 'vendor-lexical';
        }
      }
    }
  }
}));
```

**预期效果**: 主 bundle 从 3.4MB 降至 ~800KB

**优先级 2: 动态导入图表组件

```typescript
// 按需加载图表类型
const diagramLoaders = {
  'sequence': () => import('./diagrams/sequence'),
  'architecture': () => import('./diagrams/architecture'),
  'mermaid': () => import('./diagrams/mermaid'),
};
```

**优先级 3: 启用 gzip/brotli 压缩

```bash
# 构建时添加
vite build --mode production
# 启用 brotli 压缩
```

#### 6.2.2 服务器启动优化

**问题**: 启动时执行大量串行数据库查询

**优化方案**:
```typescript
// server/src/index.ts
// 将独立的协调任务并发执行
await Promise.allSettled([
  reconcilePersistedRuntimeServicesOnStartup(db),
  heartbeat.reapOrphanedRuns(),
  heartbeat.promoteDueScheduledRetries(),
]);

// 然后执行依赖任务
await heartbeat.resumeQueuedRuns();
```

#### 6.2.3 心跳调度器优化

```typescript
// 当前: 每个任务单独执行
// 优化: 批量执行 + 智能调度

const heartbeatInterval = setInterval(() => {
  const now = Date.now();

  // 合并数据库查询
  Promise.all([
    heartbeat.tickTimers(now),
    heartbeat.scanSilentActiveRuns(now),
  ]).then(([timerResult, scanResult]) => {
    if (timerResult.enqueued > 0 || scanResult.created > 0) {
      logger.info({ timerResult, scanResult }, "Heartbeat batch processed");
    }
  });
}, config.heartbeatSchedulerIntervalMs);
```

### 6.3 开发体验改进

#### 6.3.1 快速启动脚本

创建 `scripts/quick-dev.sh`:

```bash
#!/bin/bash
set -e

# 检查 worktree 配置
if [ ! -f ".paperclip/worktree-env.json" ]; then
  echo "Initializing worktree environment..."
  paperclipai worktree init
fi

# 设置开发环境变量
export PAPERCLIP_MIGRATION_AUTO_APPLY=true
export PAPERCLIP_UI_DEV_MIDDLEWARE=true

# 启动
pnpm dev
```

#### 6.3.2 热重载增强

```typescript
// dev-runner.ts 增强
const watchedDirectories = [
  "cli",
  "scripts",
  "server",
  "packages/adapter-utils",
  "packages/adapters",
  "packages/db",
  "packages/plugins/sdk",
  "packages/shared",
  // 新增: 配置文件的依赖目录
  ".env",  // 监听 .env 变化
].map((relativePath) => path.join(repoRoot, relativePath));
```

#### 6.3.3 启动时间优化

```typescript
// 当前: 每次启动都构建 plugin-sdk
async function buildPluginSdk() {
  const result = await runPnpm(
    ["--filter", "@paperclipai/plugin-sdk", "build"],
    { stdio: "inherit" },
  );
}

// 优化: 增量构建
async function buildPluginSdkIncremental() {
  const result = await runPnpm(
    ["--filter", "@paperclipai/plugin-sdk", "build", "--incremental"],
    { stdio: "inherit" },
  );
}
```

### 6.4 数据库优化

#### 6.4.1 连接池配置

```typescript
// server/src/index.ts
import { createDb } from "@paperclipai/db";

const db = createDb(config.databaseUrl, {
  max: 20,        // 最大连接数
  idleTimeout: 30_000,
  connectionTimeout: 5_000,
});
```

#### 6.4.2 嵌入式 PostgreSQL 内存限制

```typescript
embeddedPostgres = new EmbeddedPostgres({
  // ...现有配置
  postgresFlags: [
    "max_connections=50",
    "shared_buffers=128MB",
    "effective_cache_size=256MB",
    "maintenance_work_mem=64MB",
    "work_mem=16MB",
  ],
});
```

---

## 七、实施优先级

### P0 - 必须修复 (阻塞启动)

1. **Worktree 环境验证逻辑**
   - 状态: 存在
   - 建议: 添加 `--skip-worktree-check` 选项

2. **迁移检查阻塞**
   - 状态: 存在
   - 建议: dev 模式默认自动应用

3. **embedded-postgres 版本不匹配**
   - 状态: 存在
   - 建议: 统一版本到 18.1.0-beta.16

### P1 - 重要优化 (影响性能)

4. **UI Bundle 分割**
   - 状态: 未实施
   - 预期: 主 bundle 从 3.4MB 降至 ~800KB

5. **启动时后台任务优化**
   - 状态: 串行执行
   - 预期: 启动时间减少 30-50%

6. **心跳调度器合并**
   - 状态: 独立执行
   - 预期: 减少数据库查询 50%

### P2 - 改进体验

7. **错误处理增强**
   - 添加崩溃日志持久化
   - 添加错误上报机制

8. **配置文件热重载**
   - 监听 `.env` 变化
   - 无需重启应用

9. **开发启动脚本**
   - 简化初始化流程
   - 自动化依赖检查

---

## 八、架构问题总结

### 8.1 设计模式问题

1. **配置管理分散**
   - 环境变量、配置文件、硬编码默认值混用
   - 优先级规则复杂，难以维护

2. **服务注册耦合**
   - dev-runner 与 server 紧耦合
   - 状态文件依赖文件系统

3. **插件系统复杂度**
   - 启动时需等待外部适配器
   - 类型验证依赖运行时加载

### 8.2 扩展性问题

1. **单一服务器架构**
   - 所有功能在单个进程中
   - 无法水平扩展

2. **数据库单点**
   - 嵌入式 PostgreSQL 无法集群
   - 无读写分离支持

3. **WebSocket 连接管理**
   - 无连接数限制
   - 无消息队列缓冲

---

## 九、建议的技术债务清理

### 9.1 短期 (1-2 周)

1. 统一 embedded-postgres 版本
2. 添加 `.env` 模板文件
3. 优化 UI bundle 分割

### 9.2 中期 (1 个月)

1. 实现配置文件热重载
2. 优化启动时后台任务
3. 添加连接池配置

### 9.3 长期 (3 个月)

1. 微服务架构拆分
2. 数据库集群支持
3. 插件系统沙箱化

---

## 附录

### A. 关键文件路径

```
scripts/
├── dev-runner.ts              # 开发服务器启动器
├── dev-service.ts             # 本地服务管理
├── dev-runner-paths.mjs       # 路径跟踪
├── dev-runner-worktree.ts     # Worktree 环境
└── prepare-server-ui-dist.sh   # UI 构建脚本

server/src/
├── index.ts                   # 服务器入口
├── config.ts                  # 配置加载
├── app.ts                     # Express 应用
├── config-file.ts             # 配置文件解析
├── worktree-config.ts         # Worktree 配置
└── dev-runner-worktree.ts     # 开发环境

packages/db/src/
├── index.ts                   # 数据库创建
├── migration-status.ts        # 迁移状态检查
└── migrations/                # 迁移文件目录
```

### B. 环境变量参考

| 变量 | 默认值 | 说明 |
|------|--------|------|
| PORT | 3100 | 服务器端口 |
| DATABASE_URL | - | 外部 PostgreSQL 连接 |
| EMBEDDED_POSTGRES_PORT | 54329 | 内嵌 PostgreSQL 端口 |
| PAPERCLIP_MIGRATION_AUTO_APPLY | false | 自动应用迁移 |
| PAPERCLIP_UI_DEV_MIDDLEWARE | false | 启用 Vite 开发中间件 |
| PAPERCLIP_DEPLOYMENT_MODE | local_trusted | 部署模式 |
| PAPERCLIP_BIND | loopback | 绑定模式 |
| PAPERCLIP_STORAGE_PROVIDER | local_disk | 存储后端 |

### C. 监控指标

```typescript
// 建议添加的监控指标
- server_startup_duration_ms
- migration_duration_ms
- embedded_postgres_init_duration_ms
- heartbeat_reconciliation_duration_ms
- websocket_connection_count
- database_query_duration_p99
- ui_bundle_load_duration
```

### D. 启动失败根因总结

**原因 1: 外部 PostgreSQL 不可达（主要）**

当 `.env` 配置了 `DATABASE_URL=postgres://paperclip:paperclip@localhost:5432/paperclip` 但 PostgreSQL 服务未运行时：

1. `server/src/index.ts` 第 275 行 `ensureMigrations()` 失败
2. `scripts/dev-runner.ts` 第 725 行 `maybePreflightMigrations()` 失败
3. 启动中止

**解决方案**:
- 注释掉 `.env` 中的 `DATABASE_URL` 行
- 系统会自动使用 embedded-postgres 模式
- 首次启动会自动初始化本地 PostgreSQL（端口 54329）

**原因 2: 缺少 .paperclip/config.json**

项目目录下的 `.paperclip/` 仅包含 `dev-server-status.json`，没有 `config.json`。这意味着：
- 配置回退到默认路径 `~/.paperclip/instances/default/config.json`
- 不会使用工作树隔离配置

---

**报告完成**