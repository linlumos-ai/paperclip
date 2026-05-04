# Paperclip i18n 审计报告 v2.0

> 审计日期: 2026-05-04
> 更新日期: 2026-05-04
> 审计范围: ui/src/pages/*.tsx, ui/src/components/*.tsx, ui/src/locales/
> 状态: **部分完成 - 实际约 50%** (正在推进)

---

## 一、翻译文件分析

### 1.1 文件结构对比

| 指标 | EN | ZH | 状态 |
|------|----|----|------|
| Key 总数 | 389 | 389 | ✅ 一致 |
| Namespace 数 | 21 | 21 | ✅ 一致 |
| 空值 | 0 | 0 | ✅ 良好 |
| 结构差异 | 0 | 0 | ✅ 完整 |

**结论**: 翻译文件结构完整，key 完全对应，可以正常使用。

### 1.2 Namespace 详细统计

| Namespace | Key 数量 | 完成度 |
|-----------|----------|--------|
| common | 46 | ✅ 完整 |
| nav | 13 | ✅ 完整 |
| dashboard | 34 | ✅ 完整 |
| agents | 40 | ✅ 完整 |
| issues | 31 | ✅ 完整 |
| projects | 14 | ✅ 完整 |
| goals | 9 | ✅ 完整 |
| routines | 9 | ✅ 完整 |
| costs | 9 | ✅ 完整 |
| activity | 8 | ✅ 完整 |
| inbox | 6 | ✅ 完整 |
| toast | 34 | ✅ 完整 |
| errors | 9 | ✅ 完整 |
| adapterManager | 44 | ✅ 完整 |
| companyInvites | 28 | ✅ 完整 |
| joinRequestQueue | 20 | ✅ 完整 |
| approvals | 6 | ✅ 完整 |
| company | 11 | ✅ 完整 |
| instance | 7 | ✅ 完整 |
| onboarding | 7 | ✅ 完整 |
| membership | 4 | ✅ 完整 |

---

## 二、页面文件 i18n 分析

### 2.1 完成度排名（按 t() 调用次数）

| 排名 | 文件 | t()次数 | 硬编码 | 完成度 |
|------|------|---------|--------|--------|
| 1 | AdapterManager.tsx | 51 | 0 | 100% |
| 2 | Dashboard.tsx | 35 | 0 | 100% |
| 3 | CompanyInvites.tsx | 25 | 2 | 93% |
| 4 | JoinRequestQueue.tsx | 22 | 1 | 96% |
| 5 | Agents.tsx | 17 | 0 | 100% |
| 6 | Sidebar (组件) | 15 | 0 | 100% |
| 7 | Issues.tsx | 8 | 0 | 100% |
| 8 | IssuesList (组件) | 7 | 0 | 100% |
| 9 | AgentDetail.tsx | 7 | 63 | 10% |
| 9 | IssueDetail.tsx | 7 | 23 | 23% |
| 11 | ProjectDetail.tsx | 6 | 4 | 60% |
| 12 | CompanyExport.tsx | 6 | 1 | 86% |
| 13 | Goals.tsx | 5 | 0 | 100% |
| 13 | Projects.tsx | 5 | 0 | 100% |
| 15 | CompanySettings.tsx | 5 | 4 | 56% |
| 16 | CompanySkills.tsx | 5 | 13 | 28% |
| 17 | Routines.tsx | 4 | 12 | 25% |
| 18 | Activity.tsx | 4 | 0 | 100% |
| 19 | CompanyImport.tsx | 4 | 7 | 36% |
| 20 | Inbox.tsx | 5 | 10 | 33% |

### 2.2 完全未翻译的页面（0 t() 调用）

| 文件 | 硬编码数 | 主要内容 |
|------|----------|----------|
| DesignGuide.tsx | 104 | UI 设计指南 |
| InviteUxLab.tsx | 38 | 邀请 UX 实验 |
| Costs.tsx | 29 | 成本页面 |
| PluginSettings.tsx | 27 | 插件设置 |
| InviteLanding.tsx | 24 | 邀请落地页 |
| CompanyAccess.tsx | 22 | 公司访问控制 |
| RoutineDetail.tsx | 21 | 定时任务详情 |
| PluginManager.tsx | 21 | 插件管理 |
| CompanyEnvironments.tsx | 15 | 公司环境 |
| ExecutionWorkspaceDetail.tsx | 18 | 执行工作空间 |
| InstanceGeneralSettings.tsx | 12 | 实例通用设置 |
| CompanyImport.tsx | 7 | 公司导入 |
| ProjectWorkspaceDetail.tsx | 7 | 项目工作空间 |
| InstanceExperimentalSettings.tsx | 7 | 实验设置 |
| InstanceSettings.tsx | 4 | 实例设置 |
| ProfileSettings.tsx | 4 | 个人设置 |
| UserProfile.tsx | 9 | 用户资料 |
| Companies.tsx | 2 | 公司列表 |
| Workspaces.tsx | 2 | 工作空间列表 |
| Org.tsx | 0 | 组织页面 |
| MyIssues.tsx | 0 | 我的任务 |
| NotFound.tsx | 1 | 404 页面 |

### 2.3 zh.md 声称 vs 实际对比

| 页面 | zh.md 声称 | 实际完成度 | 差异 |
|------|-----------|------------|------|
| Dashboard | ✅ 100% | 100% | ✅ 正确 |
| Agents | ✅ 100% | 100% | ✅ 正确 |
| Issues | ✅ 100% | 100% | ✅ 正确 |
| Projects | ✅ 100% | 100% | ✅ 正确 |
| Goals | ✅ 100% | 100% | ✅ 正确 |
| Routines | ✅ 100% | 25% | ❌ 多报 75% |
| Settings | ✅ 100% | 56% | ❌ 多报 44% |
| Costs | ✅ 100% | 7% | ❌ 多报 93% |
| Activity | ✅ 100% | 100% | ✅ 正确 |
| Inbox | ✅ 100% | 33% | ❌ 多报 67% |
| Org | ✅ 100% | 0% | ❌ 多报 100% |
| Adapter Manager | ✅ 100% | 100% | ✅ 正确 |
| Plugin Manager | ✅ 100% | 28% | ❌ 多报 72% |
| Join Request Queue | ✅ 100% | 96% | ✅ 正确 |

---

## 三、组件 i18n 分析

### 3.1 完成度排名

| 组件 | t()次数 | title | aria-label | 完成度 |
|------|---------|-------|-----------|--------|
| NewIssueDialog.tsx | 10 | 3 | 1 | 85% |
| RunTranscriptView.tsx | 8 | 0 | 0 | 100% |
| IssuesList.tsx | 7 | 6 | 3 | 88% |
| Sidebar.tsx | 15 | 0 | 0 | 100% |
| DocumentDiffModal.tsx | 2 | 0 | 0 | 100% |
| NewProjectDialog.tsx | 2 | 0 | 0 | 100% |
| PackageFileTree.tsx | 2 | 0 | 0 | 100% |
| CompanyPatternIcon.tsx | 2 | 0 | 0 | 100% |
| MarkdownBody.tsx | 3 | 0 | 1 | 75% |
| CopyText.tsx | 1 | 0 | 0 | 100% |
| MarkdownEditor.tsx | 1 | 0 | 0 | 100% |
| InlineEditor.tsx | 1 | 0 | 0 | 100% |
| IssueDocumentsSection.tsx | 1 | 1 | 0 | 50% |
| AgentConfigForm.tsx | 1 | 1 | 0 | 50% |
| RoutineVariablesEditor.tsx | 1 | 0 | 1 | 50% |
| CommentThread.tsx | 1 | 1 | 1 | 33% |
| EnvVarEditor.tsx | 1 | 2 | 0 | 33% |

### 3.2 完全未翻译的组件

共 **85 个组件**完全没有使用 `t()` 翻译函数。

主要组件：
- EmptyState.tsx - 空状态提示
- StatusBadge.tsx - 状态徽章
- IssueProperties.tsx - 任务属性
- AgentProperties.tsx - 智能体属性
- GoalProperties.tsx - 目标属性
- ProjectProperties.tsx - 项目属性
- ScheduleEditor.tsx - 调度编辑器
- IssueChatThread.tsx - 任务对话
- ImageGalleryModal.tsx - 图片画廊

---

## 四、zh.md 准确性总结

### 4.1 声称 vs 实际

| 类别 | zh.md 声称 | 实际 | 准确性 |
|------|-----------|------|--------|
| 基础设施 | ✅ 完成 | ✅ 完成 | ✅ 正确 |
| i18n 系统 | ✅ 完成 | ✅ 完成 | ✅ 正确 |
| 翻译文件 | ✅ 完成 | ✅ 完成 | ✅ 正确 |
| 页面翻译 | ✅ 100% | ~55% | ❌ **严重失实** |
| 组件翻译 | ✅ 部分 | ~25% | ❌ 失实 |

### 4.2 实际完成度

| 模块 | 完成度 | 未翻译数量 |
|------|--------|------------|
| 列表页（Dashboard/Agents/Issues） | 95% | ~5 |
| 详情页（Detail） | 30% | ~100 |
| 设置页 | 30% | ~150 |
| 组件 | 25% | ~200 |
| **总计** | **~45%** | **~500** |

---

## 五、实施计划 v2.0

### Phase 1: 高优先级（用户频繁接触）

| 任务 | 文件 | 工作量 | 优先级 |
|------|------|--------|--------|
| EmptyState 翻译 | ui/src/components/EmptyState.tsx | 小 | P0 |
| 错误消息翻译 | 各页面 setError/setActionError | 中 | P0 |
| placeholder 翻译 | 表单组件 | 中 | P0 |
| StatusBadge 翻译 | ui/src/components/StatusBadge.tsx | 小 | P0 |

### Phase 2: 中优先级（详情页）

| 任务 | 文件 | 工作量 |
|------|------|--------|
| AgentDetail 翻译 | ui/src/pages/AgentDetail.tsx | 大 |
| IssueDetail 翻译 | ui/src/pages/IssueDetail.tsx | 中 |
| RoutineDetail 翻译 | ui/src/pages/RoutineDetail.tsx | 中 |
| ProjectDetail 翻译 | ui/src/pages/ProjectDetail.tsx | 中 |

### Phase 3: 低优先级（设置页）

| 任务 | 文件 | 工作量 |
|------|------|--------|
| CompanySettings 翻译 | ui/src/pages/CompanySettings.tsx | 中 |
| CompanyAccess 翻译 | ui/src/pages/CompanyAccess.tsx | 中 |
| Costs 翻译 | ui/src/pages/Costs.tsx | 中 |
| PluginSettings 翻译 | ui/src/pages/PluginSettings.tsx | 大 |

### Phase 4: 完善

| 任务 | 说明 |
|------|------|
| aria-label | 无障碍标签 |
| title 属性 | 悬停提示 |
| Tooltip | 工具提示 |

---

## 六、具体任务清单

### 6.1 P0 - 紧急

- [x] EmptyState.tsx - 添加空状态翻译 key ✅ 2026-05-04
- [ ] 各页面的 setError 错误消息国际化
- [ ] 表单 placeholder 翻译
- [x] StatusBadge 状态翻译 ✅ 2026-05-04
- [x] LocaleSwitcher 'Language' 文本翻译 ✅ 2026-05-04

### 6.2 P1 - 高

- [ ] AgentDetail.tsx - 63 处硬编码翻译
- [ ] IssueDetail.tsx - 23 处硬编码翻译
- [ ] RoutineDetail.tsx - 21 处硬编码翻译
- [ ] Costs.tsx - 29 处硬编码翻译

### 6.3 P2 - 中

- [ ] CompanyAccess.tsx - 22 处硬编码翻译
- [ ] PluginManager.tsx - 21 处硬编码翻译
- [ ] PluginSettings.tsx - 27 处硬编码翻译
- [ ] CompanyEnvironments.tsx - 15 处硬编码翻译

### 6.4 P3 - 低

- [ ] CompanyImport.tsx
- [ ] CompanyExport.tsx
- [ ] InstanceGeneralSettings.tsx
- [ ] InstanceExperimentalSettings.tsx
- [ ] Org.tsx
- [ ] DesignGuide.tsx (104 处)

---

## 七、验收标准

- [ ] 所有页面 t() 调用率 > 80%
- [ ] 所有组件 t() 调用率 > 50%
- [ ] 无用户可见的硬编码英文文本
- [ ] 中英文切换流畅
- [ ] zh.md 更新为准确状态

---

## 八、实现记录 (2026-05-04)

### 已完成的改进

| 功能 | 文件 | 状态 | 日期 |
|------|------|------|------|
| EmptyState 空状态翻译 | ui/src/components/EmptyState.tsx | ✅ | 2026-05-04 |
| StatusBadge 状态翻译 | ui/src/components/StatusBadge.tsx | ✅ | 2026-05-04 |
| LocaleSwitcher 文本翻译 | ui/src/components/LocaleSwitcher.tsx | ✅ | 2026-05-04 |
| 新增 common 状态 key | ui/src/locales/*/translation.json | ✅ | 2026-05-04 |

### 新增翻译 key

```json
{
  "common": {
    "archived": "Archived / 已归档",
    "draft": "Draft / 草稿",
    "on": "On / 开启",
    "off": "Off / 关闭",
    "running": "Running / 运行中",
    "idle": "Idle / 空闲",
    "offline": "Offline / 离线",
    "language": "Language / 语言",
    "switchLanguage": "Switch language / 切换语言"
  },
  "emptyState": {
    "noItems": "No items / 暂无内容",
    "createFirst": "Create your first {{item}}... / 创建你的第一个...",
    "noResults": "No results match your search. / 没有匹配的搜索结果。"
  }
}
```

### 修改的组件

1. **EmptyState.tsx**: 支持 `messageKey` 和 `actionKey` 参数，自动使用 `t()` 翻译
2. **StatusBadge.tsx**: 自动尝试翻译状态值，支持 common 和 agents.status 命名空间
3. **LocaleSwitcher.tsx**: 使用 `t("common.language")` 和 `t("common.switchLanguage")`

---

**报告完成**