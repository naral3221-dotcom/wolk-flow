import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Plus,
  Search,
  Calendar,
  Filter,
  RefreshCw,
  Users,
  Paperclip,
  MessageSquare,
  MapPin,
  ChevronDown,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import { SpatialCard } from "../components/ui/SpatialCard";
import { AnimatedSection, FloatingElement } from "../components/effects/AnimatedSection";
import { MagneticButton } from "../components/effects/MagneticButton";
import { useMeetingStore } from "@/stores/meetingStore";
import { useProjectStore } from "@/stores/projectStore";
import { useMemberStore } from "@/stores/memberStore";
import { useUIStore } from "@/stores/uiStore";
import type { Meeting, MeetingFilters, MeetingStatus } from "@/types";

export function MeetingsPage() {
  const {
    meetings,
    loading,
    filters,
    fetchMeetings,
    setFilters,
    clearFilters,
    getThisWeekMeetings,
    getThisMonthMeetings,
  } = useMeetingStore();
  const { projects } = useProjectStore();
  const { members } = useMemberStore();
  const {
    openCreateMeetingModal,
    openMeetingDetailModal,
  } = useUIStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  // 필터링된 회의자료
  const filteredMeetings = useMemo(() => {
    let result = meetings;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (m) =>
          m.title.toLowerCase().includes(query) ||
          m.content.toLowerCase().includes(query) ||
          m.summary?.toLowerCase().includes(query)
      );
    }

    if (filters.projectId) {
      result = result.filter((m) => m.projectId === filters.projectId);
    }

    if (filters.authorId) {
      result = result.filter((m) => m.authorId === filters.authorId);
    }

    if (filters.status) {
      result = result.filter((m) => m.status === filters.status);
    }

    return result;
  }, [meetings, searchQuery, filters]);

  // 통계 계산
  const stats = useMemo(() => {
    const thisWeek = getThisWeekMeetings();
    const thisMonth = getThisMonthMeetings();
    return {
      total: meetings.length,
      thisWeek: thisWeek.length,
      thisMonth: thisMonth.length,
      published: meetings.filter((m) => m.status === "PUBLISHED").length,
      draft: meetings.filter((m) => m.status === "DRAFT").length,
    };
  }, [meetings, getThisWeekMeetings, getThisMonthMeetings]);

  const handleFilterChange = (key: keyof MeetingFilters, value: string | undefined) => {
    setFilters({
      ...filters,
      [key]: value || undefined,
    });
  };

  if (loading && meetings.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <FloatingElement floatIntensity={15} rotateIntensity={5}>
          <div className="flex flex-col items-center gap-4">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-neon-violet border-t-transparent" />
            <p className="text-gray-400 animate-pulse">회의자료를 불러오는 중...</p>
          </div>
        </FloatingElement>
      </div>
    );
  }

  return (
    <motion.div
      className="p-8 w-full h-full overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <AnimatedSection animation="fadeInDown" className="mb-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <FloatingElement floatIntensity={3} rotateIntensity={1} duration={6}>
              <motion.h1
                className="text-4xl font-bold text-white mb-2 tracking-tight flex items-center gap-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <FileText className="w-10 h-10 text-neon-violet" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-violet to-neon-teal">
                  회의자료
                </span>
              </motion.h1>
            </FloatingElement>
            <p className="text-gray-400">
              총 {stats.total}개의 회의자료 | 이번주 {stats.thisWeek}건, 이번달 {stats.thisMonth}건
            </p>
          </div>

          <div className="flex items-center gap-3">
            <MagneticButton
              variant="ghost"
              size="md"
              magneticStrength={0.3}
              onClick={() => fetchMeetings()}
            >
              <RefreshCw className="w-4 h-4" />
            </MagneticButton>
            <MagneticButton
              variant="primary"
              size="md"
              magneticStrength={0.4}
              onClick={openCreateMeetingModal}
            >
              <Plus className="w-4 h-4 mr-2" />
              새 회의자료
            </MagneticButton>
          </div>
        </header>
      </AnimatedSection>

      {/* Stats Cards */}
      <AnimatedSection animation="fadeIn" delay={0.1} className="mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SpatialCard className="p-4 cursor-pointer hover:border-neon-violet/50 transition-colors">
            <div className="text-center">
              <p className="text-3xl font-bold text-white">{stats.total}</p>
              <p className="text-sm text-gray-400">전체</p>
            </div>
          </SpatialCard>
          <SpatialCard className="p-4 cursor-pointer hover:border-neon-teal/50 transition-colors">
            <div className="text-center">
              <p className="text-3xl font-bold text-neon-teal">{stats.thisWeek}</p>
              <p className="text-sm text-gray-400">이번주</p>
            </div>
          </SpatialCard>
          <SpatialCard className="p-4 cursor-pointer hover:border-neon-violet/50 transition-colors">
            <div className="text-center">
              <p className="text-3xl font-bold text-neon-violet">{stats.thisMonth}</p>
              <p className="text-sm text-gray-400">이번달</p>
            </div>
          </SpatialCard>
          <SpatialCard className="p-4 cursor-pointer hover:border-yellow-500/50 transition-colors">
            <div className="text-center">
              <p className="text-3xl font-bold text-yellow-400">{stats.draft}</p>
              <p className="text-sm text-gray-400">임시저장</p>
            </div>
          </SpatialCard>
        </div>
      </AnimatedSection>

      {/* Search & Filters */}
      <AnimatedSection animation="fadeIn" delay={0.15} className="mb-6">
        <SpatialCard className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* 검색 */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="회의자료 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-dark-bg/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-violet/50"
              />
            </div>

            {/* 필터 토글 */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                showFilters
                  ? "border-neon-violet/50 bg-neon-violet/10 text-neon-violet"
                  : "border-white/10 text-gray-400 hover:border-white/20"
              }`}
            >
              <Filter className="w-4 h-4" />
              필터
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
            </button>
          </div>

          {/* 필터 옵션 */}
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 pt-4 border-t border-white/10"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 프로젝트 필터 */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">프로젝트</label>
                  <select
                    value={filters.projectId || ""}
                    onChange={(e) => handleFilterChange("projectId", e.target.value)}
                    className="w-full px-3 py-2 bg-dark-bg/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-neon-violet/50"
                  >
                    <option value="">전체</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 작성자 필터 */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">작성자</label>
                  <select
                    value={filters.authorId || ""}
                    onChange={(e) => handleFilterChange("authorId", e.target.value)}
                    className="w-full px-3 py-2 bg-dark-bg/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-neon-violet/50"
                  >
                    <option value="">전체</option>
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 상태 필터 */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">상태</label>
                  <select
                    value={filters.status || ""}
                    onChange={(e) => handleFilterChange("status", e.target.value as MeetingStatus | "")}
                    className="w-full px-3 py-2 bg-dark-bg/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-neon-violet/50"
                  >
                    <option value="">전체</option>
                    <option value="PUBLISHED">게시됨</option>
                    <option value="DRAFT">임시저장</option>
                  </select>
                </div>
              </div>

              {/* 필터 초기화 */}
              {(filters.projectId || filters.authorId || filters.status) && (
                <button
                  onClick={clearFilters}
                  className="mt-4 text-sm text-neon-violet hover:underline"
                >
                  필터 초기화
                </button>
              )}
            </motion.div>
          )}
        </SpatialCard>
      </AnimatedSection>

      {/* Meeting List */}
      <AnimatedSection animation="fadeIn" delay={0.2}>
        <SpatialCard className="p-6">
          {filteredMeetings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <FileText className="w-16 h-16 text-gray-600 mb-4" />
              <p className="text-gray-500 text-lg mb-2">
                {searchQuery || filters.projectId || filters.authorId || filters.status
                  ? "검색 결과가 없습니다"
                  : "등록된 회의자료가 없습니다"}
              </p>
              <p className="text-gray-600 text-sm mb-4">
                {searchQuery || filters.projectId || filters.authorId || filters.status
                  ? "다른 검색어나 필터를 시도해보세요"
                  : "새 회의자료를 작성해보세요"}
              </p>
              {!searchQuery && !filters.projectId && !filters.authorId && !filters.status && (
                <MagneticButton
                  variant="primary"
                  size="md"
                  magneticStrength={0.4}
                  onClick={openCreateMeetingModal}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  새 회의자료 작성
                </MagneticButton>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMeetings.map((meeting, index) => (
                <MeetingCard
                  key={meeting.id}
                  meeting={meeting}
                  index={index}
                  onClick={() => openMeetingDetailModal(meeting)}
                />
              ))}
            </div>
          )}
        </SpatialCard>
      </AnimatedSection>
    </motion.div>
  );
}

// Meeting Card Component
interface MeetingCardProps {
  meeting: Meeting;
  index: number;
  onClick: () => void;
}

function MeetingCard({ meeting, index, onClick }: MeetingCardProps) {
  const meetingDate = parseISO(meeting.meetingDate);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className="group p-4 rounded-lg border border-white/10 bg-dark-bg/30 hover:border-neon-violet/50 hover:bg-dark-bg/50 cursor-pointer transition-all"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* 제목 및 상태 */}
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-medium text-white truncate group-hover:text-neon-violet transition-colors">
              {meeting.title}
            </h3>
            {meeting.status === "DRAFT" && (
              <span className="px-2 py-0.5 text-xs font-medium bg-yellow-500/20 text-yellow-400 rounded">
                임시저장
              </span>
            )}
          </div>

          {/* 일시 및 장소 */}
          <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {format(meetingDate, "yyyy년 M월 d일 (EEE) HH:mm", { locale: ko })}
            </span>
            {meeting.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {meeting.location}
              </span>
            )}
          </div>

          {/* 참석자 */}
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-gray-500" />
            <div className="flex items-center -space-x-2">
              {meeting.attendees.slice(0, 5).map((attendee) => (
                <div
                  key={attendee.id}
                  className="w-7 h-7 rounded-full bg-gradient-to-br from-neon-violet to-neon-teal flex items-center justify-center text-xs font-medium text-white ring-2 ring-dark-surface"
                  title={attendee.member.name}
                >
                  {attendee.member.avatarUrl ? (
                    <img
                      src={attendee.member.avatarUrl}
                      alt={attendee.member.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    attendee.member.name.charAt(0)
                  )}
                </div>
              ))}
              {meeting.attendees.length > 5 && (
                <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-300 ring-2 ring-dark-surface">
                  +{meeting.attendees.length - 5}
                </div>
              )}
            </div>
            <span className="text-sm text-gray-500">
              {meeting.attendees.length}명 참석
            </span>
          </div>

          {/* 프로젝트 */}
          {meeting.project && (
            <div className="inline-flex items-center px-2 py-1 rounded bg-neon-violet/10 text-neon-violet text-xs">
              {meeting.project.name}
            </div>
          )}
        </div>

        {/* 메타 정보 */}
        <div className="flex flex-col items-end gap-2 text-sm text-gray-500">
          {(meeting._count?.attachments ?? 0) > 0 && (
            <span className="flex items-center gap-1">
              <Paperclip className="w-4 h-4" />
              {meeting._count?.attachments}
            </span>
          )}
          {(meeting._count?.comments ?? 0) > 0 && (
            <span className="flex items-center gap-1">
              <MessageSquare className="w-4 h-4" />
              {meeting._count?.comments}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
