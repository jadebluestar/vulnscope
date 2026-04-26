/**
 * Severity Badge Component
 * Displays vulnerability severity with color-coded styling
 */

import React from "react";
import { Severity } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

interface SeverityBadgeProps {
  severity: Severity;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}

const severityConfig: Record<
  Severity,
  { label: string; bgColor: string; textColor: string; icon: string }
> = {
  critical: {
    label: "Critical",
    bgColor: "bg-red-900/20 border-red-700",
    textColor: "text-red-400",
    icon: "🔴",
  },
  high: {
    label: "High",
    bgColor: "bg-orange-900/20 border-orange-700",
    textColor: "text-orange-400",
    icon: "🟠",
  },
  medium: {
    label: "Medium",
    bgColor: "bg-yellow-900/20 border-yellow-700",
    textColor: "text-yellow-400",
    icon: "🟡",
  },
  low: {
    label: "Low",
    bgColor: "bg-blue-900/20 border-blue-700",
    textColor: "text-blue-400",
    icon: "🔵",
  },
  info: {
    label: "Info",
    bgColor: "bg-cyan-900/20 border-cyan-700",
    textColor: "text-cyan-400",
    icon: "ℹ️",
  },
};

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({
  severity,
  showIcon = false,
}) => {
  const config = severityConfig[severity];

  return (
    <Badge
      variant="outline"
      className={`${config.bgColor} ${config.textColor} font-semibold`}
    >
      {showIcon && <span className="mr-1">{config.icon}</span>}
      {config.label}
    </Badge>
  );
};
