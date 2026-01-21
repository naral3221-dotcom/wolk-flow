import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Users, Check, Calendar, MapPin, Paperclip, Trash2, Upload } from 'lucide-react';
import { cn } from '@/core/utils/cn';
import { useMeetingStore } from '@/stores/meetingStore';
import { useProjectStore } from '@/stores/projectStore';
import { useMemberStore } from '@/stores/memberStore';
import { useUIStore } from '@/stores/uiStore';
import type { MeetingStatus } from '@/types';

type TabType = 'basic' | 'content' | 'attachments';

export function MeetingFormModal() {
  const { isMeetingModalOpen, editingMeeting, closeMeetingModal } = useUIStore();
  const { addMeeting, updateMeeting, uploadAttachments, deleteAttachment } = useMeetingStore();
  const { projects } = useProjectStore();
  const { members } = useMemberStore();

  const [activeTab, setActiveTab] = useState<TabType>('basic');
  const [formData, setFormData] = useState({
    title: '',
    meetingDate: '',
    location: '',
    projectId: '' as string | number,
    content: '',
    summary: '',
    attendeeIds: [] as number[],
    status: 'DRAFT' as MeetingStatus,
  });
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAttendeeDropdown, setShowAttendeeDropdown] = useState(false);

  const isEditing = !!editingMeeting;

  useEffect(() => {
    if (editingMeeting) {
      setFormData({
        title: editingMeeting.title,
        meetingDate: editingMeeting.meetingDate.slice(0, 16), // datetime-local format
        location: editingMeeting.location || '',
        projectId: editingMeeting.projectId || '',
        content: editingMeeting.content,
        summary: editingMeeting.summary || '',
        attendeeIds: editingMeeting.attendees.map(a => a.memberId),
        status: editingMeeting.status,
      });
      setPendingFiles([]);
    } else {
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      setFormData({
        title: '',
        meetingDate: now.toISOString().slice(0, 16),
        location: '',
        projectId: '',
        content: '',
        summary: '',
        attendeeIds: [],
        status: 'DRAFT',
      });
      setPendingFiles([]);
    }
    setActiveTab('basic');
    setError(null);
  }, [editingMeeting, isMeetingModalOpen]);

  const toggleAttendee = (memberId: string) => {
    const numericId = Number(memberId);
    setFormData(prev => ({
      ...prev,
      attendeeIds: prev.attendeeIds.includes(numericId)
        ? prev.attendeeIds.filter(id => id !== numericId)
        : [...prev.attendeeIds, numericId]
    }));
  };

  const removeAttendee = (memberId: string) => {
    const numericId = Number(memberId);
    setFormData(prev => ({
      ...prev,
      attendeeIds: prev.attendeeIds.filter(id => id !== numericId)
    }));
  };

  const selectedAttendees = members.filter(m => formData.attendeeIds.includes(Number(m.id)));

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setPendingFiles(prev => [...prev, ...files]);
    e.target.value = '';
  };

  const removePendingFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDeleteExistingAttachment = async (attachmentId: number) => {
    if (!editingMeeting) return;
    try {
      await deleteAttachment(editingMeeting.id, attachmentId);
    } catch (err) {
      console.error('Failed to delete attachment:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent, status: MeetingStatus = formData.status) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      setError('회의 제목을 입력해주세요.');
      setActiveTab('basic');
      return;
    }

    if (!formData.meetingDate) {
      setError('회의 일시를 선택해주세요.');
      setActiveTab('basic');
      return;
    }

    if (!formData.content.trim()) {
      setError('회의 내용을 입력해주세요.');
      setActiveTab('content');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const meetingData = {
        title: formData.title.trim(),
        meetingDate: new Date(formData.meetingDate).toISOString(),
        location: formData.location.trim() || undefined,
        projectId: formData.projectId ? Number(formData.projectId) : undefined,
        content: formData.content,
        summary: formData.summary.trim() || undefined,
        attendeeIds: formData.attendeeIds,
        status,
      };

      if (isEditing && editingMeeting) {
        await updateMeeting(editingMeeting.id, meetingData);

        // 새 파일 업로드
        if (pendingFiles.length > 0) {
          await uploadAttachments(editingMeeting.id, pendingFiles);
        }
      } else {
        const newMeeting = await addMeeting(meetingData);

        // 새 파일 업로드
        if (pendingFiles.length > 0) {
          await uploadAttachments(newMeeting.id, pendingFiles);
        }
      }

      closeMeetingModal();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    closeMeetingModal();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (!isMeetingModalOpen) return null;

  return (
    <AnimatePresence>
      {isMeetingModalOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal */}
          <motion.div
            className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl border border-white/10 bg-dark-surface/95 shadow-2xl"
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-neon-violet/20 to-neon-teal/20">
                  <FileText className="w-5 h-5 text-neon-violet" />
                </div>
                <h2 className="text-xl font-semibold text-white">
                  {isEditing ? '회의자료 수정' : '새 회의자료'}
                </h2>
              </div>
              <button
                onClick={handleClose}
                className="p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/10">
              {[
                { id: 'basic', label: '기본 정보', icon: Calendar },
                { id: 'content', label: '회의 내용', icon: FileText },
                { id: 'attachments', label: '첨부파일', icon: Paperclip },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors',
                    activeTab === tab.id
                      ? 'text-neon-violet border-b-2 border-neon-violet'
                      : 'text-gray-400 hover:text-white'
                  )}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <form onSubmit={(e) => handleSubmit(e)} className="overflow-y-auto max-h-[60vh]">
              <div className="p-6 space-y-6">
                {/* Error Message */}
                {error && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {error}
                  </div>
                )}

                {/* Basic Info Tab */}
                {activeTab === 'basic' && (
                  <div className="space-y-4">
                    {/* 제목 */}
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">
                        회의 제목 <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="회의 제목을 입력하세요"
                        className="w-full px-4 py-3 bg-dark-bg/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-violet/50"
                        autoFocus
                      />
                    </div>

                    {/* 일시 */}
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">
                        회의 일시 <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.meetingDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, meetingDate: e.target.value }))}
                        className="w-full px-4 py-3 bg-dark-bg/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-neon-violet/50"
                      />
                    </div>

                    {/* 장소 */}
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">장소</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                          type="text"
                          value={formData.location}
                          onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                          placeholder="예: 회의실 A, Zoom 등"
                          className="w-full pl-10 pr-4 py-3 bg-dark-bg/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-violet/50"
                        />
                      </div>
                    </div>

                    {/* 프로젝트 */}
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">관련 프로젝트</label>
                      <select
                        value={formData.projectId}
                        onChange={(e) => setFormData(prev => ({ ...prev, projectId: e.target.value }))}
                        className="w-full px-4 py-3 bg-dark-bg/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-neon-violet/50"
                      >
                        <option value="">프로젝트 선택 (선택사항)</option>
                        {projects.map((project) => (
                          <option key={project.id} value={project.id}>
                            {project.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 참석자 */}
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">참석자</label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowAttendeeDropdown(!showAttendeeDropdown)}
                          className="w-full px-4 py-3 bg-dark-bg/50 border border-white/10 rounded-lg text-left flex items-center justify-between focus:outline-none focus:border-neon-violet/50"
                        >
                          <span className="text-gray-400">
                            {selectedAttendees.length > 0
                              ? `${selectedAttendees.length}명 선택됨`
                              : '참석자 선택'}
                          </span>
                          <Users className="w-5 h-5 text-gray-500" />
                        </button>

                        {showAttendeeDropdown && (
                          <div className="absolute z-10 w-full mt-2 py-2 bg-dark-bg border border-white/10 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                            {members.map((member) => (
                              <button
                                key={member.id}
                                type="button"
                                onClick={() => toggleAttendee(member.id)}
                                className="w-full px-4 py-2 flex items-center gap-3 hover:bg-white/5 transition-colors"
                              >
                                <div className={cn(
                                  'w-5 h-5 rounded border flex items-center justify-center',
                                  formData.attendeeIds.includes(Number(member.id))
                                    ? 'bg-neon-violet border-neon-violet'
                                    : 'border-gray-600'
                                )}>
                                  {formData.attendeeIds.includes(Number(member.id)) && (
                                    <Check className="w-3 h-3 text-white" />
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-neon-violet to-neon-teal flex items-center justify-center text-xs font-medium text-white">
                                    {member.avatarUrl ? (
                                      <img src={member.avatarUrl} alt={member.name} className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                      member.name.charAt(0)
                                    )}
                                  </div>
                                  <div className="text-left">
                                    <p className="text-sm text-white">{member.name}</p>
                                    {member.position && (
                                      <p className="text-xs text-gray-500">{member.position}</p>
                                    )}
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* 선택된 참석자 표시 */}
                      {selectedAttendees.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedAttendees.map((attendee) => (
                            <span
                              key={attendee.id}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-neon-violet/20 text-neon-violet rounded text-sm"
                            >
                              {attendee.name}
                              <button
                                type="button"
                                onClick={() => removeAttendee(attendee.id)}
                                className="hover:text-red-400"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Content Tab */}
                {activeTab === 'content' && (
                  <div className="space-y-4">
                    {/* 회의 내용 */}
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">
                        회의 내용 <span className="text-red-400">*</span>
                      </label>
                      <textarea
                        value={formData.content}
                        onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                        placeholder="회의 내용을 작성하세요..."
                        rows={12}
                        className="w-full px-4 py-3 bg-dark-bg/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-violet/50 resize-none"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        * 추후 리치 에디터(WYSIWYG)로 업그레이드 예정
                      </p>
                    </div>

                    {/* 결정사항/요약 */}
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">결정사항 / 요약</label>
                      <textarea
                        value={formData.summary}
                        onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
                        placeholder="주요 결정사항이나 요약을 입력하세요..."
                        rows={4}
                        className="w-full px-4 py-3 bg-dark-bg/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-violet/50 resize-none"
                      />
                    </div>
                  </div>
                )}

                {/* Attachments Tab */}
                {activeTab === 'attachments' && (
                  <div className="space-y-4">
                    {/* 파일 업로드 영역 */}
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">첨부파일</label>
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/20 rounded-lg cursor-pointer hover:border-neon-violet/50 transition-colors">
                        <div className="flex flex-col items-center">
                          <Upload className="w-8 h-8 text-gray-500 mb-2" />
                          <p className="text-sm text-gray-400">클릭하여 파일 선택</p>
                          <p className="text-xs text-gray-500 mt-1">최대 10MB</p>
                        </div>
                        <input
                          type="file"
                          multiple
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* 대기 중인 파일 */}
                    {pendingFiles.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-400 mb-2">업로드 대기 중</p>
                        <div className="space-y-2">
                          {pendingFiles.map((file, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 bg-dark-bg/50 border border-white/10 rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <Paperclip className="w-4 h-4 text-gray-500" />
                                <div>
                                  <p className="text-sm text-white">{file.name}</p>
                                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => removePendingFile(index)}
                                className="p-1 hover:bg-red-500/20 rounded transition-colors"
                              >
                                <Trash2 className="w-4 h-4 text-red-400" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 기존 첨부파일 (수정 모드) */}
                    {isEditing && editingMeeting?.attachments && editingMeeting.attachments.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-400 mb-2">기존 첨부파일</p>
                        <div className="space-y-2">
                          {editingMeeting.attachments.map((attachment) => (
                            <div
                              key={attachment.id}
                              className="flex items-center justify-between p-3 bg-dark-bg/50 border border-white/10 rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <Paperclip className="w-4 h-4 text-gray-500" />
                                <div>
                                  <p className="text-sm text-white">{attachment.fileName}</p>
                                  <p className="text-xs text-gray-500">{formatFileSize(attachment.fileSize)}</p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleDeleteExistingAttachment(attachment.id)}
                                className="p-1 hover:bg-red-500/20 rounded transition-colors"
                              >
                                <Trash2 className="w-4 h-4 text-red-400" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between p-6 border-t border-white/10 bg-dark-bg/30">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  disabled={loading}
                >
                  취소
                </button>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={(e) => handleSubmit(e, 'DRAFT')}
                    disabled={loading}
                    className="px-4 py-2 border border-white/10 rounded-lg text-white hover:bg-white/5 transition-colors disabled:opacity-50"
                  >
                    임시저장
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleSubmit(e, 'PUBLISHED')}
                    disabled={loading}
                    className="px-6 py-2 bg-gradient-to-r from-neon-violet to-neon-teal rounded-lg text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {loading ? '저장 중...' : isEditing ? '수정' : '게시'}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
