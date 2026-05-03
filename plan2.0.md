# Paperclip 后端启动失败分析报告

> 分析时间: 2026-05-03
> 项目: Paperclip
> 分支: feature/artifacts-workproducts

---

## 一、启动架构概览

### 1.1 启动流程链路

```
pnpm dev
  → scripts/dev-runner.ts (主启动器)
    → 执行迁移预检 (maybePreflightMigrations)
    → 构建 Plugin SDK (buildPluginSdk)
    → 启动子进程: pnpm --filter @paperclipai/server dev
      → server/package.json: "dev": "tsx src/index.ts"
        → server/src/index.ts (startServer)
          → loadConfig() 加载配置
          → 启动/连接数据库
          → 创建 Express App (createApp)
          → 监听端口
```

### 1.2 关键文件职责

| 文件 | 职责 |
|------|------|
| `scripts/dev-runner.ts` | 主启动协调器：管理子进程生命周期、文件监控、自动重启、迁移预检 |
| `scripts/dev-service.ts` | 本地服务注册表管理：list/stop 正在运行的开发服务 |
| `scripts/dev-service-profile.ts` | 创建设备身份标识（serviceKey、envFingerprint） |
| `server/src/index.ts` | 服务器入口：数据库初始化、Express App 创建、端口监听 |
| `server/src/app.ts` | Express 应用构建：注册所有 API 路由和中间件 |
| `server/src/config.ts` | 配置加载：从 config.json、.env、worktree-config 多层合并 |
| `packages/db/src/migration-runtime.ts` | 数据库连接解析：优先使用 DATABASE_URL，否则启动 embedded-postgres |
| `packages/db/src/client.ts` | Drizzle ORM 数据库客户端和迁移管理 |

---

## 二、数据库配置分析

### 2.1 连接解析优先级

`packages/db/src/runtime-config.ts` 中的 `resolveDatabaseTarget()` 函数按以下优先级决定数据库连接：

1. **最高优先级**: `process.env.DATABASE_URL`
2. **第二优先级**: `.paperclip/.env` 中的 `DATABASE_URL`
3. **第三优先级**: `config.json` 中的 `database.connectionString`
4. **兜底策略**: 使用 embedded-postgres（本地内嵌 PostgreSQL）

### 2.2 当前环境状态

**项目根目录 `.env` 文件内容：**
```
DATABASE_URL=postgres://paperclip:paperclip@localhost:5432/paperclip
PORT=3100
SERVE_UI=true
BETTER_AUTH_SECRET=paperclip-dev-secret
```

**关键发现：**
- `.env` 配置了 `DATABASE_URL`，指向外部 PostgreSQL
- 本地 PostgreSQL 服务**未运行**（`pg_isready` 返回 "no response"）
- 连接尝试返回 "Operation not permitted"（macOS 沙盒阻止 TCP 连接）

### 2.3 配置文件位置

`server/src/paths.ts` 定义了配置搜索路径：
```typescript
// 向上遍历目录树，寻找 .paperclip/config.json
// 如果找不到，使用默认路径: ~/.paperclip/instances/default/config.json
```

**当前状态：**
- 项目根目录下的 `.paperclip/` 目录**不包含** `config.json`（只有 `dev-server-status.json`）
- 因此会使用默认配置路径 `~/.paperclip/instances/default/`
- 这意味着**没有专门的 worktree 配置**，使用的是默认实例

---

## 三、启动失败根因分析

### 3.1 直接原因

**根本原因：DATABASE_URL 配置指向的外部 PostgreSQL 无法连接**

当 `startServer()` 在 `server/src/index.ts` 第 273-281 行执行时：

```typescript
if (config.databaseUrl) {
  // 尝试使用外部 PostgreSQL
  const migrationUrl = config.databaseMigrationUrl ?? config.databaseUrl;
  migrationSummary = await ensureMigrations(migrationUrl, "PostgreSQL");  // ← 这里会失败
  db = createDb(config.databaseUrl);
  // ...
} else {
  // 启动 embedded-postgres
  // ...
}
```

`ensureMigrations()` 函数内部调用 `inspectMigrations()`，这会尝试连接到 `localhost:5432`。由于：
1. PostgreSQL 服务未运行
2. macOS 沙盒阻止 TCP 连接（"Operation not permitted"）

连接会失败，导致服务器启动中止。

### 3.2 配置层叠逻辑

`server/src/config.ts` 的 `loadConfig()` 函数：

```typescript
// 第 300 行
databaseUrl: process.env.DATABASE_URL ?? fileDbUrl,
```

`process.env.DATABASE_URL` 来自项目根目录的 `.env` 文件（通过 dotenv 加载）。

### 3.3 本地服务注册表

`server/src/services/local-service-supervisor.ts` 使用文件系统存储服务注册信息：

- 存储路径: `~/.paperclip/instances/default/runtime-services/`
- 文件命名: `{serviceKey}.json`
- 独立于数据库存在，因此不影响启动

---

## 四、启动条件详细分析

### 4.1 数据库依赖

| 数据库模式 | 触发条件 | 依赖 |
|-----------|---------|------|
| **外部 PostgreSQL** | `DATABASE_URL` 环境变量或配置文件中设置 | 外部 PostgreSQL 服务必须运行且可达 |
| **Embedded PostgreSQL** | 未设置 `DATABASE_URL` | `embedded-postgres` npm 包必须已安装；首次运行需要初始化数据目录 |

**当前状态：** 配置了外部 PostgreSQL，但服务未运行。

### 4.2 环境变量要求

**必需环境变量：**
- `DATABASE_URL`（如果使用外部 PostgreSQL）或完全省略（使用 embedded-postgres）

**可选但重要的环境变量：**
- `PORT` - 服务器监听端口（默认 3100）
- `PAPERCLIP_DEPLOYMENT_MODE` - 部署模式（`local_trusted` / `authenticated`）
- `PAPERCLIP_BIND` - 绑定模式（`loopback` / `lan` / `tailnet` / `custom`）
- `PAPERCLIP_MIGRATION_AUTO_APPLY=true` - 自动应用迁移
- `PAPERCLIP_SECRETS_PROVIDER` - 密钥提供者（默认 `local_encrypted`）

### 4.3 工作树（Worktree）环境

`scripts/dev-runner.ts` 第 24-30 行检查工作树环境：

```typescript
const worktreeEnvBootstrap = bootstrapDevRunnerWorktreeEnv(repoRoot, process.env);
if (worktreeEnvBootstrap.missingEnv) {
  console.error(
    `[paperclip] linked git worktree at ${repoRoot} is missing ${path.relative(repoRoot, worktreeEnvBootstrap.envPath)}. Run \`paperclipai worktree init\` in this worktree before \`pnpm dev\`.`
  );
  process.exit(1);
}
```

`bootstrapDevRunnerWorktreeEnv()` 在 `server/src/dev-runner-worktree.ts` 中定义，只有当目录是 linked git worktree 且缺少 `.paperclip/.env` 时才会失败。

**当前状态：** 项目目录不是 linked worktree（`.git` 不是指向 `gitdir:` 的文件），因此此检查通过。

### 4.4 迁移预检

`scripts/dev-runner.ts` 第 725 行执行迁移预检：

```typescript
await maybePreflightMigrations();
```

该函数调用 `pnpm --filter @paperclipai/db exec tsx src/migration-status.ts --json`。

`packages/db/src/migration-status.ts` 通过 `resolveMigrationConnection()` 解析数据库连接，同样会遇到连接失败问题。

---

## 五、代码架构分析

### 5.1 启动时序图

```
startServer()
├── loadConfig()                    ← 加载配置（DATABASE_URL 指向外部 PG）
├── initTelemetry()
├── 设置 secrets 提供者环境变量
│
├── [数据库初始化]
│   ├── 如果 config.databaseUrl:
│   │   ├── ensureMigrations(config.databaseUrl)   ← 尝试连接外部 PG
│   │   │   └── inspectMigrations()                 ← 连接失败！启动中止
│   │   └── createDb(config.databaseUrl)
│   └── 否则:
│       ├── 加载 embedded-postgres
│       ├── 初始化/启动 embedded PG
│       ├── ensureMigrations(embeddedConnection)
│       └── createDb(embeddedConnection)
│
├── [认证模式初始化]
│   ├── local_trusted: ensureLocalTrustedBoardPrincipal()
│   └── authenticated: createBetterAuthInstance()
│
├── createApp()                    ← 创建 Express 应用
├── createServer()                ← 创建 HTTP 服务器
├── setupLiveEventsWebSocketServer()
├── reconcilePersistedRuntimeServicesOnStartup()
├── heartbeatService.tickTimers() (定时任务)
└── server.listen(port, host)     ← 最终开始监听
```

### 5.2 核心模块依赖关系

```
server/src/index.ts (startServer)
├── @paperclipai/db
│   ├── createDb()              → drizzle ORM 客户端
│   ├── inspectMigrations()     → 检查迁移状态
│   ├── applyPendingMigrations() → 应用待处理迁移
│   ├── ensurePostgresDatabase() → 确保数据库存在
│   └── embedded-postgres        → 内嵌 PostgreSQL 引擎
├── server/src/config.ts (loadConfig)
│   ├── dotenv (.env 加载)
│   ├── config-file.ts (config.json)
│   └── worktree-config.ts (worktree 隔离配置)
├── server/src/app.ts (createApp)
│   ├── 50+ 路由模块 (issues, projects, agents, etc.)
│   ├── 中间件 (auth, logger, hostname guard)
│   └── Plugin 系统
└── server/src/services/
    ├── heartbeat.ts            → 定时任务调度器
    ├── feedback.ts            → 反馈追踪
    └── 其他 70+ 服务模块
```

### 5.3 内嵌 PostgreSQL 启动流程

当没有配置 `DATABASE_URL` 时，`server/src/index.ts` 启动 embedded-postgres 的流程（第 282-445 行）：

1. 加载 `embedded-postgres` npm 包
2. 检查 `postmaster.pid` 是否存在运行中的实例
3. 如果没有运行实例：
   - 检测端口是否可用
   - 创建 `EmbeddedPostgres` 实例
   - 调用 `instance.initialise()`（首次运行）
   - 调用 `instance.start()` 启动服务
4. 通过 admin 连接创建 `paperclip` 数据库
5. 自动应用待处理迁移
6. 创建 Drizzle ORM 客户端

---

## 六、启动失败的具体原因总结

### 原因 1: 外部 PostgreSQL 不可达（主要）

```
.env 配置: DATABASE_URL=postgres://paperclip:paperclip@localhost:5432/paperclip
实际状态:  PostgreSQL 服务未运行
错误信息:  "connection to server at "localhost" (127.0.0.1), port 5432 failed:
           Operation not permitted"
```

**影响范围：**
- `server/src/index.ts` 第 275 行 `ensureMigrations()` 失败
- `scripts/dev-runner.ts` 第 725 行 `maybePreflightMigrations()` 失败（调用 `pnpm db:migrate` 时也会失败）

### 原因 2: 缺少 .paperclip/config.json

项目目录下的 `.paperclip/` 仅包含 `dev-server-status.json`，没有 `config.json`。这意味着：
- 配置回退到默认路径 `~/.paperclip/instances/default/config.json`
- 不会使用工作树隔离配置

---

## 七、改造计划

### 方案 A: 使用 Embedded PostgreSQL（推荐，无需外部依赖）

**原理：** 不设置 `DATABASE_URL` 环境变量，让系统自动使用 embedded-postgres。

#### 修改步骤

**Step 1: 修改 `.env` 文件**

注释掉 `DATABASE_URL` 行，或完全删除该行：

```bash
# DATABASE_URL=postgres://paperclip:paperclip@localhost:5432/paperclip
```

或者将 `.env` 中的 `DATABASE_URL` 行删除或注释掉，系统会自动回退到 embedded-postgres 模式。

**Step 2: 确保 embedded-postgres 依赖正确**

检查 `server/package.json` 和 `packages/db/package.json` 中的 `embedded-postgres` 版本兼容性。

**Step 3: 启动验证**

```bash
cd /Users/louloulin/Documents/linchong/code/paperclip
pnpm dev
```

首次启动时，embedded-postgres 会：
1. 初始化数据目录 `~/.paperclip/instances/default/db/`
2. 启动 PostgreSQL 服务（默认端口 54329）
3. 创建 `paperclip` 数据库
4. 应用所有待处理迁移

### 方案 B: 修复外部 PostgreSQL 连接

如果偏好使用外部 PostgreSQL：

1. **安装并启动 PostgreSQL 服务**

   macOS 方式（使用 Homebrew）：
   ```bash
   brew install postgresql@17
   brew services start postgresql@17
   ```

2. **创建数据库和用户**

   ```bash
   # 连接 postgres
   psql postgres

   # 创建用户和数据库
   CREATE USER paperclip WITH PASSWORD 'paperclip';
   CREATE DATABASE paperclip OWNER paperclip;
   GRANT ALL PRIVILEGES ON DATABASE paperclip TO paperclip;
   ```

3. **验证连接**

   ```bash
   psql -h localhost -p 5432 -U paperclip -d paperclip -c "SELECT 1"
   ```

### 方案 C: 实现离线开发模式（深度改造）

#### 设计目标

支持在不依赖任何外部服务的情况下启动后端，包括：
- 无需 PostgreSQL（使用内存数据库或 SQLite mock）
- 无需外部 AI 适配器
- 提供模拟数据用于开发测试

#### 实施步骤

**Step 1: 创建数据库 Mock 适配器**

创建 `packages/db/src/mock-adapter.ts`：

```typescript
// 模拟 Drizzle ORM 接口的内存数据库
// 提供基本的 CRUD 操作，用于开发环境
```

**Step 2: 修改配置加载逻辑**

在 `server/src/config.ts` 中添加 `PAPERCLIP_OFFLINE_MODE` 环境变量检测：

```typescript
// 在 loadConfig() 函数中添加
const offlineMode = process.env.PAPERCLIP_OFFLINE_MODE === "true";

// 在数据库配置部分
let databaseUrl: string | undefined;
if (offlineMode) {
  databaseUrl = undefined; // 强制使用 embedded-postgres
} else {
  databaseUrl = process.env.DATABASE_URL ?? fileDbUrl;
}
```

**Step 3: 添加 Seed 数据支持**

增强 `packages/db/src/seed.ts` 的功能，支持在首次启动时自动 seed 数据。

在 `server/src/index.ts` 中，在 `ensureMigrations()` 完成后检查是否为首次运行，如果是则自动执行 seed。

**Step 4: 添加 Mock AI 适配器**

在 `packages/adapters/` 下创建 `mock-adapter` 插件，返回预定义的模拟响应。

### 方案 D: 改进开发体验（最小改动）

**只修改 `.env` 文件，无需代码改动**

这是最小侵入的方案，只需：

1. 将 `DATABASE_URL` 行注释或删除
2. 确保 `embedded-postgres` 包已安装
3. 运行 `pnpm dev`

系统会自动使用 embedded-postgres，不需要任何代码修改。

---

## 八、推荐实施路径

### 推荐方案：方案 A（使用 Embedded PostgreSQL）+ 方案 D 步骤

**理由：**
- 无需安装配置外部 PostgreSQL
- 零代码改动
- embedded-postgres 已在项目依赖中（`@paperclipai/db` 和 `server` 包）
- 自动迁移和应用
- 完全隔离的数据库实例（不影响其他 PostgreSQL 安装）

**实施命令：**

```bash
# Step 1: 备份并修改 .env 文件
cd /Users/louloulin/Documents/linchong/code/paperclip
cp .env .env.bak

# Step 2: 注释掉 DATABASE_URL
sed -i '' 's/^DATABASE_URL=/# DATABASE_URL=/' .env

# Step 3: 验证修改
cat .env | grep DATABASE_URL

# Step 4: 启动开发服务器
pnpm dev
```

### 预期结果

首次启动后：
1. 系统检测到无 `DATABASE_URL`，自动启动 embedded-postgres
2. 在 `~/.paperclip/instances/default/db/` 初始化数据目录
3. 在端口 54329（默认）启动 PostgreSQL 服务
4. 创建 `paperclip` 数据库
5. 应用所有 76 个待处理迁移
6. 创建默认的 `local-board` 用户（local_trusted 模式）
7. 启动 Express 服务器在端口 3100
8. 显示启动横幅

---

## 九、调试和验证

### 验证启动状态

启动后访问健康检查端点：

```bash
curl http://127.0.0.1:3100/api/health
```

### 检查 embedded-postgres 状态

```bash
# 检查数据目录
ls ~/.paperclip/instances/default/db/

# 检查 PostgreSQL 进程
pgrep -fl postgres
```

### 检查迁移状态

```bash
cd /Users/louloulin/Documents/linchong/code/paperclip
pnpm --filter @paperclipai/db exec tsx src/migration-status.ts
```

---

## 十、附录：关键文件路径参考

| 文件 | 绝对路径 |
|------|---------|
| 项目根目录 | `/Users/louloulin/Documents/linchong/code/paperclip` |
| 开发启动器 | `/Users/louloulin/Documents/linchong/code/paperclip/scripts/dev-runner.ts` |
| 服务管理器 | `/Users/louloulin/Documents/linchong/code/paperclip/scripts/dev-service.ts` |
| 服务器入口 | `/Users/louloulin/Documents/linchong/code/paperclip/server/src/index.ts` |
| 配置加载 | `/Users/louloulin/Documents/linchong/code/paperclip/server/src/config.ts` |
| Express App | `/Users/louloulin/Documents/linchong/code/paperclip/server/src/app.ts` |
| 数据库客户端 | `/Users/louloulin/Documents/linchong/code/paperclip/packages/db/src/client.ts` |
| 迁移运行时 | `/Users/louloulin/Documents/linchong/code/paperclip/packages/db/src/migration-runtime.ts` |
| 环境变量 | `/Users/louloulin/Documents/linchong/code/paperclip/.env` |
| 实例根目录 | `~/.paperclip/instances/default/` |
| 迁移文件 | `/Users/louloulin/Documents/linchong/code/paperclip/packages/db/src/migrations/` (76 个) |

---

**报告完成**