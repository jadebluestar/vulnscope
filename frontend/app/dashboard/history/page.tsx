"use client";

import { useState, useMemo } from "react";
import { Search, Download, Eye } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ScanRecord {
  id: string;
  url: string;
  timestamp: Date;
  duration: number; // seconds
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  totalFindings: number;
  status: "completed" | "failed";
  pdfUrl?: string;
}

// Mock scan history data
const MOCK_SCANS: ScanRecord[] = [
  {
    id: "scan-1",
    url: "https://api.example.com",
    timestamp: new Date("2025-01-20T14:30:00"),
    duration: 285,
    criticalCount: 2,
    highCount: 3,
    mediumCount: 5,
    lowCount: 4,
    totalFindings: 14,
    status: "completed",
    pdfUrl: "/reports/scan-1.pdf",
  },
  {
    id: "scan-2",
    url: "https://staging.myapp.io",
    timestamp: new Date("2025-01-19T10:15:00"),
    duration: 312,
    criticalCount: 1,
    highCount: 2,
    mediumCount: 3,
    lowCount: 2,
    totalFindings: 8,
    status: "completed",
    pdfUrl: "/reports/scan-2.pdf",
  },
  {
    id: "scan-3",
    url: "https://shop.example.com",
    timestamp: new Date("2025-01-18T16:45:00"),
    duration: 198,
    criticalCount: 0,
    highCount: 1,
    mediumCount: 4,
    lowCount: 3,
    totalFindings: 8,
    status: "completed",
    pdfUrl: "/reports/scan-3.pdf",
  },
  {
    id: "scan-4",
    url: "http://localhost:3000",
    timestamp: new Date("2025-01-17T08:20:00"),
    duration: 256,
    criticalCount: 3,
    highCount: 5,
    mediumCount: 7,
    lowCount: 6,
    totalFindings: 21,
    status: "completed",
    pdfUrl: "/reports/scan-4.pdf",
  },
  {
    id: "scan-5",
    url: "https://internal.company.net",
    timestamp: new Date("2025-01-15T13:00:00"),
    duration: 0,
    criticalCount: 0,
    highCount: 0,
    mediumCount: 0,
    lowCount: 0,
    totalFindings: 0,
    status: "failed",
  },
];

const formatDate = (date: Date) => {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
};

const getSeverityColor = (count: number) => {
  if (count === 0) return "text-slate-400";
  if (count <= 1) return "text-yellow-400";
  if (count <= 2) return "text-orange-400";
  return "text-red-400";
};

const getSeverityBg = (count: number) => {
  if (count === 0) return "bg-slate-500/10 border-slate-500/20";
  if (count <= 1) return "bg-yellow-500/10 border-yellow-500/20";
  if (count <= 2) return "bg-orange-500/10 border-orange-500/20";
  return "bg-red-500/10 border-red-500/20";
};

export default function HistoryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "completed" | "failed">("all");
  const [sortBy, setSortBy] = useState<"recent" | "critical" | "url">("recent");

  const filteredAndSortedScans = useMemo(() => {
    const filtered = MOCK_SCANS.filter((scan) => {
      const matchesSearch = scan.url.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === "all" || scan.status === filterStatus;
      return matchesSearch && matchesStatus;
    });

    filtered.sort((a, b) => {
      if (sortBy === "recent") {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      } else if (sortBy === "critical") {
        return b.criticalCount - a.criticalCount;
      } else {
        return a.url.localeCompare(b.url);
      }
    });

    return filtered;
  }, [searchTerm, filterStatus, sortBy]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Scan History</h1>
        <p className="text-sm text-dimtext mt-2">
          View and download all your security scan reports
        </p>
      </div>

      {/* Controls */}
      <Card className="p-6 border-slate-700">
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-dimtext" />
            <input
              type="text"
              placeholder="Search by URL..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-surface border border-slate-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Status filter */}
            <div className="flex gap-2">
              {["all", "completed", "failed"].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status as "all" | "completed" | "failed")}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                    filterStatus === status
                      ? "bg-blue-600 text-white"
                      : "bg-slate-800 text-dimtext hover:bg-slate-700"
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>

            {/* Sort dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "recent" | "critical" | "url")}
                className="px-3 py-1.5 rounded text-xs font-medium bg-slate-800 border border-slate-700 text-dimtext focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="recent">Most Recent</option>
                <option value="critical">Most Critical</option>
                <option value="url">URL A-Z</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Scans list */}
      <div className="space-y-4">
        {filteredAndSortedScans.length === 0 ? (
          <Card className="p-12 text-center border-slate-700">
            <p className="text-dimtext">No scans found matching your criteria</p>
          </Card>
        ) : (
          filteredAndSortedScans.map((scan) => (
            <Card
              key={scan.id}
              className="p-6 border-slate-700 hover:border-slate-600 transition-all cursor-pointer group"
            >
              <div className="grid grid-cols-1 md:grid-cols-6 gap-6 items-center">
                {/* URL & Timestamp */}
                <div className="md:col-span-2 space-y-1">
                  <p className="font-semibold text-white break-all group-hover:text-blue-400 transition-colors">
                    {scan.url}
                  </p>
                  <p className="text-xs text-dimtext">{formatDate(scan.timestamp)}</p>
                  {scan.status === "completed" && (
                    <p className="text-xs text-dimtext">Duration: {formatDuration(scan.duration)}</p>
                  )}
                </div>

                {/* Severity badges */}
                {scan.status === "completed" ? (
                  <div className="flex gap-2">
                    {[
                      { label: "Critical", count: scan.criticalCount, color: "red" },
                      { label: "High", count: scan.highCount, color: "orange" },
                      { label: "Medium", count: scan.mediumCount, color: "yellow" },
                      { label: "Low", count: scan.lowCount, color: "blue" },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className={`px-2.5 py-1.5 rounded border text-center min-w-12 ${getSeverityBg(item.count)}`}
                        title={item.label}
                      >
                        <p className={`text-sm font-bold ${getSeverityColor(item.count)}`}>
                          {item.count}
                        </p>
                        <p className="text-xs text-dimtext">{item.label}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-400">
                    <div className="w-2 h-2 rounded-full bg-red-400" />
                    <span className="text-xs font-medium">Scan Failed</span>
                  </div>
                )}

                {/* Total findings */}
                <div className="text-center">
                  {scan.status === "completed" ? (
                    <>
                      <p className="text-2xl font-bold text-white">{scan.totalFindings}</p>
                      <p className="text-xs text-dimtext">Findings</p>
                    </>
                  ) : (
                    <span className="text-dimtext">—</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 justify-end">
                  {scan.status === "completed" && scan.pdfUrl && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => (window.location.href = `/report/${scan.id}`)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        PDF
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {filteredAndSortedScans.length > 0 && (
        <div className="flex justify-center gap-2 pt-6">
          {[1, 2, 3].map((page) => (
            <button
              key={page}
              className={`px-3 py-2 rounded text-sm font-medium transition-all ${
                page === 1
                  ? "bg-blue-600 text-white"
                  : "bg-slate-800 text-dimtext hover:bg-slate-700"
              }`}
            >
              {page}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
