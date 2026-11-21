"use client";

import React from "react";
import { StatusPill } from "./StatusPill";
import "./QueueHealthWidget.css";

export interface QueueMetrics {
  /** Null when no live queue telemetry is available; never coerced to 0. */
  playersInQueue: number | null;
  averageWaitTime: number | null; // in seconds
  estimatedWaitTime: number | null; // in seconds
  activeMatches: number | null;
  queueHealth: "healthy" | "degraded" | "critical" | "offline" | "unknown";
  lastUpdated: string | null;
}

export interface QueueHealthWidgetProps {
  metrics?: QueueMetrics;
  queueName?: string;
  size?: "compact" | "default" | "detailed";
  showDetails?: boolean;
  onRefresh?: () => void;
  refreshInterval?: number;
  loading?: boolean;
  error?: string;
  className?: string;
  testId?: string;
}

const DEFAULT_METRICS: QueueMetrics = {
  playersInQueue: null,
  averageWaitTime: null,
  estimatedWaitTime: null,
  activeMatches: null,
  queueHealth: "unknown",
  lastUpdated: null,
};

const formatWaitTime = (seconds: number | null): string => {
  if (seconds === null) return "—";
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
};

const getHealthTone = (health: QueueMetrics["queueHealth"]) => {
  switch (health) {
    case "healthy": return "success";
    case "degraded": return "warning";
    case "critical": return "error";
    case "offline": return "neutral";
    case "unknown": return "neutral";
    default: return "neutral";
  }
};

const getHealthLabel = (health: QueueMetrics["queueHealth"]) => {
  switch (health) {
    case "healthy": return "Healthy";
    case "degraded": return "Degraded";
    case "critical": return "Critical";
    case "offline": return "Offline";
    case "unknown": return "Unavailable";
    default: return "Unknown";
  }
};

export const QueueHealthWidget: React.FC<QueueHealthWidgetProps> = ({
  metrics,
  queueName = "Game Queue",
  size = "default",
  showDetails = false,
  loading = false,
  className = "",
  testId = "queue-health-widget",
}) => {
  const currentMetrics = metrics || DEFAULT_METRICS;

  const containerClasses = [
    "queue-health-widget",
    `queue-health-widget--${size}`,
    className,
  ].filter(Boolean).join(" ");

  return (
    <div className={containerClasses} data-testid={testId}>
      <header className="queue-health-widget__header">
        <div className="queue-health-widget__title-section">
          <h3 className="queue-health-widget__title">{queueName}</h3>
          <StatusPill
            tone={getHealthTone(currentMetrics.queueHealth)}
            label={getHealthLabel(currentMetrics.queueHealth)}
            size="compact"
            testId={`${testId}-health-status`}
          />
        </div>
      </header>

      <div className="queue-health-widget__metrics">
        <div className="queue-health-widget__metric-group">
          <div className="queue-health-widget__metric">
            <span className="queue-health-widget__metric-value">
              {loading || currentMetrics.playersInQueue === null
                ? "—"
                : currentMetrics.playersInQueue}
            </span>
            <span className="queue-health-widget__metric-label">In Queue</span>
          </div>

          <div className="queue-health-widget__metric">
            <span className="queue-health-widget__metric-value">
              {loading ? "—" : formatWaitTime(currentMetrics.estimatedWaitTime)}
            </span>
            <span className="queue-health-widget__metric-label">Est. Wait</span>
          </div>

          {(size === "detailed" || showDetails) && (
            <div className="queue-health-widget__metric">
              <span className="queue-health-widget__metric-value">
                {loading || currentMetrics.activeMatches === null
                  ? "—"
                  : currentMetrics.activeMatches}
              </span>
              <span className="queue-health-widget__metric-label">Active</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

QueueHealthWidget.displayName = "QueueHealthWidget";

export default QueueHealthWidget;
