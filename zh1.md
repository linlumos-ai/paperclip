# Paperclip i18n 实施情况审计报告 v1.1

> 审计日期: 2026-05-03
> 审计范围: ui/src/pages/*.tsx, ui/src/components/*.tsx, ui/src/locales/
> 状态: **部分完成 - 存在大量未翻译内容**

---

## ⚠️ 重要更正

**之前的报告存在错误**。经过验证：
- `en/translation.json` 内容正确（英文）
- `zh/translation.json` 内容正确（中文）
- i18n 系统工作正常
- 中英文切换功能正常

---

## 一、翻译覆盖情况总结

### 1.1 页面完成度

| 页面 | 完成度 | 说明 |
|------|--------|------|
| Dashboard | 70% | 大部分完成，部分 EmptyState 硬编码 |
| Agents | 85% | 大部分完成 |
| Issues | 85% | 大部分完成 |
| Projects | 50% | 部分完成 |
| Goals | 60% | 部分完成 |
| Routines | 50% | 部分完成 |
| Settings | 60% | 部分完成 |
| Company Settings | 30% | 大量硬编码 |
| Company Access | 30% | 大量硬编码 |
| Agent Detail | 40% | 大量硬编码 |
| Issue Detail | 40% | 大量硬编码 |

### 1.2 组件完成度

| 组件 | 完成度 | 说明 |
|------|--------|------|
| Sidebar | 90% | 大部分完成 |
| IssueColumns | 95% | 基本完成 |
| IssuesList | 95% | 基本完成 |
| EmptyState | 50% | 部分完成 |
| LocaleSwitcher | 80% | 部分完成 |

---

## 二、缺失翻译详细清单

### 2.1 高优先级（用户频繁接触）

| 类型 | 数量 | 位置 |
|------|------|------|
| EmptyState 消息 | ~25 | 各页面底部空状态 |
| setError 错误消息 | ~40 | 各页面的错误处理 |
| setActionError 消息 | ~20 | 操作失败提示 |
| placeholder 文本 | ~50 | 表单输入框 |

### 2.2 中优先级（重要但使用较少）

| 类型 | 数量 | 位置 |
|------|------|------|
| Tooltip 文本 | ~30 | 按钮、图标的悬停提示 |
| aria-label | ~60 | 无障碍访问标签 |
| Badge 内容 | ~20 | 状态徽章 |
| PropertyRow label | ~30 | 详情页属性标签 |

### 2.3 低优先级（边缘情况）

| 类型 | 数量 | 位置 |
|------|------|------|
| Field label | ~40 | 表单字段标签 |
| 表头文本 | ~20 | 表格列标题 |
| 加载状态 | ~10 | Loading 文本 |

---

## 三、实施计划

### Phase 1: 核心功能（P0）
**预计时间**: 1-2 天

| 任务 | 文件 | 说明 |
|------|------|------|
| EmptyState 翻译 | ui/src/components/EmptyState.tsx | 统一空状态组件 |
| 错误消息翻译 | 各页面的 setError/setActionError | 错误提示国际化 |
| 占位符翻译 | 表单组件 | input placeholder |

### Phase 2: 详情页（P1）
**预计时间**: 2-3 天

| 任务 | 文件 |
|------|------|
| Agent 详情页 | ui/src/pages/AgentDetail.tsx |
| Issue 详情页 | ui/src/pages/IssueDetail.tsx |
| Project 详情页 | ui/src/pages/ProjectDetail.tsx |
| Goal 详情页 | ui/src/pages/GoalDetail.tsx |

### Phase 3: 设置页面（P2）
**预计时间**: 2-3 天

| 任务 | 文件 |
|------|------|
| Company Settings | ui/src/pages/CompanySettings.tsx |
| Company Access | ui/src/pages/CompanyAccess.tsx |
| Instance Settings | ui/src/pages/InstanceSettings.tsx |

### Phase 4: 完善（P3）
**预计时间**: 1-2 天

| 任务 | 说明 |
|------|------|
| aria-label | 无障碍访问标签 |
| Tooltip | 工具提示文本 |
| Badge 内容 | 状态徽章内容 |

---

## 四、翻译 key 命名规范

```
{页面/组件}.{类型}.{具体内容}

示例:
- emptyState.noAgents: "暂无智能体"
- emptyState.noIssues: "暂无任务"
- error.authFailed: "认证失败"
- error.networkError: "网络错误"
- placeholder.searchAgents: "搜索智能体..."
- tooltip.archiveIssue: "归档任务"
- label.createdAt: "创建时间"
- label.updatedAt: "更新时间"
```

---

## 五、验收标准

- [ ] 所有 EmptyState 组件使用 `t()` 翻译
- [ ] 所有错误消息使用 `t()` 翻译
- [ ] 所有 placeholder 使用 `t()` 翻译
- [ ] 所有 Tooltip 使用 `t()` 翻译
- [ ] 中英文切换流畅，无闪烁
- [ ] 无硬编码文本遗漏

---

**报告完成**