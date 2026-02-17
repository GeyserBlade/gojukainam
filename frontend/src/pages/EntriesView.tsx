import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Input, Select } from "../components/Input";
import { EntryService, type Entry, type EntryFilters } from "../lib/entries";
import { listEvents, getDivisions, type Event, type Division } from "../lib/events";
import { listClubs, type Club } from "../lib/clubs";

// ============ Constants ============

const STATUS_STYLES = {
  DRAFT: {
    bg: "bg-gray-600/30",
    text: "text-gray-300",
    border: "border-gray-600",
    icon: "📝",
    label: "Draft",
  },
  SUBMITTED: {
    bg: "bg-amber-600/30",
    text: "text-amber-300",
    border: "border-amber-600",
    icon: "⏳",
    label: "Pending",
  },
  APPROVED: {
    bg: "bg-green-600/30",
    text: "text-green-300",
    border: "border-green-600",
    icon: "✓",
    label: "Approved",
  },
  RETURNED: {
    bg: "bg-red-600/30",
    text: "text-red-300",
    border: "border-red-600",
    icon: "↩",
    label: "Returned",
  },
};

const CATEGORY_STYLES = {
  KATA: {
    bg: "bg-purple-600/30",
    text: "text-purple-300",
    icon: "🥋",
  },
  KUMITE: {
    bg: "bg-red-600/30",
    text: "text-red-300",
    icon: "🥊",
  },
};

// ============ Components ============

interface StatusBadgeProps {
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "RETURNED";
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const style = STATUS_STYLES[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${style.bg} ${style.text}`}>
      <span>{style.icon}</span>
      {style.label}
    </span>
  );
};

interface EntryCardProps {
  entry: Entry;
  onStatusChange?: (entryId: string, newStatus: string) => void;
  isAdmin: boolean;
}

const EntryCard: React.FC<EntryCardProps> = ({ entry, onStatusChange, isAdmin }) => {
  const isTeam = entry.entryType === "TEAM_KATA" || entry.entryType === "TEAM_KUMITE";
  const category = entry.division.category;
  const categoryStyle = CATEGORY_STYLES[category];

  return (
    <div className={`p-4 rounded border ${STATUS_STYLES[entry.status].border} bg-gray-800 border-l-4`}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{isTeam ? "👥" : "👤"}</span>
            <h3 className="font-medium">
              {isTeam && entry.team
                ? entry.team.name
                : entry.athlete
                ? `${entry.athlete.firstName} ${entry.athlete.lastName}`
                : "Unknown"}
            </h3>
          </div>

          <div className="flex gap-2 flex-wrap text-xs text-gray-400">
            <span>{entry.club.name}</span>
            <span>•</span>
            <span className={categoryStyle.text}>
              {categoryStyle.icon} {category === "KATA" ? "Kata" : "Kumite"}
            </span>
            {entry.weightClass && (
              <>
                <span>•</span>
                <span className="text-orange-300">⚖️ {entry.weightClass.name}</span>
              </>
            )}
            {!isTeam && entry.athlete?.belt && (
              <>
                <span>•</span>
                <span>{entry.athlete.belt.name}</span>
              </>
            )}
          </div>

          {isTeam && entry.team && (
            <div className="mt-2 text-xs text-gray-500">
              <span>Members: {entry.team.members.filter((m) => !m.isReserve).length}</span>
              {entry.team.members.some((m) => m.isReserve) && (
                <span> (+{entry.team.members.filter((m) => m.isReserve).length} reserve)</span>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-2">
          <StatusBadge status={entry.status} />
          {isAdmin && entry.status === "SUBMITTED" && onStatusChange && (
            <div className="flex gap-1">
              <button
                onClick={() => onStatusChange(entry.id, "APPROVED")}
                className="px-2 py-1 bg-green-600 hover:bg-green-500 rounded text-xs"
              >
                Approve
              </button>
              <button
                onClick={() => onStatusChange(entry.id, "RETURNED")}
                className="px-2 py-1 bg-red-600 hover:bg-red-500 rounded text-xs"
              >
                Return
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-2 pt-2 border-t border-gray-700 flex justify-between text-xs text-gray-500">
        <span>Division: {entry.division.name}</span>
        <span>
          {entry.entryType === "KATA"
            ? "Kata (Individual)"
            : entry.entryType === "KUMITE"
            ? "Kumite (Individual)"
            : entry.entryType === "TEAM_KATA"
            ? "Kata (Team)"
            : "Kumite (Team)"}
        </span>
      </div>
    </div>
  );
};

// ============ Main Component ============

const EntriesView = () => {
  const { role, clubId } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isAdmin = role === "SUPERADMIN" || role === "ADMIN";

  // State
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [filterClubId, setFilterClubId] = useState<string>(clubId || "");
  const [filterDivisionId, setFilterDivisionId] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterEntryType, setFilterEntryType] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grouped" | "table">("grouped");
  const [expandedDivisions, setExpandedDivisions] = useState<Set<string>>(new Set());

  // Queries
  const { data: events = [] } = useQuery({
    queryKey: ["events"],
    queryFn: listEvents,
  });

  const { data: clubs = [] } = useQuery({
    queryKey: ["clubs"],
    queryFn: listClubs,
    enabled: isAdmin,
  });

  const { data: divisions = [] } = useQuery({
    queryKey: ["divisions", selectedEventId],
    queryFn: () => getDivisions(selectedEventId),
    enabled: !!selectedEventId,
  });

  const filters: EntryFilters = {
    eventId: selectedEventId,
    clubId: isAdmin ? filterClubId || undefined : clubId || undefined,
    divisionId: filterDivisionId || undefined,
    status: filterStatus !== "ALL" ? (filterStatus as any) : undefined,
    entryType: filterEntryType !== "ALL" ? (filterEntryType as any) : undefined,
    searchQuery: searchQuery || undefined,
  };

  const { data: entries = [], isLoading: loadingEntries } = useQuery({
    queryKey: ["entries", filters],
    queryFn: () => EntryService.list(filters),
    enabled: !!selectedEventId,
  });

  // Handlers
  const handleStatusChange = async (entryId: string, newStatus: string) => {
    try {
      await EntryService.updateStatus(entryId, newStatus);
      queryClient.invalidateQueries({ queryKey: ["entries"] });
    } catch (error: any) {
      alert(error?.response?.data?.error || "Failed to update status");
    }
  };

  const toggleDivision = (divisionId: string) => {
    const newExpanded = new Set(expandedDivisions);
    if (newExpanded.has(divisionId)) {
      newExpanded.delete(divisionId);
    } else {
      newExpanded.add(divisionId);
    }
    setExpandedDivisions(newExpanded);
  };

  const toggleAllDivisions = () => {
    if (expandedDivisions.size === divisions.length) {
      setExpandedDivisions(new Set());
    } else {
      setExpandedDivisions(new Set(divisions.map((d) => d.id)));
    }
  };

  // Statistics
  const stats = useMemo(() => {
    return {
      total: entries.length,
      draft: entries.filter((e) => e.status === "DRAFT").length,
      submitted: entries.filter((e) => e.status === "SUBMITTED").length,
      approved: entries.filter((e) => e.status === "APPROVED").length,
      returned: entries.filter((e) => e.status === "RETURNED").length,
    };
  }, [entries]);

  // Group entries by division
  const groupedEntries = useMemo(() => {
    const groups: {
      [divisionId: string]: {
        division: Division;
        entries: Entry[];
      };
    } = {};

    entries.forEach((entry) => {
      if (!groups[entry.divisionId]) {
        groups[entry.divisionId] = {
          division: entry.division,
          entries: [],
        };
      }
      groups[entry.divisionId].entries.push(entry);
    });

    return groups;
  }, [entries]);

  // Get all divisions (including empty ones)
  const allDivisionsWithEntries = useMemo(() => {
    return divisions.map((division) => ({
      division,
      entries: groupedEntries[division.id]?.entries || [],
    }));
  }, [divisions, groupedEntries]);

  if (!isAdmin && !clubId) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold">View Entries</h1>
            <button className="text-sm text-gray-400 hover:text-white" onClick={() => navigate("/dashboard")}>
              Back to Dashboard
            </button>
          </div>
          <p className="text-sm text-gray-400">You do not have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Event Entries</h1>
            <p className="text-sm text-gray-400 mt-1">View and manage all competition entries</p>
          </div>
          <button
            onClick={() => navigate("/events")}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm"
          >
            ← Back to Event Management
          </button>
        </div>

        {/* Event Selection */}
        <div className="bg-gray-900 rounded-lg p-4 mb-6">
          <label className="block text-sm text-gray-400 mb-2">Select Event</label>
          <Select
            value={selectedEventId}
            onChange={(e) => {
              setSelectedEventId(e.target.value);
              setFilterDivisionId("");
            }}
          >
            <option value="">-- Select Event --</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.name} - {new Date(event.startDate).toLocaleDateString()}
              </option>
            ))}
          </Select>
        </div>

        {selectedEventId && (
          <>
            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div className="bg-gray-900 rounded-lg p-4">
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-xs text-gray-400">Total Entries</div>
              </div>
              <div className="bg-gray-900 rounded-lg p-4">
                <div className="text-2xl font-bold text-gray-300">{stats.draft}</div>
                <div className="text-xs text-gray-400">Draft</div>
              </div>
              <div className="bg-gray-900 rounded-lg p-4">
                <div className="text-2xl font-bold text-amber-300">{stats.submitted}</div>
                <div className="text-xs text-gray-400">Pending</div>
              </div>
              <div className="bg-gray-900 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-300">{stats.approved}</div>
                <div className="text-xs text-gray-400">Approved</div>
              </div>
              <div className="bg-gray-900 rounded-lg p-4">
                <div className="text-2xl font-bold text-red-300">{stats.returned}</div>
                <div className="text-xs text-gray-400">Returned</div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-gray-900 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {isAdmin && (
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Club</label>
                    <Select value={filterClubId} onChange={(e) => setFilterClubId(e.target.value)}>
                      <option value="">All Clubs</option>
                      {clubs.map((club) => (
                        <option key={club.id} value={club.id}>
                          {club.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                )}

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Division</label>
                  <Select value={filterDivisionId} onChange={(e) => setFilterDivisionId(e.target.value)}>
                    <option value="">All Divisions</option>
                    {divisions.map((division) => (
                      <option key={division.id} value={division.id}>
                        {division.name} ({division.category})
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Status</label>
                  <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                    <option value="ALL">All Status</option>
                    <option value="DRAFT">Draft</option>
                    <option value="SUBMITTED">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="RETURNED">Returned</option>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Entry Type</label>
                  <Select value={filterEntryType} onChange={(e) => setFilterEntryType(e.target.value)}>
                    <option value="ALL">All Types</option>
                    <option value="KATA">Kata (Individual)</option>
                    <option value="KUMITE">Kumite (Individual)</option>
                    <option value="TEAM_KATA">Kata (Team)</option>
                    <option value="TEAM_KUMITE">Kumite (Team)</option>
                  </Select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Search</label>
                <Input
                  type="text"
                  placeholder="Search athletes, teams, clubs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* View Options */}
            <div className="bg-gray-900 rounded-lg p-4 mb-6 flex justify-between items-center">
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode("grouped")}
                  className={`px-3 py-1 rounded text-sm ${
                    viewMode === "grouped" ? "bg-blue-600" : "bg-gray-700 hover:bg-gray-600"
                  }`}
                >
                  Grouped by Division
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`px-3 py-1 rounded text-sm ${
                    viewMode === "table" ? "bg-blue-600" : "bg-gray-700 hover:bg-gray-600"
                  }`}
                >
                  Table View
                </button>
              </div>

              {viewMode === "grouped" && (
                <button
                  onClick={toggleAllDivisions}
                  className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
                >
                  {expandedDivisions.size === divisions.length ? "Collapse All" : "Expand All"}
                </button>
              )}
            </div>

            {/* Entries Display */}
            {loadingEntries ? (
              <div className="bg-gray-900 rounded-lg p-8 text-center text-gray-400">Loading entries...</div>
            ) : entries.length === 0 ? (
              <div className="bg-gray-900 rounded-lg p-8 text-center text-gray-400">
                No entries found. Try adjusting your filters or create entries from the Event Management page.
              </div>
            ) : viewMode === "grouped" ? (
              <div className="space-y-4">
                {allDivisionsWithEntries.map(({ division, entries: divisionEntries }) => {
                  const isExpanded = expandedDivisions.has(division.id);
                  const categoryStyle = CATEGORY_STYLES[division.category];

                  return (
                    <div key={division.id} className="bg-gray-900 rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleDivision(division.id)}
                        className="w-full p-4 flex justify-between items-center hover:bg-gray-800 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{categoryStyle.icon}</span>
                          <div className="text-left">
                            <h3 className="font-semibold">{division.name}</h3>
                            <p className="text-xs text-gray-400">
                              {division.gender} • Ages {division.minAge}-{division.maxAge} •{" "}
                              <span className={categoryStyle.text}>{division.category}</span>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-gray-400">
                            {divisionEntries.length} {divisionEntries.length === 1 ? "entry" : "entries"}
                          </span>
                          <span className="text-gray-400">{isExpanded ? "▼" : "▶"}</span>
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="p-4 pt-0 space-y-3">
                          {divisionEntries.length === 0 ? (
                            <p className="text-sm text-gray-500 italic py-4">No entries in this division</p>
                          ) : (
                            divisionEntries.map((entry) => (
                              <EntryCard
                                key={entry.id}
                                entry={entry}
                                onStatusChange={handleStatusChange}
                                isAdmin={isAdmin}
                              />
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-gray-900 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-800">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Club</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Division</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Category</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Weight</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Status</th>
                        {isAdmin && <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {entries.map((entry) => {
                        const isTeam = entry.entryType === "TEAM_KATA" || entry.entryType === "TEAM_KUMITE";
                        return (
                          <tr key={entry.id} className="hover:bg-gray-800">
                            <td className="px-4 py-3 text-sm">
                              {isTeam && entry.team
                                ? entry.team.name
                                : entry.athlete
                                ? `${entry.athlete.firstName} ${entry.athlete.lastName}`
                                : "Unknown"}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-400">{entry.club.name}</td>
                            <td className="px-4 py-3 text-sm text-gray-400">{entry.division.name}</td>
                            <td className="px-4 py-3 text-sm">
                              <span className={CATEGORY_STYLES[entry.division.category].text}>
                                {entry.division.category}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-400">
                              {isTeam ? "Team" : "Individual"}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-400">
                              {entry.weightClass?.name || "-"}
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge status={entry.status} />
                            </td>
                            {isAdmin && (
                              <td className="px-4 py-3">
                                {entry.status === "SUBMITTED" && (
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => handleStatusChange(entry.id, "APPROVED")}
                                      className="px-2 py-1 bg-green-600 hover:bg-green-500 rounded text-xs"
                                    >
                                      ✓
                                    </button>
                                    <button
                                      onClick={() => handleStatusChange(entry.id, "RETURNED")}
                                      className="px-2 py-1 bg-red-600 hover:bg-red-500 rounded text-xs"
                                    >
                                      ↩
                                    </button>
                                  </div>
                                )}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default EntriesView;
