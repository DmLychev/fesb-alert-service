export type DashboardRangeKey = "hour" | "sixHours" | "day" | "week" | "month";

export type DashboardBucket =
  | "ONE_MINUTE"
  | "FIVE_MINUTES"
  | "FIFTEEN_MINUTES"
  | "ONE_HOUR"
  | "SIX_HOURS";

export interface MessageBucket {
  start: string;
  total: number;
  successful: number;
  failed: number;
}

export interface IssueBucket {
  start: string;
  total: number;
}

export interface FesbRequestBucket {
  start: string;
  successful: number;
  failed: number;
}

export interface IssueTypeStat {
  code: number;
  description: string;
  count: number;
}

export interface RouteStat {
  routeId: string;
  routeName: string;
  count: number;
}

export interface DashboardSnapshot {
  generatedAt: string;
  activeIssues: number;
  messageTraffic: MessageBucket[];
  issuesTimeline: IssueBucket[];
  issueTypes: IssueTypeStat[];
  problematicRoutes: RouteStat[];
  fesbApiHealth: FesbRequestBucket[];
}

export interface MessageDeltaBucket {
  start: string;
  total: number;
  successful: number;
  failed: number;
}

export interface MessageStatusDeltaBucket {
  start: string;
  successful_delta: number;
  failed_delta: number;
}

export interface MessagesCreatedEvent {
  type: "messages_created";
  count: number;
  buckets?: MessageDeltaBucket[];
}

export interface MessagesUpdatedEvent {
  type: "messages_updated";
  ids: number[];
  status_buckets?: MessageStatusDeltaBucket[];
}

export interface IssueCreatedEvent {
  type: "issues_created";
  id: number;
  type_code: number;
  route_id: string | null;
  domain_name: string | null;
  created_at: string;
}

export interface IssuesUpdatedEvent {
  type: "issues_updated";
  ids: number[];
  active_delta?: number;
}

export interface RequestCreatedEvent {
  type: "requests_created";
  id: number;
  request_type: number;
  is_successful: boolean;
  created_at: string;
}

export type DashboardLiveEvent =
  | MessagesCreatedEvent
  | MessagesUpdatedEvent
  | IssueCreatedEvent
  | IssuesUpdatedEvent
  | RequestCreatedEvent;

export type DashboardLiveStatus =
  | "off"
  | "connecting"
  | "connected"
  | "disconnected";

export interface DashboardFilters {
  domains: string[];
  routeIds: string[];
}

export interface DashboardRouteOption {
  id: string;
  name: string;
  domainName: string;
}

export interface DashboardFilterOptions {
  domains: string[];
  routes: DashboardRouteOption[];
}
