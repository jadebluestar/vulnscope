/**
 * CVSS Score Meter Component
 * Visual representation of CVSS score (0-10) with gauge
 */

import React from "react";

interface CVSSMeterProps {
  score: number; // 0-10
  vector?: string; // e.g., "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H"
  showLabel?: boolean;
}

const getCVSSColor = (score: number): string => {
  if (score >= 9) return "text-red-500";
  if (score >= 7) return "text-orange-500";
  if (score >= 4) return "text-yellow-500";
  if (score >= 0.1) return "text-blue-500";
  return "text-gray-500";
};

const getCVSSBackground = (score: number): string => {
  if (score >= 9) return "bg-red-900/20 border-red-700";
  if (score >= 7) return "bg-orange-900/20 border-orange-700";
  if (score >= 4) return "bg-yellow-900/20 border-yellow-700";
  if (score >= 0.1) return "bg-blue-900/20 border-blue-700";
  return "bg-gray-900/20 border-gray-700";
};

const getCVSSSeverity = (score: number): string => {
  if (score >= 9) return "CRITICAL";
  if (score >= 7) return "HIGH";
  if (score >= 4) return "MEDIUM";
  if (score >= 0.1) return "LOW";
  return "NONE";
};

export const CVSSMeter: React.FC<CVSSMeterProps> = ({
  score,
  vector,
  showLabel = true,
}) => {
  const percentage = (score / 10) * 100;
  const colorClass = getCVSSColor(score);
  const bgClass = getCVSSBackground(score);
  const severity = getCVSSSeverity(score);

  return (
    <div className={`rounded border p-3 ${bgClass}`}>
      <div className="space-y-2">
        {showLabel && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-primary">CVSS</span>
            <span className={`text-lg font-bold ${colorClass}`}>
              {score.toFixed(1)}
            </span>
          </div>
        )}

        {/* Progress bar */}
        <div className="h-2 w-full overflow-hidden rounded-full bg-bg-primary">
          <div
            className={`h-full ${colorClass} bg-opacity-50 transition-all duration-300`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Severity label */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-dimtext">{severity}</span>
          {vector && (
            <span
              className="text-dimtext truncate hover:cursor-help"
              title={vector}
            >
              {vector.split("/")[0]}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
