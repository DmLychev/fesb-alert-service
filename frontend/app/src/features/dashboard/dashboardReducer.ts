import { DASHBOARD_RANGES } from "./dashboardRanges";

import type {
  DashboardLiveEvent,
  DashboardRangeKey,
  DashboardSnapshot,
  FesbRequestBucket,
  IssueBucket,
  MessageBucket,
} from "./types";

type DashboardAction =
  | {
      type: "snapshot";
      snapshot: DashboardSnapshot;
    }
  | {
      type: "live_event";
      event: DashboardLiveEvent;
      rangeKey: DashboardRangeKey;
      now: number;
    }
  | {
      type: "roll_window";
      rangeKey: DashboardRangeKey;
      now: number;
    };

const getBucketStart = (
  timestamp: string | number,
  bucketMs: number,
): number => {
  const time =
    typeof timestamp === "number" ? timestamp : Date.parse(timestamp);

  return Math.floor(time / bucketMs) * bucketMs;
};

const inCurrentRange = (
  bucketStart: number,
  rangeKey: DashboardRangeKey,
  now: number,
) => {
  const range = DASHBOARD_RANGES[rangeKey];

  return bucketStart + range.bucketMs > now - range.durationMs;
};

const updateMessageBucket = (
  buckets: MessageBucket[],
  targetStart: number,
  changes: {
    total?: number;
    successful?: number;
    failed?: number;
  },
): MessageBucket[] => {
  const next = [...buckets];

  const index = next.findIndex(
    (bucket) => getBucketStart(bucket.start, 1) === targetStart,
  );

  if (index >= 0) {
    const current = next[index];

    next[index] = {
      ...current,
      total: current.total + (changes.total ?? 0),
      successful: current.successful + (changes.successful ?? 0),
      failed: current.failed + (changes.failed ?? 0),
    };
  } else {
    next.push({
      start: new Date(targetStart).toISOString(),
      total: changes.total ?? 0,
      successful: changes.successful ?? 0,
      failed: changes.failed ?? 0,
    });
  }

  return next.sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
};

const updateIssueBucket = (
  buckets: IssueBucket[],
  targetStart: number,
  delta: number,
): IssueBucket[] => {
  const next = [...buckets];

  const index = next.findIndex(
    (bucket) => Date.parse(bucket.start) === targetStart,
  );

  if (index >= 0) {
    next[index] = {
      ...next[index],
      total: next[index].total + delta,
    };
  } else {
    next.push({
      start: new Date(targetStart).toISOString(),
      total: delta,
    });
  }

  return next.sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
};

const updateRequestBucket = (
  buckets: FesbRequestBucket[],
  targetStart: number,
  successful: number,
  failed: number,
): FesbRequestBucket[] => {
  const next = [...buckets];

  const index = next.findIndex(
    (bucket) => Date.parse(bucket.start) === targetStart,
  );

  if (index >= 0) {
    next[index] = {
      ...next[index],
      successful: next[index].successful + successful,
      failed: next[index].failed + failed,
    };
  } else {
    next.push({
      start: new Date(targetStart).toISOString(),
      successful,
      failed,
    });
  }

  return next.sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
};

const rollSnapshot = (
  snapshot: DashboardSnapshot,
  rangeKey: DashboardRangeKey,
  now: number,
): DashboardSnapshot => {
  const range = DASHBOARD_RANGES[rangeKey];

  const cutoff = getBucketStart(now - range.durationMs, range.bucketMs);

  const currentBucket = getBucketStart(now, range.bucketMs);

  const messageTraffic = snapshot.messageTraffic.filter(
    (bucket) => Date.parse(bucket.start) >= cutoff,
  );

  const issuesTimeline = snapshot.issuesTimeline.filter(
    (bucket) => Date.parse(bucket.start) >= cutoff,
  );

  const fesbApiHealth = snapshot.fesbApiHealth.filter(
    (bucket) => Date.parse(bucket.start) >= cutoff,
  );

  if (
    !messageTraffic.some((bucket) => Date.parse(bucket.start) === currentBucket)
  ) {
    messageTraffic.push({
      start: new Date(currentBucket).toISOString(),
      total: 0,
      successful: 0,
      failed: 0,
    });
  }

  if (
    !issuesTimeline.some((bucket) => Date.parse(bucket.start) === currentBucket)
  ) {
    issuesTimeline.push({
      start: new Date(currentBucket).toISOString(),
      total: 0,
    });
  }

  if (
    !fesbApiHealth.some((bucket) => Date.parse(bucket.start) === currentBucket)
  ) {
    fesbApiHealth.push({
      start: new Date(currentBucket).toISOString(),
      successful: 0,
      failed: 0,
    });
  }

  return {
    ...snapshot,
    messageTraffic,
    issuesTimeline,
    fesbApiHealth,
  };
};

const dashboardReducer = (
  state: DashboardSnapshot | null,
  action: DashboardAction,
): DashboardSnapshot | null => {
  if (action.type === "snapshot") {
    return action.snapshot;
  }

  if (!state) {
    return state;
  }

  if (action.type === "roll_window") {
    return rollSnapshot(state, action.rangeKey, action.now);
  }

  const range = DASHBOARD_RANGES[action.rangeKey];

  const event = action.event;

  if (event.type === "messages_created") {
    let messageTraffic = state.messageTraffic;

    for (const bucket of event.buckets ?? []) {
      const target = getBucketStart(bucket.start, range.bucketMs);

      if (!inCurrentRange(target, action.rangeKey, action.now)) {
        continue;
      }

      messageTraffic = updateMessageBucket(messageTraffic, target, {
        total: bucket.total,
        successful: bucket.successful,
        failed: bucket.failed,
      });
    }

    return {
      ...state,
      messageTraffic,
    };
  }

  if (event.type === "messages_updated") {
    let messageTraffic = state.messageTraffic;

    for (const bucket of event.status_buckets ?? []) {
      const target = getBucketStart(bucket.start, range.bucketMs);

      if (!inCurrentRange(target, action.rangeKey, action.now)) {
        continue;
      }

      messageTraffic = updateMessageBucket(messageTraffic, target, {
        successful: bucket.successful_delta,
        failed: bucket.failed_delta,
      });
    }

    return {
      ...state,
      messageTraffic,
    };
  }

  if (event.type === "issues_created") {
    const target = getBucketStart(event.created_at, range.bucketMs);

    const issuesTimeline = inCurrentRange(target, action.rangeKey, action.now)
      ? updateIssueBucket(state.issuesTimeline, target, 1)
      : state.issuesTimeline;

    const issueTypes = [...state.issueTypes];

    const issueTypeIndex = issueTypes.findIndex(
      (item) => item.code === event.type_code,
    );

    if (issueTypeIndex >= 0) {
      issueTypes[issueTypeIndex] = {
        ...issueTypes[issueTypeIndex],
        count: issueTypes[issueTypeIndex].count + 1,
        unsolvedCount: issueTypes[issueTypeIndex].unsolvedCount + 1,
      };
    } else {
      issueTypes.push({
        code: event.type_code,
        description: event.type_description ?? `Issue ${event.type_code}`,
        count: 1,
        solvedCount: 0,
        unsolvedCount: 1,
      });
    }

    const problematicRoutes = [...state.problematicRoutes];

    if (event.route_id) {
      const routeIndex = problematicRoutes.findIndex(
        (item) => item.routeId === event.route_id,
      );

      if (routeIndex >= 0) {
        problematicRoutes[routeIndex] = {
          ...problematicRoutes[routeIndex],
          count: problematicRoutes[routeIndex].count + 1,
        };
      } else {
        problematicRoutes.push({
          routeId: event.route_id,
          routeName: event.route_name ?? event.route_id,
          count: 1,
        });
      }
    }

    issueTypes.sort((a, b) => b.count - a.count);

    problematicRoutes.sort((a, b) => b.count - a.count);

    return {
      ...state,
      activeIssues: state.activeIssues + 1,
      issuesTimeline,
      issueTypes,
      problematicRoutes,
    };
  }

  if (event.type === "issues_updated") {
    return {
      ...state,
      activeIssues: Math.max(0, state.activeIssues + (event.active_delta ?? 0)),
    };
  }

  if (event.type === "requests_created") {
    const target = getBucketStart(event.created_at, range.bucketMs);

    if (!inCurrentRange(target, action.rangeKey, action.now)) {
      return state;
    }

    return {
      ...state,
      fesbApiHealth: updateRequestBucket(
        state.fesbApiHealth,
        target,
        event.is_successful ? 1 : 0,
        event.is_successful ? 0 : 1,
      ),
    };
  }

  return state;
};

export default dashboardReducer;
