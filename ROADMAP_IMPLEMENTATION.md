# Paperclip 综合路线图与实施计划

> 创建日期: 2026-04-28
> 更新日期: 2026-04-28 (综合分析更新)
> 状态: 全面规划中
> 优先级: 🔴 最高

---

## 一、平台全面分析总结

### 1.1 核心技术能力

Paperclip 是一个**企业级 AI Agent 编排平台**，核心能力包括：

| 能力类别 | 描述 | 代码规模 |
|----------|------|----------|
| **心跳执行引擎** | 95 个服务，~57K 行代码 | 7,579 行 (heartbeat.ts) |
| **多租户架构** | 78 个数据库表 | 3,001 行 Schema |
| **插件系统** | 完整的 SDK 和生命周期管理 | 6 个包 |
| **多 Agent 适配器** | 7 种内置适配器 + 外部支持 | 36 个路由文件 |
| **预算控制** | 实时成本跟踪和强制暂停 | 958 行 (budgets.ts) |
| **工作流编排** | Issue 依赖图、审批、树形控制 | 3,738 行 (issues.ts) |

### 1.2 当前状态

**✅ 已完成功能:**
- Plugin system
- OpenClaw / claw-style agent employees
- companies.sh - import/export
- AGENTS.md 配置
- Skills Manager
- Scheduled Routines
- Better Budgeting
- Agent Reviews and Approvals
- Multiple Human Users
- Issue Work Products (基础 Schema + API)

**⚪ 待开发功能 (ROADMAP.md):**
- Cloud/Sandbox agents
- Artifacts & Work Products (UI)
- Memory / Knowledge
- Enforced Outcomes
- MAXIMIZER MODE
- Deep Planning
- Work Queues
- Self-Organization
- Automatic Organizational Learning
- CEO Chat
- Cloud Deployments
- Desktop App

---

## 二、技术债务分析

### 2.1 超大文件 (需要拆分)

| 文件 | 行数 | 优先级 | 建议 |
|------|------|--------|------|
| `heartbeat.ts` | 7,579 | 🔴 高 | 按职责拆分为 10+ 模块 |
| `access.ts` | 4,399 | 🔴 高 | 权限检查、角色、成员分离 |
| `AgentDetail.tsx` | 4,224 | 🔴 高 | Config、Runtime、Keys、Skills 分离 |
| `issues.ts` (route) | 3,842 | 🟡 中 | 按资源类型拆分 |
| `issues.ts` (service) | 3,738 | 🟡 中 | 按业务逻辑拆分 |
| `IssueDetail.tsx` | 3,649 | 🟡 中 | 按 Tab/功能拆分 |
| `worktree.ts` (CLI) | 3,342 | 🟡 中 | CLI 命令分离 |
| `company-portability.ts` | 4,534 | 🟡 中 | Export/Import 分离 |

### 2.2 代码质量问题

| 问题 | 位置 | 影响 |
|------|------|------|
| TypeScript `any` 类型 | `issues.ts` 中的 `dbOrTx: any` | 类型不安全 |
| 静默错误处理 | 多处 `.catch(() => null)` | 调试困难 |
| Skills UI 禁用 | `AgentDetail.tsx:874` | 功能缺失 |
| Worktree UI 禁用 | `runtime-json-fields.tsx:5` | 功能缺失 |
| Deprecated 代码 | `agent-instructions.ts`, `project.ts` | 技术债务 |

### 2.3 安全考虑

| 问题 | 位置 | 建议 |
|------|------|------|
| `new Function()` 动态导入 | `worktree.ts:323` | 审查输入 |
| `dangerouslySetInnerHTML` | `MarkdownBody.tsx` | SVG 净化 |
| 命令执行 | 多处 `spawnSync` | 审查参数 |
| 缺少 API 限流 | 全局 | 添加限流中间件 |

---

## 三、Artfacts 形式全面分析

### 3.1 已有基础设施

Paperclip 已经具备 **Work Products** 基础架构：

**Schema:** `issue_work_products`
```typescript
{
  id, companyId, issueId, projectId,
  executionWorkspaceId, runtimeServiceId,
  type,           // "artifact" | "preview_url" | "pull_request" | "branch" | "commit" | "document" | "runtime_service"
  provider,       // "paperclip" | "github" | "vercel" | "s3" | "custom"
  externalId,     // 外部系统 ID
  title, url, status,
  reviewState,    // 审查状态
  isPrimary,      // 是否为主要产出物
  healthStatus,   // 健康状态
  summary,        // 摘要
  metadata,       // 扩展 JSONB
  createdByRunId, // 创建来源
}
```

**已有支持:**
- ✅ Schema 定义完成
- ✅ 类型定义完成
- ✅ 服务层完成 (`workProductService`)
- ✅ CRUD API 完成
- ✅ UI API 客户端完成
- ❌ UI 组件缺失

### 3.2 Artifacts 类型分类

#### A. 代码类产出物
| 类型 | 描述 | 示例 |
|------|------|------|
| `branch` | Git 分支 | feature/xxx |
| `commit` | Git 提交 | abc123 |
| `artifact` (代码) | 代码文件集合 | TypeScript 模块 |

**元数据:**
```json
{
  "artifactType": "code_diff",
  "language": "typescript",
  "files": ["src/foo.ts"],
  "linesAdded": 150,
  "linesRemoved": 20,
  "baseCommit": "abc123",
  "headCommit": "def456"
}
```

#### B. 文档类产出物
| 类型 | 描述 | 示例 |
|------|------|------|
| `document` | 文档 | API 规范、设计文档 |
| `artifact` (文档) | 生成的文档 | 测试报告、变更日志 |

**元数据:**
```json
{
  "documentType": "api_spec" | "architecture" | "test_report",
  "format": "openapi" | "markdown" | "pdf",
  "sections": ["introduction", "endpoints"]
}
```

#### C. 预览类产出物
| 类型 | 描述 | 示例 |
|------|------|------|
| `preview_url` | 预览链接 | Vercel 部署预览 |

**元数据:**
```json
{
  "deploymentId": "dep_xxx",
  "branch": "feature-xyz",
  "commit": "abc123",
  "framework": "nextjs",
  "buildStatus": "success",
  "buildTime": 45
}
```

#### D. 运行时类产出物
| 类型 | 描述 | 示例 |
|------|------|------|
| `runtime_service` | 运行中的服务 | API 服务、后台任务 |

**元数据:**
```json
{
  "serviceType": "api" | "worker" | "cron",
  "url": "https://api.example.com",
  "regions": ["iad1"],
  "runtime": "serverless" | "container",
  "healthCheckUrl": "/health"
}
```

#### E. GitHub 类产出物
| 类型 | 描述 | 示例 |
|------|------|------|
| `pull_request` | Pull Request | GitHub PR |

**元数据:**
```json
{
  "prNumber": 42,
  "repository": "owner/repo",
  "baseBranch": "main",
  "headBranch": "feature-xyz",
  "draft": false,
  "reviewStatus": "approved",
  "checksPassed": true,
  "checkDetails": [
    { "name": "CI", "status": "success" },
    { "name": "Tests", "status": "success" }
  ]
}
```

#### F. 多媒体类产出物
| 类型 | 描述 | 示例 |
|------|------|------|
| `artifact` (图片) | 图片/截图 | 设计稿、截图 |
| `artifact` (视频) | 视频 | 演示视频 |

**元数据:**
```json
{
  "artifactType": "screenshot" | "mockup" | "diagram" | "video",
  "assetId": "uuid",
  "format": "png" | "mp4",
  "dimensions": { "width": 1920, "height": 1080 },
  "duration": 30
}
```

### 3.3 产出物创建时机

| 时机 | 触发者 | 产出物类型 |
|------|--------|------------|
| 代码提交后 | GitHub Webhook | `branch`, `commit` |
| PR 创建/合并 | GitHub Webhook | `pull_request` |
| 部署完成 | Vercel Webhook / Agent | `preview_url`, `runtime_service` |
| Agent 完成任务 | Agent MCP 工具 | `artifact`, `document` |
| 文档生成 | Agent | `document` |
| 截图生成 | Agent | `artifact` (图片) |
| 视频生成 | Agent | `artifact` (视频) |

### 3.4 产出物生命周期

```
创建 → 活动 → 审查 → 决策
  │       │       │       │
  ▼       ▼       ▼       ▼
draft   active  needs_   approved
                review   │
                        changes_requested
                                │
                                ▼
                            merged / closed / failed
                                │
                                ▼
                            archived
```

---

## 四、Paperclip 能做的事情全面分析

### 4.1 当前 Agent 能力

**读取操作 (27 个 MCP 工具):**
- 获取公司/目标/项目上下文
- 读取分配的 issues 和子任务
- 查看评论和文档
- 访问心跳上下文

**写入操作 (15 个 MCP 工具):**
- 创建/更新/释放 issues
- 添加评论和文档
- 建议任务 (委托)
- 报告成本事件
- 控制工作区运行时服务

**治理交互:**
- 请求审批 (雇佣、策略)
- 提交审批决策
- 关联 issues 到审批

### 4.2 Agent 可集成的外部服务

| 服务类别 | 潜在集成 |
|----------|----------|
| **VCS** | GitLab, Bitbucket, Azure DevOps |
| **Issue Tracking** | Linear, Jira, Asana, GitHub Issues |
| **部署** | AWS, GCP, Fly.io, Railway |
| **监控** | Grafana, Datadog, New Relic |
| **通信** | Slack, Discord, Teams |
| **存储** | S3, GCS, Azure Blob |
| **沙箱** | e2b, Modal, Replit |

### 4.3 新 Agent 类型支持

| Agent 类型 | 实现方式 |
|------------|----------|
| **e2b Sandbox** | 新适配器: 启动沙箱，运行 agent，返回结果 |
| **Modal** | HTTP 适配器: Modal 函数作为 agent 端点 |
| **Docker Container** | Process 适配器: 在容器中运行 agent |
| **Remote CLI** | HTTP 适配器: Web 可访问的 agent CLI |
| **Claude.ai API** | HTTP 适配器: Claude API 作为 agent 后端 |
| **Custom LLM** | HTTP 适配器: 任何 LLM 兼容 API |

### 4.4 当前可构建的功能

**快速胜利 (可立即构建):**
1. **完成 Skills UI** - AgentDetail.tsx 中被注释的 Skills 视图
2. **启用 Worktree UI** - 被禁用的 Worktree 运行时
3. **改进错误处理** - 替换静默 `.catch()` 模式
4. **API 限流** - 全局限流中间件

**中期功能 (需要设计):**
1. **Artifacts UI** - WorkProductCard, ArtifactViewer, 版本历史
2. **Memory/Knowledge** - 向量存储，语义搜索
3. **Cloud/Sandbox Agents** - e2b, Docker 容器支持
4. **审查工作流** - Work product 审批状态

**长期愿景 (路线图):**
1. **MAXIMIZER MODE** - 高自主性执行循环
2. **Self-Organization** - Agent 提议结构变更
3. **CEO Chat** - 轻量级领导交互
4. **Desktop App** - 原生应用

---

## 五、综合实施路线图

### 5.1 第一阶段: 代码质量提升 (4-6 周)

#### Branch: `feature/refactor-large-files`

**目标:** 拆分超大文件，提高可维护性

| 子任务 | 文件 | 拆分方案 | 时间 |
|--------|------|----------|------|
| 拆分 heartbeat.ts | 7,579 行 → 15+ 模块 | execution/, queue/, recovery/, costs/ | 2-3 周 |
| 拆分 access.ts | 4,399 行 → 5 模块 | permissions/, roles/, members/, invite/ | 1 周 |
| 拆分 AgentDetail.tsx | 4,224 行 → 10+ 组件 | Config/, Runtime/, Keys/, Skills/, Runs/ | 1-2 周 |
| 拆分 issues.ts (route) | 3,842 行 → 8 模块 | comments/, relations/, tree/, docs/, attachments/ | 1 周 |

#### Branch: `feature/typescript-strict`

**目标:** 消除 `any` 类型，提升类型安全

- 审查 `issues.ts` 中的 `dbOrTx: any`
- 添加数据库事务类型参数
- 启用 TypeScript strict mode

#### Branch: `feature/error-handling`

**目标:** 统一错误处理

- 创建 `server/src/errors/` 自定义错误类型
- 替换静默 `.catch(() => null)`
- 添加结构化日志

### 5.2 第二阶段: UI/UX 完善 (3-4 周)

#### Branch: `feature/complete-skills-ui`
**目标:** 恢复被禁用的 Skills UI

- 完成 `AgentDetail.tsx:874` 的 Skills 视图
- 添加技能市场 UI
- 技能安装/卸载流程

#### Branch: `feature/worktree-support`
**目标:** 启用 Worktree 支持 UI

- 完成 `runtime-json-fields.tsx:5` 的工作流
- 添加工作区切换 UI

#### Branch: `feature/api-rate-limiting`
**目标:** API 速率限制

- 添加全局速率限制中间件
- 按端点分类限制
- 防止滥用

### 5.3 第三阶段: Artifacts & Work Products (4-5 周)

#### Branch: `feature/artifacts-workproducts`

**目标:** 完整的产出物管理系统

**Sprint 1: 核心 UI (1 周)**
| 任务 | 文件 |
|------|------|
| WorkProductCard 组件 | `ui/src/components/work-products/WorkProductCard.tsx` |
| WorkProductsSection 组件 | `ui/src/components/work-products/WorkProductsSection.tsx` |
| useWorkProducts hooks | `ui/src/hooks/useWorkProducts.ts` |
| 集成到 IssueDetail | `ui/src/pages/IssueDetail.tsx` |

**Sprint 2: 预览系统 (1 周)**
| 任务 | 文件 |
|------|------|
| ArtifactViewer 组件 | `ui/src/components/work-products/ArtifactViewer.tsx` |
| 图片/代码/Markdown 预览器 | 各种 Preview 组件 |
| PDF.js 集成 | `ui/src/components/work-products/PdfPreview.tsx` |
| 服务器端预览生成 | `server/src/services/artifact-preview.ts` |

**Sprint 3: 版本管理 (1 周)**
| 任务 | 文件 |
|------|------|
| revisions schema | `packages/db/src/schema/work_product_revisions.ts` |
| 版本历史组件 | `ui/src/components/work-products/WorkProductVersionHistory.tsx` |
| 版本对比组件 | `ui/src/components/work-products/VersionDiff.tsx` |

**Sprint 4: 审查工作流 (1 周)**
| 任务 | 文件 |
|------|------|
| 审查面板组件 | `ui/src/components/work-products/WorkProductReviewPanel.tsx` |
| 审批按钮组件 | `ui/src/components/work-products/ReviewActions.tsx` |
| 通知集成 | `ui/src/components/work-products/` |

### 5.4 第四阶段: Memory/Knowledge (4-6 周)

#### Branch: `feature/memory-service`

**目标:** 向量记忆和知识管理

```
memory/
├── types.ts           # Memory 类型定义
├── service.ts         # Memory CRUD + 向量搜索
├── routes.ts          # API 路由
├── embedding.ts       # 向量化服务 (OpenAI/Custom)
└── ui/
    ├── MemorySearch   # 搜索 UI
    └── MemoryGraph    # 知识图谱可视化
```

**核心功能:**
1. 记忆存储和检索
2. 向量化嵌入 (OpenAI embeddings / Custom)
3. 语义搜索 (cosine similarity)
4. 与 Agent/Project 关联
5. 遗忘策略 (TTL, importance scoring)

### 5.5 第五阶段: Cloud/Sandbox Agents (6-8 周)

#### Branch: `feature/sandbox-agents`

**目标:** 云端和沙箱环境支持

**适配器实现:**
| 适配器 | 技术 | 难度 |
|--------|------|------|
| e2b Sandbox | e2b SDK | 中 |
| Docker Container | Docker API | 中 |
| Modal | Modal SDK | 中 |
| SSH Remote | SSH2 | 低 |

**架构:**
```
Agent Request → Adapter → Sandbox Runtime
                              ↓
                         Execution
                              ↓
                         Result → WorkProduct
```

### 5.6 第六阶段: MAXIMIZER MODE (8+ 周)

#### Branch: `feature/maximizer-mode`

**目标:** 高级自主执行模式

**功能:**
1. 更激进的委托策略
2. 更强的跟进循环
3. 清晰的预算、可见性、治理

### 5.7 第七阶段: 其他功能 (持续)

| 功能 | Branch | 优先级 |
|------|--------|--------|
| Work Queues | `feature/work-queues` | 🟡 中 |
| Self-Organization | `feature/self-organization` | 🟢 低 |
| Automatic Org Learning | `feature/org-learning` | 🟢 低 |
| CEO Chat | `feature/ceo-chat` | 🟢 低 |
| Cloud Deployments | `feature/cloud-deployments` | 🟡 中 |
| Desktop App | `feature/desktop-app` | 🟢 低 |

---

## 六、分支管理

### 6.1 当前分支状态

```bash
feature/api-rate-limiting      # API 限流
feature/artifacts-workproducts # Artifacts UI 开发
feature/complete-skills-ui     # Skills UI 完成
feature/improve-error-handling # 错误处理改进
feature/refactor-large-files   # 大文件拆分
feature/worktree-support       # Worktree 支持
```

### 6.2 推荐分支优先级

| 优先级 | 分支 | 目标 | 建议时间 |
|--------|------|------|----------|
| 1 | `feature/complete-skills-ui` | 快速胜利 | 本周 |
| 2 | `feature/worktree-support` | 用户体验 | 1-2 天 |
| 3 | `feature/artifacts-workproducts` | 核心功能 | 4-5 周 |
| 4 | `feature/refactor-large-files` | 技术债务 | 持续 |
| 5 | `feature/memory-service` | 差异化 | 4-6 周 |

---

## 七、验证清单

每个分支实现后需验证:

- [ ] `pnpm typecheck` 通过
- [ ] `pnpm test` 通过
- [ ] E2E 测试覆盖新功能
- [ ] 文档更新 (README/API docs)
- [ ] 性能基准测试 (如有性能影响)

---

## 八、关键文件索引

| 功能 | 核心文件 |
|------|----------|
| 心跳执行 | `server/src/services/heartbeat.ts` (7,579 行) |
| Issue 管理 | `server/src/services/issues.ts` (3,738 行) |
| 预算控制 | `server/src/services/budgets.ts` (958 行) |
| Work Products | `server/src/services/work-products.ts` |
| 数据库 Schema | `packages/db/src/schema/` (78 文件) |
| 适配器 | `packages/adapters/*/src/server/` |
| MCP 服务器 | `packages/mcp-server/src/` |
| 插件 SDK | `packages/plugins/sdk/src/` |
| UI 页面 | `ui/src/pages/` (65 页) |
| UI 组件 | `ui/src/components/` (190+ 组件) |

---

## 九、参考资料

- [Maxim AI - Agent Development Best Practices](https://www.getmaxim.ai/articles/accelerating-ai-agent-development-best-practices-for-fast-reliable-iteration-in-2025/)
- [UiPath - Agent Builder Best Practices](https://www.uipath.com/blog/ai/agent-builder-best-practices)
- [DevOps Artifacts Best Practices](https://www.edureka.co/blog/devops-artifacts/)
- [AI Agent Work Products 2025](https://www.getmaxim.ai/articles/accelerating-ai-agent-development-best-practices-for-fast-reliable-iteration-in-2025/)