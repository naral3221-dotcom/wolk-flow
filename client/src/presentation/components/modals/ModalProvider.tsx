import type { ReactNode } from 'react';
import { SpatialTaskModal } from './SpatialTaskModal';
import { SpatialProjectModal } from './SpatialProjectModal';
import { ProjectProgressModal } from './ProjectProgressModal';
import { InviteMemberModal } from './InviteMemberModal';
import { ConfirmModal } from './ConfirmModal';
import { SpatialTeamModal } from './SpatialTeamModal';
import { TeamMemberModal } from './TeamMemberModal';
import { RoutineModalWrapper } from './RoutineModalWrapper';
import { MeetingFormModal } from './MeetingFormModal';
import { MeetingDetailModal } from './MeetingDetailModal';
import { ContextMenu } from '../context-menu';

interface ModalProviderProps {
  children: ReactNode;
}

export function ModalProvider({ children }: ModalProviderProps) {
  return (
    <>
      {children}
      <SpatialTaskModal />
      <SpatialProjectModal />
      <ProjectProgressModal />
      <InviteMemberModal />
      <ConfirmModal />
      <SpatialTeamModal />
      <TeamMemberModal />
      <RoutineModalWrapper />
      <MeetingFormModal />
      <MeetingDetailModal />
      <ContextMenu />
    </>
  );
}
