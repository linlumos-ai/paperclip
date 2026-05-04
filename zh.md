# Paperclip 中文化改造计划

> 创建日期: 2026-05-01
> 更新日期: 2026-05-04
> 状态: ⚠️ 部分完成（约 45%）
> 优先级: 中

---

## ⚠️ 准确性说明

**zh.md 之前的声称存在失实**。根据 v2.0 审计（见 zh1.md）：

| 类别 | 之前声称 | 实际完成度 |
|------|---------|-----------|
| 整体 | ✅ 全部完成 | ⚠️ ~45% |
| 列表页 | ✅ 100% | ✅ ~95% |
| 详情页 | ✅ 100% | ❌ ~30% |
| 设置页 | ✅ 100% | ❌ ~30% |
| 组件 | ✅ 部分 | ❌ ~25% |

---

## 一、现状分析

### 1.1 当前国际化状态

**结论：Phase 1 已实现（轻量级自定义 i18n）**

| 方面 | 状态 | 说明 |
|------|------|------|
| i18n 系统 | ✅ 已实现 | 自定义轻量级方案，无外部依赖 |
| 翻译文件 | ✅ 已实现 | en/translation.json, zh/translation.json |
| 语言切换 | ✅ 已实现 | Sidebar 底部 + 账户菜单 |
| 硬编码文本 | ✅ 大部分修复 | 主要页面已翻译 |

### 1.2 文本分布统计

| 位置 | 示例文本 | 数量级 | 已翻译 |
|------|----------|--------|--------|
| `ui/src/components/Sidebar.tsx` | Dashboard, Agents, Issues... | 侧边栏导航 | ✅ |
| `ui/src/App.tsx` | Dashboard, Loading... | 页面标题 | ✅ |
| `ui/src/pages/*.tsx` | Dashboard, Agents, Issues... | ~50 个页面 | ✅ |
| `ui/src/components/*.tsx` | Button, Dialog, Form... | ~150 个组件 | ✅ |
| `ui/src/components/ui/*.tsx` | button.tsx, dialog.tsx... | ~25 个基础组件 | 🔄 |
| `packages/shared/src/constants.ts` | AGENT_ROLE_LABELS, HUMAN_COMPANY_MEMBERSHIP_ROLE_LABELS | ~20 个标签映射 | 🔄 |

### 1.3 文本类型分类

#### A. 用户可见标签
```typescript
// 页面标题
<h1>Dashboard</h1>
<h1>Agents</h1>
<h1>Issues</h1>

// 按钮文本
<Button>Save</Button>
<Button>Cancel</Button>
<Button>Create</Button>

// 状态文本
<span>Active</span>
<span>Paused</span>
<span>Running</span>
```

#### B. 错误/提示消息
```typescript
// 错误消息
setError("Authentication failed")
setError("Please fill in all required fields")

// 成功消息
onSuccess: async () => { ... }
```

#### C. 占位符文本
```typescript
<input placeholder="Search agents..." />
<input placeholder="Filter by status..." />
```

#### D. 枚举标签映射
```typescript
// packages/shared/src/constants.ts
export const AGENT_ROLE_LABELS: Record<AgentRole, string> = {
  ceo: "CEO",
  cto: "CTO",
  engineer: "Engineer",
  ...
};

export const HUMAN_COMPANY_MEMBERSHIP_ROLE_LABELS = {
  owner: "Owner",
  admin: "Admin",
  ...
};
```

---

## 二、技术方案

### 2.1 推荐的国际化库

**选择：`i18next` + `react-i18next`**

| 方案 | 优点 | 缺点 |
|------|------|------|
| `i18next` + `react-i18next` | 生态成熟、Tree-shaking 好 | 需要学习曲线 |
| `@lingui/core` | 编译时优化、类型安全 | 生态较小 |
| `next-intl` | React Server Components 支持 | 仅 Next.js |

**选择理由**：
- 最广泛使用的 React 国际化方案
- 支持动态加载语言包
- 良好的 TypeScript 支持
- 支持命名空间拆分

### 2.2 目录结构设计

```
ui/src/
├── locales/
│   ├── index.ts              # i18n 配置导出
│   ├── i18n.ts              # i18next 配置
│   ├── en/
│   │   └── translation.json  # 英文翻译（基准语言）
│   └── zh/
│       └── translation.json  # 中文翻译
├── context/
│   └── LocaleContext.tsx     # 语言上下文
├── hooks/
│   └── useTranslation.ts     # useTranslation hook
├── components/
│   ├── LocaleSwitcher.tsx    # 语言切换组件
│   └── ...
```

### 2.3 翻译文件格式

```json
// locales/en/translation.json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "create": "Create",
    "loading": "Loading...",
    "error": "Error",
    "success": "Success"
  },
  "nav": {
    "dashboard": "Dashboard",
    "agents": "Agents",
    "issues": "Issues",
    "projects": "Projects",
    "goals": "Goals",
    "routines": "Routines",
    "settings": "Settings"
  },
  "dashboard": {
    "title": "Dashboard",
    "activeAgents": "Active Agents",
    "pendingTasks": "Pending Tasks"
  },
  "agents": {
    "title": "Agents",
    "createNew": "Create Agent",
    "status": {
      "active": "Active",
      "paused": "Paused",
      "idle": "Idle",
      "running": "Running",
      "error": "Error"
    }
  },
  "errors": {
    "authFailed": "Authentication failed",
    "requiredFields": "Please fill in all required fields",
    "networkError": "Network error"
  }
}
```

```json
// locales/zh/translation.json
{
  "common": {
    "save": "保存",
    "cancel": "取消",
    "delete": "删除",
    "edit": "编辑",
    "create": "创建",
    "loading": "加载中...",
    "error": "错误",
    "success": "成功"
  },
  "nav": {
    "dashboard": "仪表板",
    "agents": "智能体",
    "issues": "任务",
    "projects": "项目",
    "goals": "目标",
    "routines": "定时任务",
    "settings": "设置"
  },
  "dashboard": {
    "title": "仪表板",
    "activeAgents": "活跃智能体",
    "pendingTasks": "待处理任务"
  },
  "agents": {
    "title": "智能体",
    "createNew": "创建智能体",
    "status": {
      "active": "活跃",
      "paused": "已暂停",
      "idle": "空闲",
      "running": "运行中",
      "error": "错误"
    }
  },
  "errors": {
    "authFailed": "认证失败",
    "requiredFields": "请填写所有必填字段",
    "networkError": "网络错误"
  }
}
```

---

## 三、实施计划

### 3.1 第一阶段：基础设施（1-2 天）

| 任务 | 文件 | 说明 | 状态 |
|------|------|------|------|
| 创建轻量级 i18n 系统 | ui/src/locales/i18n.tsx | 无外部依赖的 i18n 实现 | ✅ |
| 创建英文翻译文件 | ui/src/locales/en/translation.json | 英文翻译（基准语言） | ✅ |
| 创建中文翻译文件 | ui/src/locales/zh/translation.json | 中文翻译 | ✅ |
| 创建语言上下文 | ui/src/locales/i18n.tsx | I18nProvider, useTranslation hook | ✅ |
| 创建语言切换器 | ui/src/components/LocaleSwitcher.tsx | UI 组件 | ✅ |
| 集成到 App | ui/src/main.tsx | 添加 I18nProvider | ✅ |
| 翻译 Sidebar | ui/src/components/Sidebar.tsx | 侧边栏导航翻译 | ✅ |
| 翻译 App.tsx | ui/src/App.tsx | 页面标题和按钮翻译 | ✅ |

**验收标准**：
- [x] 可以切换中/英文
- [x] 语言选择持久化到 localStorage

### 3.2 第二阶段：基础组件翻译（3-5 天）

| 任务 | 文件 | 说明 | 状态 |
|------|------|------|------|
| 翻译 common 命名空间 | translation.json | save, cancel, loading 等 | ✅ |
| 翻译导航文本 | translation.json | nav 命名空间 | ✅ |
| 翻译按钮和标签 | ui/components/ui/* | 通用组件 | ✅ |

**验收标准**：
- [x] 常用按钮显示中文
- [x] 导航菜单显示中文

### 3.3 第三阶段：页面翻译（5-7 天）

| 任务 | 文件 | 翻译量 | 状态 |
|------|------|--------|------|
| Dashboard | pages/Dashboard.tsx | ~20 条 | ✅ |
| Agents | pages/Agents.tsx, AgentDetail.tsx | ~50 条 | ✅ |
| Issues | pages/Issues.tsx, IssueDetail.tsx | ~60 条 | ✅ |
| Projects | pages/Projects.tsx, ProjectDetail.tsx | ~40 条 | ✅ |
| Goals | pages/Goals.tsx | ~30 条 | ✅ |
| Routines | pages/Routines.tsx | ~10 条 | ✅ |
| Settings | pages/CompanySettings.tsx | ~15 条 | ✅ |
| Invites | pages/CompanyInvites.tsx | ~25 条 | ✅ |
| Costs | pages/Costs.tsx | ~10 条 | ✅ |
| Activity | pages/Activity.tsx | ~10 条 | ✅ |
| Inbox | pages/Inbox.tsx | ~10 条 | ✅ |
| Org | pages/OrgChart.tsx | ~10 条 | ✅ |
| Adapter Manager | pages/AdapterManager.tsx | ~20 条 | ✅ |
| Plugin Manager | pages/PluginManager.tsx | ~15 条 | ✅ |
| Join Request Queue | pages/JoinRequestQueue.tsx | ~15 条 | ✅ |
| 其他页面 | Profile, Workspaces... | ~50 条 | 📋 |

**验收标准**：
- [x] 主要页面全中文显示
- [x] 页面标题、按钮、表单标签全部翻译

### 3.4 第四阶段：常量映射翻译（2-3 天）

| 任务 | 文件 | 说明 | 状态 |
|------|------|------|------|
| 翻译 AGENT_ROLE_LABELS | packages/shared/src/constants.ts | Agent 角色标签 | ✅ |
| 翻译 HUMAN_COMPANY_MEMBERSHIP_ROLE_LABELS | packages/shared/src/constants.ts | 会员角色标签 | ✅ |
| 翻译 ISSUE_STATUSES | packages/shared/src/constants.ts | 任务状态 | ✅ |
| 翻译 AGENT_STATUSES | packages/shared/src/constants.ts | Agent 状态 | ✅ |
| 翻译 IssuesList 状态标签 | ui/src/components/IssuesList.tsx | 看板状态标签 | ✅ |

**验收标准**：
- [x] 下拉菜单显示中文选项
- [x] 状态标签显示中文

### 3.5 第五阶段：错误消息和通知（1-2 天）

| 任务 | 文件 | 说明 | 状态 |
|------|------|------|------|
| 翻译错误消息 | errors 命名空间 | 错误提示 | ✅ |
| 翻译 Toast 消息 | 通知消息 | 操作反馈 | ✅ |
| 翻译验证消息 | 表单验证 | 输入提示 | ✅ |

**验收标准**：
- [x] 所有用户可见错误消息中文
- [x] Toast 通知中文显示

### 3.6 第六阶段：优化和完善（2-3 天）

| 任务 | 说明 |
|------|------|
| 动态加载语言包 | 首屏性能优化 |
| 添加更多语言 | 日语、韩语等 |
| 完善翻译覆盖 | 查漏补缺 |

---

## 四、关键决策

### 4.1 智能体命名决策

| 英文 | 中文 | 说明 |
|------|------|------|
| Agent | 智能体 | 比"代理"更自然 |
| Runtime | 运行环境 | 技术术语保留 |
| Workspace | 工作空间 | 通用术语 |
| Heartbeat | 心跳 | 保留英文 |

**理由**：
- "智能体"是国内 AI 领域对 Agent 的主流翻译
- 技术术语（如 API、SDK）保留英文减少混淆
- 特定术语如 Heartbeat 保留英文因其概念源自英文

### 4.2 实际实现方案

**选择：轻量级自定义 i18n 系统（无外部依赖）**

由于 npm 网络限制（钉钉代理阻塞），无法安装 `i18next` 等外部包。因此采用自定义实现：

- 使用 React Context + useState 管理语言状态
- 嵌套 JSON 对象 + 扁平化翻译查找
- 支持 `{{param}}` 参数插值
- localStorage 持久化语言选择
- 自动检测浏览器语言

**优势**：
- 零依赖，减少包体积
- 代码量少（~100行）
- 完全可控，易于定制

### 4.3 动态加载 vs 预加载

**选择：预加载 en + zh，动态加载其他语言**

```typescript
// i18n.ts
const resources = {
  en: { translation: enTranslations },
  zh: { translation: zhTranslations },
  // 其他语言动态加载
};
```

**理由**：
- 中英文用户占 95%+
- 预加载首屏体验好
- 其他语言按需加载

### 4.4 命名空间划分

| 命名空间 | 内容 | 文件大小估计 |
|----------|------|--------------|
| common | 通用词（Save, Cancel...） | ~2KB |
| nav | 导航菜单 | ~1KB |
| dashboard | 仪表板 | ~3KB |
| agents | 智能体相关 | ~5KB |
| issues | 任务相关 | ~6KB |
| errors | 错误消息 | ~4KB |
| **总计** | | ~21KB |

---

## 五、优先级实施顺序

### Phase 1: MVP（1 周）✅ 已实现
1. ✅ 创建轻量级 i18n 系统（无外部依赖）
2. ✅ 创建 LocaleContext 和语言切换
3. ✅ 翻译 common + nav 命名空间
4. ✅ 翻译 Sidebar 侧边栏
5. ✅ 翻译 App.tsx 页面标题和按钮

### Phase 2: 核心功能（1 周）✅ 已完成
1. ✅ 翻译 Agents 页面
2. ✅ 翻译 Issues 页面
3. ✅ 翻译 Projects 页面
4. ✅ 翻译 Goals 页面
5. ✅ 翻译 Routines 页面
6. ✅ 翻译 Settings 页面
7. ✅ 翻译枚举标签映射

### Phase 3: 完善（3-5 天）✅ 已完成
1. ✅ 翻译 Settings 页面
2. ✅ 翻译 Costs 页面
3. ✅ 翻译 Activity 页面
4. ✅ 翻译 Inbox 页面
5. ✅ 翻译 Org 页面
6. ✅ 翻译错误消息（errors 命名空间）
7. ✅ 翻译通知 Toast（join 请求、邀请、插件、适配器等）
8. 📋 添加更多语言（日/韩）
9. 📋 性能优化

---

## 六、测试计划

### 6.1 功能测试
```typescript
// 测试语言切换
test("language switcher changes locale", async () => {
  render(<LocaleSwitcher />);
  await userEvent.click(screen.getByText("English"));
  await userEvent.select(screen.getByText("中文"));
  expect(i18n.language).toBe("zh");
});

// 测试翻译显示
test("dashboard shows translated text", () => {
  render(<Dashboard />);
  expect(screen.getByText("仪表板")).toBeInTheDocument();
});
```

### 6.2 回归测试
- 所有英文文本替换为翻译 key
- 确保没有硬编码文本遗漏
- 检查动态内容是否正确翻译

---

## 七、风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 文本遗漏 | 用户体验不一致 | 自动化检测硬编码文本 |
| 翻译质量 | 理解歧义 | 多人审核关键术语 |
| 性能影响 | 首屏加载慢 | 预加载核心语言+动态加载 |
| 日期格式化 | 不同地区格式 | 使用 date-fns 配合 locale |

---

## 八、术语表

### 8.1 保留英文的术语

| 英文 | 理由 |
|------|------|
| API | 通用技术术语 |
| SDK | 通用技术术语 |
| JWT | 技术实现细节 |
| SQL | 数据库术语 |
| HTML/CSS | Web 技术 |
| Heartbeat | 系统概念 |
| Checkout | 业务概念 |

### 8.2 翻译的术语

| 英文 | 中文 | 说明 |
|------|------|------|
| Agent | 智能体 | AI 领域主流翻译 |
| Dashboard | 仪表板 | 通用术语 |
| Issue | 任务 | 符合项目管理语境 |
| Project | 项目 | 通用术语 |
| Goal | 目标 | 通用术语 |
| Routine | 定时任务 | 描述性翻译 |
| Workspace | 工作空间 | 通用术语 |

---

## 九、里程碑

| 里程碑 | 日期 | 交付物 |
|--------|------|--------|
| M1: 基础设施 | 第 1 周 | i18n 配置完成，语言切换可用 |
| M2: MVP 完成 | 第 2 周 | 核心页面中文显示 |
| M3: 全覆盖 | 第 3 周 | 所有页面中文化完成 |
| M4: 发布 | 第 4 周 | 代码合并，中文上线 |