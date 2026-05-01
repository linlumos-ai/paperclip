# Artifacts & Work Products 实现计划

> 创建日期: 2026-04-28
> 更新日期: 2026-04-28 (综合分析更新)
> 状态: 规划中
> 优先级: 🔴 高

---

## 一、概述

### 1.1 目标

将 Paperclip 打造成 AI Agent 工作产出的**一等公民**管理平台，实现：
- 生成的 Artifacts（代码、文档、图片等）成为可追溯、可管理的一等公民
- 从"Agent 完成工作"到"这里有结果"的无缝交接
- 产出的预览、部署、版本管理、审查工作流

### 1.2 现状分析

**已有基础设施**:
- ✅ Schema 定义: `issue_work_products` 表
- ✅ 类型定义: `IssueWorkProduct` 类型 (7 种 type, 5 种 provider)
- ✅ 服务层: `workProductService`
- ✅ API 路由: CRUD 端点已实现
- ✅ UI API 客户端: `issuesApi.listWorkProducts()` 等方法
- ✅ 存储服务: S3/Local 存储支持

**待开发组件**:
- ❌ UI 展示组件 (WorkProductCard, ArtifactViewer)
- ❌ 预览生成系统 (图片、代码、文档、PDF)
- ❌ 版本管理 UI
- ❌ 审查/审批工作流集成
- ❌ 健康状态监控
- ❌ 产出物仪表板

### 1.3 Artifacts 类型分类

#### A. 代码类产出物
| Type | Provider | Metadata |
|------|----------|----------|
| `artifact` (代码) | `custom` | language, files, linesAdded, linesRemoved |
| `branch` | `github` | branchName, baseBranch |
| `commit` | `github` | commitHash, message, author |

#### B. 文档类产出物
| Type | Provider | Metadata |
|------|----------|----------|
| `document` | `paperclip` | documentType, format |
| `artifact` (文档) | `paperclip` | documentType, sections |

#### C. 预览类产出物
| Type | Provider | Metadata |
|------|----------|----------|
| `preview_url` | `vercel` | deploymentId, branch, commit, framework |

#### D. 运行时类产出物
| Type | Provider | Metadata |
|------|----------|----------|
| `runtime_service` | `vercel` | serviceType, url, regions |

#### E. GitHub 类产出物
| Type | Provider | Metadata |
|------|----------|----------|
| `pull_request` | `github` | prNumber, reviewStatus, checksPassed |

#### F. 多媒体类产出物
| Type | Provider | Metadata |
|------|----------|----------|
| `artifact` (图片) | `s3` | assetId, format, dimensions |
| `artifact` (视频) | `s3` | assetId, format, duration |

### 1.3 相关文件

| 组件 | 文件路径 |
|------|----------|
| Schema | `packages/db/src/schema/issue_work_products.ts` |
| 类型 | `packages/shared/src/types/work-product.ts` |
| 验证器 | `packages/shared/src/validators/work-product.ts` |
| 服务 | `server/src/services/work-products.ts` |
| 存储 | `server/src/storage/` |
| UI API | `ui/src/api/issues.ts` |
| 查询 Keys | `ui/src/lib/queryKeys.ts` |

---

## 二、功能范围

### 2.1 第一阶段：核心 UI (MVP)

#### 2.1.1 WorkProductCard 组件
```typescript
// ui/src/components/WorkProductCard.tsx
interface WorkProductCardProps {
  workProduct: IssueWorkProduct;
  onPreview?: (wp: IssueWorkProduct) => void;
  onSetPrimary?: (wp: IssueWorkProduct) => void;
  onDelete?: (wp: IssueWorkProduct) => void;
}
```

**功能**:
- 显示产出物类型图标
- 显示标题、状态、更新时间
- 健康状态指示器
- 主要产出物标识 (⭐)
- 快速操作菜单

#### 2.1.2 WorkProductsSection 组件
```typescript
// ui/src/components/WorkProductsSection.tsx
interface WorkProductsSectionProps {
  issueId: string;
}
```

**功能**:
- 列出 Issue 的所有 Work Products
- 按类型分组 (artifact, preview_url, pull_request 等)
- 添加新产出物表单
- 拖拽排序
- 折叠/展开

#### 2.1.3 IssueDetail 集成
- 在 IssueDetail 页面添加 WorkProductsSection tab 或面板
- 集成到 IssueDocumentsSection 或独立 tab

### 2.2 第二阶段：预览系统

#### 2.2.1 ArtifactViewer 组件
```typescript
// ui/src/components/ArtifactViewer.tsx
interface ArtifactViewerProps {
  workProduct: IssueWorkProduct;
  onClose?: () => void;
}
```

**支持的文件类型**:
| 类型 | 预览方式 |
|------|----------|
| 图片 (png, jpg, webp, gif) | 直接渲染 |
| PDF | PDF.js 渲染 |
| 代码文件 | Syntax Highlighting |
| Markdown | Markdown 渲染 |
| JSON | JSON 树形视图 |
| 链接 (preview_url) | iframe 预览 |

#### 2.2.2 预览生成服务
```typescript
// server/src/services/artifact-preview.ts
interface ArtifactPreviewService {
  generatePreview(workProduct: IssueWorkProduct): Promise<PreviewResult>;
  getPreviewUrl(workProduct: IssueWorkProduct): string | null;
}
```

### 2.3 第三阶段：版本管理

#### 2.3.1 WorkProductRevision Schema
```typescript
// packages/db/src/schema/work_product_revisions.ts
interface WorkProductRevision {
  id: string;
  workProductId: string;
  version: number;
  content: string; // 或 JSON
  summary: string;
  createdByRunId: string;
  createdAt: Date;
}
```

#### 2.3.2 版本历史 UI
- 版本列表展示
- 版本对比 (diff view)
- 版本回滚

### 2.4 第四阶段：审查工作流

#### 2.4.1 审查状态集成
```typescript
type ReviewState = "none" | "needs_board_review" | "approved" | "changes_requested";

interface ReviewActions {
  requestReview: (workProductId: string) => Promise<void>;
  approve: (workProductId: string) => Promise<void>;
  requestChanges: (workProductId: string, comment: string) => Promise<void>;
}
```

#### 2.4.2 审查面板
- 审查状态指示器
- 变更请求评论
- 审批按钮组

### 2.5 第五阶段：产出物仪表板

#### 2.5.1 独立页面
```
/artifacts              # 产出物列表
/artifacts/:id          # 产出物详情
/projects/:id/artifacts # 项目产出物
```

#### 2.5.2 仪表板功能
- 按项目/Agent/时间过滤
- 健康状态概览
- 产出趋势图表

---

## 三、技术架构

### 3.1 目录结构

```
ui/src/components/
├── work-products/
│   ├── WorkProductCard.tsx
│   ├── WorkProductsSection.tsx
│   ├── ArtifactViewer.tsx
│   ├── ArtifactPreviewRenderer.tsx
│   ├── WorkProductReviewPanel.tsx
│   ├── WorkProductVersionHistory.tsx
│   └── index.ts

server/src/services/
├── work-products.ts           # 已存在
├── artifact-preview.ts        # 新增
└── work-product-revisions.ts  # 新增

packages/db/src/schema/
├── issue_work_products.ts     # 已存在
└── work_product_revisions.ts  # 新增
```

### 3.2 数据模型

```typescript
// 核心类型 (已有)
interface IssueWorkProduct {
  id: string;
  companyId: string;
  issueId: string;
  type: IssueWorkProductType; // "artifact" | "preview_url" | "pull_request" | ...
  provider: string; // "github" | "vercel" | "paperclip" | ...
  title: string;
  url: string | null;
  status: string;
  reviewState: string;
  isPrimary: boolean;
  healthStatus: "unknown" | "healthy" | "unhealthy";
  summary: string | null;
  metadata: Record<string, unknown>;
  createdByRunId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// 新增类型
interface WorkProductRevision {
  id: string;
  workProductId: string;
  version: number;
  content: string;
  summary: string;
  createdByRunId: string;
  createdAt: Date;
}
```

### 3.3 API 设计

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/issues/:id/work-products` | 列出产出物 |
| POST | `/issues/:id/work-products` | 创建产出物 |
| PATCH | `/work-products/:id` | 更新产出物 |
| DELETE | `/work-products/:id` | 删除产出物 |
| POST | `/work-products/:id/revisions` | 创建版本 |
| GET | `/work-products/:id/revisions` | 列出版本 |
| POST | `/work-products/:id/review` | 提交审查 |
| GET | `/work-products/:id/preview` | 获取预览 URL |

---

## 四、实施计划

### 4.1 Sprint 1: 核心 UI (1 周)

**目标**: WorkProductCard + WorkProductsSection

| 任务 | 文件 | 依赖 |
|------|------|------|
| 创建 WorkProductCard 组件 | `ui/src/components/work-products/WorkProductCard.tsx` | 无 |
| 创建 WorkProductsSection 组件 | `ui/src/components/work-products/WorkProductsSection.tsx` | WorkProductCard |
| 创建 Work Products hooks | `ui/src/hooks/useWorkProducts.ts` | API 客户端 |
| 集成到 IssueDetail | `ui/src/pages/IssueDetail.tsx` | WorkProductsSection |
| 添加 Work Products tab | `ui/src/components/IssueDocumentsSection.tsx` | WorkProductsSection |

**验收标准**:
- [ ] Issue 详情页显示 Work Products 列表
- [ ] 可以创建、编辑、删除 Work Products
- [ ] 支持设置主要产出物

### 4.2 Sprint 2: 预览系统 (1 周)

**目标**: ArtifactViewer + 预览渲染

| 任务 | 文件 | 依赖 |
|------|------|------|
| 创建 ArtifactViewer 组件 | `ui/src/components/work-products/ArtifactViewer.tsx` | 无 |
| 创建图片预览器 | `ui/src/components/work-products/ImagePreview.tsx` | 无 |
| 创建代码预览器 | `ui/src/components/work-products/CodePreview.tsx` | 无 |
| 创建 Markdown 预览器 | `ui/src/components/work-products/MarkdownPreview.tsx` | 无 |
| 创建 PDF 预览器 | `ui/src/components/work-products/PdfPreview.tsx` | 需要 pdf.js |
| 创建预览路由处理器 | `server/src/routes/work-products.ts` | 存储服务 |
| 实现服务器端预览生成 | `server/src/services/artifact-preview.ts` | 无 |

**验收标准**:
- [ ] 可以预览图片、代码、Markdown 文件
- [ ] 支持全屏预览
- [ ] 预览加载状态显示

### 4.3 Sprint 3: 版本管理 (1 周)

**目标**: 版本历史 + 回滚

| 任务 | 文件 | 依赖 |
|------|------|------|
| 创建 revisions schema | `packages/db/src/schema/work_product_revisions.ts` | 无 |
| 创建 revisions service | `server/src/services/work-product-revisions.ts` | schema |
| 创建版本 API 路由 | `server/src/routes/work-products.ts` | service |
| 创建版本历史组件 | `ui/src/components/work-products/WorkProductVersionHistory.tsx` | 无 |
| 创建版本对比组件 | `ui/src/components/work-products/VersionDiff.tsx` | 无 |

**验收标准**:
- [ ] 可以查看版本历史
- [ ] 可以回滚到历史版本
- [ ] 显示版本差异

### 4.4 Sprint 4: 审查工作流 (1 周)

**目标**: 审查面板 + 审批流程

| 任务 | 文件 | 依赖 |
|------|------|------|
| 扩展审查状态类型 | `packages/shared/src/types/work-product.ts` | 无 |
| 实现审查 API | `server/src/routes/work-products.ts` | 无 |
| 创建审查面板组件 | `ui/src/components/work-products/WorkProductReviewPanel.tsx` | 无 |
| 创建审批按钮组件 | `ui/src/components/work-products/ReviewActions.tsx` | 无 |
| 集成通知系统 | `ui/src/components/work-products/` | 无 |

**验收标准**:
- [ ] 可以提交审查请求
- [ ] 可以批准或请求变更
- [ ] 审查状态实时更新

### 4.5 Sprint 5: 仪表板 (1 周)

**目标**: 独立产出物页面

| 任务 | 文件 | 依赖 |
|------|------|------|
| 创建 Artifacts 页面 | `ui/src/pages/Artifacts.tsx` | 无 |
| 创建 Artifacts 详情页 | `ui/src/pages/ArtifactDetail.tsx` | 无 |
| 添加路由配置 | `ui/src/App.tsx` | 页面组件 |
| 创建图表组件 | `ui/src/components/work-products/ArtifactCharts.tsx` | 无 |
| 实现过滤器 | `ui/src/components/work-products/ArtifactFilters.tsx` | 无 |

**验收标准**:
- [ ] `/artifacts` 页面显示所有产出物
- [ ] 支持按项目/Agent/时间过滤
- [ ] 显示健康状态概览

---

## 五、技术决策

### 5.1 预览技术选型

| 文件类型 | 方案 | 理由 |
|----------|------|------|
| 图片 | 原生 `<img>` | 最简单有效 |
| 代码 | Prism.js / Shiki | 高亮效果好 |
| Markdown | react-markdown | 轻量级 |
| PDF | PDF.js | 开源成熟 |
| JSON | 自定义树形视图 | 简单够用 |

### 5.2 存储决策

- 继续使用现有 S3/Local 存储系统
- 为 Artifacts 添加专用 namespace: `artifacts/`
- 预览生成使用临时存储，过期自动清理

### 5.3 性能考虑

- 图片懒加载
- 大文件分页加载
- 预览缓存 (CDN/Redis)
- 分页列表 (超过 20 项)

---

## 六、风险与依赖

### 6.1 风险

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 大文件预览性能 | 中 | 分页加载、流式传输 |
| XSS 攻击 | 高 | 内容净化、iframe 沙箱 |
| 存储成本 | 中 | 自动清理过期预览 |
| 审查冲突 | 低 | 乐观更新 + 冲突检测 |

### 6.2 依赖

| 依赖 | 用途 | 状态 |
|------|------|------|
| react-markdown | Markdown 渲染 | 已有 |
| pdf.js | PDF 预览 | 需要添加 |
| Shiki / Prism | 代码高亮 | 需要添加 |
| Drizzle ORM | 数据库 | 已有 |
| Storage Service | 文件存储 | 已有 |

---

## 七、测试计划

### 7.1 单元测试

```typescript
// ui/src/components/work-products/__tests__/WorkProductCard.test.tsx
describe("WorkProductCard", () => {
  it("displays correct type icon");
  it("shows primary indicator for primary products");
  it("handles health status colors");
});
```

### 7.2 E2E 测试

```typescript
// e2e/work-products.spec.ts
test("create and view work product", async ({ page }) => {
  await page.goto("/issues/123");
  await page.click('[aria-label="Add Work Product"]');
  await page.fill('[name="title"]', "Test Artifact");
  await page.selectOption('[name="type"]', "artifact");
  await page.click('[type="submit"]');
  await expect(page.locator(".work-product-card")).toBeVisible();
});
```

---

## 八、迭代计划

### Phase 1: MVP (4-5 周)
- Sprint 1-2 完成核心功能
- 产出物卡片和预览系统

### Phase 2: 增强 (4 周)
- Sprint 3-4 完成版本和审查
- 集成到现有工作流

### Phase 3: 完善 (2 周)
- Sprint 5 完成仪表板
- 性能优化和 bug 修复

---

## 九、参考资料

- [Vercel AI SDK - AI Artifacts](https://github.com/gonzab/claude-ai-artifacts)
- [DevOps Artifacts Best Practices](https://www.edureka.co/blog/devops-artifacts/)
- [AI Agent Work Products Best Practices 2025](https://www.getmaxim.ai/articles/accelerating-ai-agent-development-best-practices-for-fast-reliable-iteration-in-2025/)
- [Maxim AI - Agent Development](https://www.getmaxim.ai/articles/accelerating-ai-agent-development-best-practices-for-fast-reliable-iteration-in-2025/)
- [UiPath - Agent Builder Best Practices](https://www.uipath.com/blog/ai/agent-builder-best-practices)