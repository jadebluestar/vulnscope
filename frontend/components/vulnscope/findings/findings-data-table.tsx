/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useMemo } from "react";
import { Vulnerability, Severity, VulnStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SeverityBadge } from "./severity-badge";
import { CVSSMeter } from "./cvss-meter";
import { Search, ChevronUp, ChevronDown, X } from "lucide-react";

const SortIcon = ({ column, sortKey, sortOrder }: { column: SortKey; sortKey: SortKey; sortOrder: SortOrder }) => {
  if (sortKey !== column) return <div className="w-4 h-4" />;
  return sortOrder === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
};

interface FindingsDataTableProps {
  findings: Vulnerability[];
  onViewDetails?: (finding: Vulnerability) => void;
  isLoading?: boolean;
}

type SortKey = "title" | "severity" | "cvss" | "discoveredAt" | "status";
type SortOrder = "asc" | "desc";

const severities: Severity[] = ["critical", "high", "medium", "low", "info"];
const statuses: VulnStatus[] = ["open", "fixed", "ignored", "false-positive"];

const statusColors: Record<VulnStatus, string> = {
  open: "bg-red-500/20 text-red-400 border-red-500/30",
  fixed: "bg-green-500/20 text-green-400 border-green-500/30",
  ignored: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  "false-positive": "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

export default function FindingsDataTable({
  findings,
  onViewDetails,
  isLoading = false,
}: FindingsDataTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSeverities, setSelectedSeverities] = useState<Severity[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<VulnStatus[]>([]);
  const [selectedOWASP, setSelectedOWASP] = useState<string>("");
  const [sortKey, setSortKey] = useState<SortKey>("severity");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Get unique OWASP categories
  const owaspCategories = useMemo(
    () => Array.from(new Set(findings.map((f) => f.owasp.category))).sort(),
    [findings]
  );

  // Filter and sort findings
  const filteredAndSortedFindings = useMemo(() => {
    const filtered = findings.filter((finding) => {
      // Search filter
      const searchMatch =
        finding.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        finding.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        finding.endpoint.toLowerCase().includes(searchTerm.toLowerCase());

      // Severity filter
      const severityMatch =
        selectedSeverities.length === 0 || selectedSeverities.includes(finding.severity);

      // Status filter
      const statusMatch =
        selectedStatuses.length === 0 || selectedStatuses.includes(finding.status);

      // OWASP filter
      const owaspMatch =
        !selectedOWASP || finding.owasp.category === selectedOWASP;

      return searchMatch && severityMatch && statusMatch && owaspMatch;
    });

    // Sort
    filtered.sort((a, b) => {
      let aVal: any = a[sortKey];
      let bVal: any = b[sortKey];

      if (sortKey === "severity") {
        const severityOrder: Record<Severity, number> = {
          critical: 5,
          high: 4,
          medium: 3,
          low: 2,
          info: 1,
        };
        aVal = severityOrder[a.severity];
        bVal = severityOrder[b.severity];
      }

      if (typeof aVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = (bVal as string).toLowerCase();
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [findings, searchTerm, selectedSeverities, selectedStatuses, selectedOWASP, sortKey, sortOrder]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("desc");
    }
  };

  const toggleSeverityFilter = (severity: Severity) => {
    setSelectedSeverities((prev) =>
      prev.includes(severity) ? prev.filter((s) => s !== severity) : [...prev, severity]
    );
  };

  const toggleStatusFilter = (status: VulnStatus) => {
    setSelectedStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedSeverities([]);
    setSelectedStatuses([]);
    setSelectedOWASP("");
  };

  
  const hasActiveFilters =
    searchTerm || selectedSeverities.length > 0 || selectedStatuses.length > 0 || selectedOWASP;

  return (
    <Card>
      {/* Header */}
      <div className="p-6 border-b border-slate-700 space-y-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-white">Findings</h2>
            <p className="text-sm text-dimtext mt-1">
              {filteredAndSortedFindings.length} of {findings.length} finding
              {findings.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-dimtext" />
          <input
            type="text"
            placeholder="Search by title, description, or endpoint..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface border border-slate-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Severity Filter */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-dimtext uppercase">Severity</label>
            <div className="flex flex-wrap gap-2">
              {severities.map((severity) => (
                <button
                  key={severity}
                  onClick={() => toggleSeverityFilter(severity)}
                  className={`text-xs px-2.5 py-1.5 rounded border transition-all capitalize ${
                    selectedSeverities.includes(severity)
                      ? "bg-slate-700 border-slate-500 text-white"
                      : "bg-slate-900/50 border-slate-700 text-dimtext hover:border-slate-500"
                  }`}
                  disabled={isLoading}
                >
                  {severity}
                </button>
              ))}
            </div>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-dimtext uppercase">Status</label>
            <div className="flex flex-wrap gap-2">
              {statuses.map((status) => (
                <button
                  key={status}
                  onClick={() => toggleStatusFilter(status)}
                  className={`text-xs px-2.5 py-1.5 rounded border transition-all capitalize ${
                    selectedStatuses.includes(status)
                      ? "bg-slate-700 border-slate-500 text-white"
                      : "bg-slate-900/50 border-slate-700 text-dimtext hover:border-slate-500"
                  }`}
                  disabled={isLoading}
                >
                  {status.replace("-", " ")}
                </button>
              ))}
            </div>
          </div>

          {/* OWASP Category Filter */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-dimtext uppercase">OWASP Category</label>
            <select
              value={selectedOWASP}
              onChange={(e) => setSelectedOWASP(e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-slate-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            >
              <option value="">All Categories</option>
              {owaspCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-xs font-medium px-3 py-2 rounded bg-slate-900/50 border border-slate-700 text-dimtext hover:text-white hover:border-slate-500 transition-all disabled:opacity-50"
                disabled={isLoading}
              >
                <X className="h-3 w-3" />
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700 bg-slate-900/50">
              <th className="px-6 py-4 text-left">
                <button
                  onClick={() => toggleSort("title")}
                  className="flex items-center gap-2 font-semibold text-white hover:text-blue-400 transition-colors"
                >
                  Vulnerability
                  <SortIcon column="title" sortKey={sortKey} sortOrder={sortOrder} />
                </button>
              </th>
              <th className="px-6 py-4 text-left">
                <span className="font-semibold text-white">OWASP</span>
              </th>
              <th className="px-6 py-4 text-left">
                <button
                  onClick={() => toggleSort("severity")}
                  className="flex items-center gap-2 font-semibold text-white hover:text-blue-400 transition-colors"
                >
                  Severity
                  <SortIcon column="severity" sortKey={sortKey} sortOrder={sortOrder} />
                </button>
              </th>
              <th className="px-6 py-4 text-left">
                <button
                  onClick={() => toggleSort("cvss")}
                  className="flex items-center gap-2 font-semibold text-white hover:text-blue-400 transition-colors"
                >
                  CVSS
                  <SortIcon column="cvss" sortKey={sortKey} sortOrder={sortOrder} />
                </button>
              </th>
              <th className="px-6 py-4 text-left">Endpoint</th>
              <th className="px-6 py-4 text-left">
                <button
                  onClick={() => toggleSort("status")}
                  className="flex items-center gap-2 font-semibold text-white hover:text-blue-400 transition-colors"
                >
                  Status
                  <SortIcon column="status" sortKey={sortKey} sortOrder={sortOrder} />
                </button>
              </th>
              <th className="px-6 py-4 text-left font-semibold text-white">Discovered By</th>
              <th className="px-6 py-4 text-right font-semibold text-white">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedFindings.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center">
                  <p className="text-dimtext">No findings match the selected filters</p>
                </td>
              </tr>
            ) : (
              filteredAndSortedFindings.map((finding) => (
                <tr
                  key={finding.id}
                  className="border-b border-slate-700 hover:bg-slate-900/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <p className="font-medium text-white max-w-xs truncate">{finding.title}</p>
                      <p className="text-xs text-dimtext line-clamp-2">{finding.description}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-white">{finding.owasp.category}</p>
                      <p className="text-xs text-dimtext">{finding.owasp.id}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <SeverityBadge severity={finding.severity} size="md" showIcon={true} />
                  </td>
                  <td className="px-6 py-4">
                    <CVSSMeter score={finding.cvss} showLabel={true} />
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-white font-mono break-all max-w-sm">{finding.endpoint}</p>
                    {finding.method && (
                      <p className="text-xs text-dimtext mt-1">{finding.method}</p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-xs px-2.5 py-1 rounded border inline-block capitalize ${statusColors[finding.status]}`}
                    >
                      {finding.status.replace("-", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-dimtext">{finding.discoveredBy}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {onViewDetails && (
                      <Button
                        onClick={() => onViewDetails(finding)}
                        variant="outline"
                        className="text-sm px-3 py-1"
                      >
                        Details
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Summary Footer */}
      <div className="p-6 border-t border-slate-700 bg-slate-900/30">
        <div className="grid grid-cols-5 gap-4">
          {[
            { label: "Critical", color: "text-red-400", count: filteredAndSortedFindings.filter((f) => f.severity === "critical").length },
            { label: "High", color: "text-orange-400", count: filteredAndSortedFindings.filter((f) => f.severity === "high").length },
            { label: "Medium", color: "text-yellow-400", count: filteredAndSortedFindings.filter((f) => f.severity === "medium").length },
            { label: "Low", color: "text-blue-400", count: filteredAndSortedFindings.filter((f) => f.severity === "low").length },
            { label: "Info", color: "text-cyan-400", count: filteredAndSortedFindings.filter((f) => f.severity === "info").length },
          ].map((item) => (
            <div key={item.label} className="text-center">
              <p className={`text-2xl font-bold ${item.color}`}>{item.count}</p>
              <p className="text-xs text-dimtext mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
