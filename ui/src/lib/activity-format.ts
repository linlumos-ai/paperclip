import type { Agent } from "@paperclipai/shared";
import type { CompanyUserProfile } from "./company-members";

type ActivityDetails = Record<string, unknown> | null | undefined;

type ActivityParticipant = {
  type: "agent" | "user";
  agentId?: string | null;
  userId?: string | null;
};

type ActivityIssueReference = {
  id?: string | null;
  identifier?: string | null;
  title?: string | null;
};

type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

interface ActivityFormatOptions {
  agentMap?: Map<string, Agent>;
  userProfileMap?: Map<string, CompanyUserProfile>;
  currentUserId?: string | null;
  t?: TranslateFn;
}

/** Map from action key to translation key suffix (dots replaced with underscores) */
const ACTIVITY_VERB_KEY_MAP: Record<string, string> = {
  "issue.created": "activity.verbs.issue_created",
  "issue.updated": "activity.verbs.issue_updated",
  "issue.checked_out": "activity.verbs.issue_checked_out",
  "issue.released": "activity.verbs.issue_released",
  "issue.comment_added": "activity.verbs.issue_comment_added",
  "issue.comment_cancelled": "activity.verbs.issue_comment_cancelled",
  "issue.attachment_added": "activity.verbs.issue_attachment_added",
  "issue.attachment_removed": "activity.verbs.issue_attachment_removed",
  "issue.document_created": "activity.verbs.issue_document_created",
  "issue.document_updated": "activity.verbs.issue_document_updated",
  "issue.document_deleted": "activity.verbs.issue_document_deleted",
  "issue.commented": "activity.verbs.issue_commented",
  "issue.deleted": "activity.verbs.issue_deleted",
  "agent.created": "activity.verbs.agent_created",
  "agent.updated": "activity.verbs.agent_updated",
  "agent.paused": "activity.verbs.agent_paused",
  "agent.resumed": "activity.verbs.agent_resumed",
  "agent.terminated": "activity.verbs.agent_terminated",
  "agent.key_created": "activity.verbs.agent_key_created",
  "agent.budget_updated": "activity.verbs.agent_budget_updated",
  "agent.runtime_session_reset": "activity.verbs.agent_runtime_session_reset",
  "heartbeat.invoked": "activity.verbs.heartbeat_invoked",
  "heartbeat.cancelled": "activity.verbs.heartbeat_cancelled",
  "approval.created": "activity.verbs.approval_created",
  "approval.approved": "activity.verbs.approval_approved",
  "approval.rejected": "activity.verbs.approval_rejected",
  "project.created": "activity.verbs.project_created",
  "project.updated": "activity.verbs.project_updated",
  "project.deleted": "activity.verbs.project_deleted",
  "goal.created": "activity.verbs.goal_created",
  "goal.updated": "activity.verbs.goal_updated",
  "goal.deleted": "activity.verbs.goal_deleted",
  "cost.reported": "activity.verbs.cost_reported",
  "cost.recorded": "activity.verbs.cost_recorded",
  "company.created": "activity.verbs.company_created",
  "company.updated": "activity.verbs.company_updated",
  "company.archived": "activity.verbs.company_archived",
  "company.budget_updated": "activity.verbs.company_budget_updated",
  "issue.read_marked": "activity.verbs.issue_read_marked",
  "environment.lease_released": "activity.verbs.environment_lease_released",
};

const ISSUE_ACTIVITY_KEY_MAP: Record<string, string> = {
  "issue.created": "activity.labels.issue_created",
  "issue.updated": "activity.labels.issue_updated",
  "issue.checked_out": "activity.labels.issue_checked_out",
  "issue.released": "activity.labels.issue_released",
  "issue.comment_added": "activity.labels.issue_comment_added",
  "issue.comment_cancelled": "activity.labels.issue_comment_cancelled",
  "issue.feedback_vote_saved": "activity.labels.issue_feedback_vote_saved",
  "issue.attachment_added": "activity.labels.issue_attachment_added",
  "issue.attachment_removed": "activity.labels.issue_attachment_removed",
  "issue.document_created": "activity.labels.issue_document_created",
  "issue.document_updated": "activity.labels.issue_document_updated",
  "issue.document_deleted": "activity.labels.issue_document_deleted",
  "issue.deleted": "activity.labels.issue_deleted",
  "agent.created": "activity.labels.agent_created",
  "agent.updated": "activity.labels.agent_updated",
  "agent.paused": "activity.labels.agent_paused",
  "agent.resumed": "activity.labels.agent_resumed",
  "agent.terminated": "activity.labels.agent_terminated",
  "heartbeat.invoked": "activity.labels.heartbeat_invoked",
  "heartbeat.cancelled": "activity.labels.heartbeat_cancelled",
  "approval.created": "activity.labels.approval_created",
  "approval.approved": "activity.labels.approval_approved",
  "approval.rejected": "activity.labels.approval_rejected",
};

/** Fallback English verbs for when no t function is provided (e.g. tests) */
const ACTIVITY_ROW_VERBS: Record<string, string> = {
  "issue.created": "created",
  "issue.updated": "updated",
  "issue.checked_out": "checked out",
  "issue.released": "released",
  "issue.comment_added": "commented on",
  "issue.comment_cancelled": "cancelled a queued comment on",
  "issue.attachment_added": "attached file to",
  "issue.attachment_removed": "removed attachment from",
  "issue.document_created": "created document for",
  "issue.document_updated": "updated document on",
  "issue.document_deleted": "deleted document from",
  "issue.commented": "commented on",
  "issue.deleted": "deleted",
  "agent.created": "created",
  "agent.updated": "updated",
  "agent.paused": "paused",
  "agent.resumed": "resumed",
  "agent.terminated": "terminated",
  "agent.key_created": "created API key for",
  "agent.budget_updated": "updated budget for",
  "agent.runtime_session_reset": "reset session for",
  "heartbeat.invoked": "invoked heartbeat for",
  "heartbeat.cancelled": "cancelled heartbeat for",
  "approval.created": "requested approval",
  "approval.approved": "approved",
  "approval.rejected": "rejected",
  "project.created": "created",
  "project.updated": "updated",
  "project.deleted": "deleted",
  "goal.created": "created",
  "goal.updated": "updated",
  "goal.deleted": "deleted",
  "cost.reported": "reported cost for",
  "cost.recorded": "recorded cost for",
  "company.created": "created company",
  "company.updated": "updated company",
  "company.archived": "archived",
  "company.budget_updated": "updated budget for",
  "issue.read_marked": "read marked",
  "environment.lease_released": "released environment lease",
};

const ISSUE_ACTIVITY_LABELS: Record<string, string> = {
  "issue.created": "created the issue",
  "issue.updated": "updated the issue",
  "issue.checked_out": "checked out the issue",
  "issue.released": "released the issue",
  "issue.comment_added": "added a comment",
  "issue.comment_cancelled": "cancelled a queued comment",
  "issue.feedback_vote_saved": "saved feedback on an AI output",
  "issue.attachment_added": "added an attachment",
  "issue.attachment_removed": "removed an attachment",
  "issue.document_created": "created a document",
  "issue.document_updated": "updated a document",
  "issue.document_deleted": "deleted a document",
  "issue.deleted": "deleted the issue",
  "agent.created": "created an agent",
  "agent.updated": "updated the agent",
  "agent.paused": "paused the agent",
  "agent.resumed": "resumed the agent",
  "agent.terminated": "terminated the agent",
  "heartbeat.invoked": "invoked a heartbeat",
  "heartbeat.cancelled": "cancelled a heartbeat",
  "approval.created": "requested approval",
  "approval.approved": "approved",
  "approval.rejected": "rejected",
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function humanizeValue(value: unknown): string {
  if (typeof value !== "string") return String(value ?? "none");
  return value.replace(/_/g, " ");
}

/** Known status values that should be translated */
const TRANSLATABLE_STATUSES = new Set(["backlog", "todo", "in_progress", "in_review", "done", "blocked", "cancelled"]);

function humanizeAndTranslateValue(value: unknown, t?: TranslateFn): string {
  if (typeof value !== "string") return String(value ?? "none");
  if (TRANSLATABLE_STATUSES.has(value) && t) {
    const key = `common.statuses.${value}`;
    const translated = t(key);
    if (translated !== key) return translated;
  }
  return value.replace(/_/g, " ");
}

function isActivityParticipant(value: unknown): value is ActivityParticipant {
  const record = asRecord(value);
  if (!record) return false;
  return record.type === "agent" || record.type === "user";
}

function isActivityIssueReference(value: unknown): value is ActivityIssueReference {
  return asRecord(value) !== null;
}

function readParticipants(details: ActivityDetails, key: string): ActivityParticipant[] {
  const value = details?.[key];
  if (!Array.isArray(value)) return [];
  return value.filter(isActivityParticipant);
}

function readIssueReferences(details: ActivityDetails, key: string): ActivityIssueReference[] {
  const value = details?.[key];
  if (!Array.isArray(value)) return [];
  return value.filter(isActivityIssueReference);
}

function formatUserLabel(userId: string | null | undefined, options: ActivityFormatOptions = {}): string {
  if (!userId || userId === "local-board") return options.t?.("activity.board") ?? "Board";
  if (options.currentUserId && userId === options.currentUserId) return options.t?.("activity.you") ?? "You";
  const profile = options.userProfileMap?.get(userId);
  if (profile) return profile.label;
  return `${options.t?.("activity.user") ?? "user"} ${userId.slice(0, 5)}`;
}

function formatParticipantLabel(participant: ActivityParticipant, options: ActivityFormatOptions): string {
  if (participant.type === "agent") {
    const agentId = participant.agentId ?? "";
    return options.agentMap?.get(agentId)?.name ?? (options.t?.("activity.agent") ?? "agent");
  }
  return formatUserLabel(participant.userId, options);
}

function formatIssueReferenceLabel(reference: ActivityIssueReference): string {
  if (reference.identifier) return reference.identifier;
  if (reference.title) return reference.title;
  if (reference.id) return reference.id.slice(0, 8);
  return "issue";
}

function formatChangedEntityLabel(
  singular: string,
  plural: string,
  labels: string[],
): string {
  if (labels.length <= 0) return plural;
  if (labels.length === 1) return `${singular} ${labels[0]}`;
  return `${labels.length} ${plural}`;
}

function formatIssueUpdatedVerb(details: ActivityDetails, t?: TranslateFn): string | null {
  if (!details) return null;
  const previous = asRecord(details._previous) ?? {};
  if (details.status !== undefined) {
    const from = previous.status;
    return from
      ? (t?.("activity.changedStatusFrom", { from: humanizeAndTranslateValue(from, t), to: humanizeAndTranslateValue(details.status, t) }) ?? `changed status from ${humanizeValue(from)} to ${humanizeValue(details.status)} on`)
      : (t?.("activity.changedStatusTo", { to: humanizeAndTranslateValue(details.status, t) }) ?? `changed status to ${humanizeValue(details.status)} on`);
  }
  if (details.priority !== undefined) {
    const from = previous.priority;
    return from
      ? (t?.("activity.changedPriorityFrom", { from: humanizeValue(from), to: humanizeValue(details.priority) }) ?? `changed priority from ${humanizeValue(from)} to ${humanizeValue(details.priority)} on`)
      : (t?.("activity.changedPriorityTo", { to: humanizeValue(details.priority) }) ?? `changed priority to ${humanizeValue(details.priority)} on`);
  }
  return null;
}

function formatAssigneeName(details: ActivityDetails, options: ActivityFormatOptions): string | null {
  if (!details) return null;
  const agentId = details.assigneeAgentId;
  const userId = details.assigneeUserId;
  if (typeof agentId === "string" && agentId) {
    return options.agentMap?.get(agentId)?.name ?? (options.t?.("activity.agent") ?? "agent");
  }
  if (typeof userId === "string" && userId) {
    return formatUserLabel(userId, options);
  }
  return null;
}

function formatIssueUpdatedAction(details: ActivityDetails, options: ActivityFormatOptions = {}): string | null {
  if (!details) return null;
  const previous = asRecord(details._previous) ?? {};
  const t = options.t;
  const parts: string[] = [];

  if (details.status !== undefined) {
    const from = previous.status;
    parts.push(
      from
        ? (t?.("activity.changedTheStatusFrom", { from: humanizeAndTranslateValue(from, t), to: humanizeAndTranslateValue(details.status, t) }) ?? `changed the status from ${humanizeValue(from)} to ${humanizeValue(details.status)}`)
        : (t?.("activity.changedTheStatusTo", { to: humanizeAndTranslateValue(details.status, t) }) ?? `changed the status to ${humanizeValue(details.status)}`),
    );
  }
  if (details.priority !== undefined) {
    const from = previous.priority;
    parts.push(
      from
        ? (t?.("activity.changedThePriorityFrom", { from: humanizeValue(from), to: humanizeValue(details.priority) }) ?? `changed the priority from ${humanizeValue(from)} to ${humanizeValue(details.priority)}`)
        : (t?.("activity.changedThePriorityTo", { to: humanizeValue(details.priority) }) ?? `changed the priority to ${humanizeValue(details.priority)}`),
    );
  }
  if (details.assigneeAgentId !== undefined || details.assigneeUserId !== undefined) {
    const assigneeName = formatAssigneeName(details, options);
    parts.push(assigneeName ? (t?.("activity.assignedTo", { name: assigneeName }) ?? `assigned the issue to ${assigneeName}`) : (t?.("activity.unassigned") ?? "unassigned the issue"));
  }
  if (details.title !== undefined) parts.push(t?.("activity.updatedTitle") ?? "updated the title");
  if (details.description !== undefined) parts.push(t?.("activity.updatedDescription") ?? "updated the description");

  return parts.length > 0 ? parts.join(", ") : null;
}

function formatStructuredIssueChange(input: {
  action: string;
  details: ActivityDetails;
  options: ActivityFormatOptions;
  forIssueDetail: boolean;
}): string | null {
  const details = input.details;
  if (!details) return null;
  const t = input.options.t;

  if (input.action === "issue.blockers_updated") {
    const added = readIssueReferences(details, "addedBlockedByIssues").map(formatIssueReferenceLabel);
    const removed = readIssueReferences(details, "removedBlockedByIssues").map(formatIssueReferenceLabel);
    const blocker = t?.("activity.blocker") ?? "blocker";
    const blockers = t?.("activity.blockers") ?? "blockers";
    if (added.length > 0 && removed.length === 0) {
      const changed = formatChangedEntityLabel(blocker, blockers, added);
      const addedText = t?.("activity.added") ?? "added";
      return input.forIssueDetail ? `${addedText} ${changed}` : `${addedText} ${changed} to`;
    }
    if (removed.length > 0 && added.length === 0) {
      const changed = formatChangedEntityLabel(blocker, blockers, removed);
      const removedText = t?.("activity.removed") ?? "removed";
      return input.forIssueDetail ? `${removedText} ${changed}` : `${removedText} ${changed} from`;
    }
    const updatedBlockers = t?.("activity.updatedBlockers") ?? "updated blockers";
    return input.forIssueDetail ? updatedBlockers : (t?.("activity.updatedBlockersOn") ?? "updated blockers on");
  }

  if (input.action === "issue.reviewers_updated" || input.action === "issue.approvers_updated") {
    const added = readParticipants(details, "addedParticipants").map((participant) => formatParticipantLabel(participant, input.options));
    const removed = readParticipants(details, "removedParticipants").map((participant) => formatParticipantLabel(participant, input.options));
    const singular = input.action === "issue.reviewers_updated" ? (t?.("activity.reviewer") ?? "reviewer") : (t?.("activity.approver") ?? "approver");
    const plural = input.action === "issue.reviewers_updated" ? (t?.("activity.reviewers") ?? "reviewers") : (t?.("activity.approvers") ?? "approvers");
    const addedText = t?.("activity.added") ?? "added";
    const removedText = t?.("activity.removed") ?? "removed";
    const updatedText = t?.("activity.added") ?? "updated"; // reuse added key or create new
    if (added.length > 0 && removed.length === 0) {
      const changed = formatChangedEntityLabel(singular, plural, added);
      return input.forIssueDetail ? `${addedText} ${changed}` : `${addedText} ${changed} to`;
    }
    if (removed.length > 0 && added.length === 0) {
      const changed = formatChangedEntityLabel(singular, plural, removed);
      return input.forIssueDetail ? `${removedText} ${changed}` : `${removedText} ${changed} from`;
    }
    return input.forIssueDetail ? `${updatedText} ${plural}` : `${updatedText} ${plural} on`;
  }

  return null;
}

export function formatActivityVerb(
  action: string,
  details?: Record<string, unknown> | null,
  options: ActivityFormatOptions = {},
): string {
  if (action === "issue.updated") {
    const issueUpdatedVerb = formatIssueUpdatedVerb(details, options.t);
    if (issueUpdatedVerb) return issueUpdatedVerb;
  }

  const structuredChange = formatStructuredIssueChange({
    action,
    details,
    options,
    forIssueDetail: false,
  });
  if (structuredChange) return structuredChange;

  // Try translation key map first
  const tKey = ACTIVITY_VERB_KEY_MAP[action];
  if (tKey && options.t) {
    return options.t(tKey);
  }

  // Fallback to English
  return ACTIVITY_ROW_VERBS[action] ?? action.replace(/[._]/g, " ");
}

export function formatIssueActivityAction(
  action: string,
  details?: Record<string, unknown> | null,
  options: ActivityFormatOptions = {},
): string {
  if (action === "issue.updated") {
    const issueUpdatedAction = formatIssueUpdatedAction(details, options);
    if (issueUpdatedAction) return issueUpdatedAction;
  }

  const structuredChange = formatStructuredIssueChange({
    action,
    details,
    options,
    forIssueDetail: true,
  });
  if (structuredChange) return structuredChange;

  if (
    (action === "issue.document_created" || action === "issue.document_updated" || action === "issue.document_deleted") &&
    details
  ) {
    const key = typeof details.key === "string" ? details.key : "document";
    const title = typeof details.title === "string" && details.title ? ` (${details.title})` : "";
    // Try translation first
    const tKey = ISSUE_ACTIVITY_KEY_MAP[action];
    const label = (tKey && options.t) ? options.t(tKey) : (ISSUE_ACTIVITY_LABELS[action] ?? action);
    return `${label} ${key}${title}`;
  }

  // Try translation key map first
  const tKey = ISSUE_ACTIVITY_KEY_MAP[action];
  if (tKey && options.t) {
    return options.t(tKey);
  }

  return ISSUE_ACTIVITY_LABELS[action] ?? action.replace(/[._]/g, " ");
}
