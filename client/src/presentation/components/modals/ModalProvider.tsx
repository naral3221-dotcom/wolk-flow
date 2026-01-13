import type { ReactNode } from 'react';
import { SpatialTaskModal } from './SpatialTaskModal';
import { SpatialProjectModal } from './SpatialProjectModal';
import { InviteMemberModal } from './InviteMemberModal';
import { ConfirmModal } from './ConfirmModal';

interface ModalProviderProps {
  children: ReactNode;
}

export function ModalProvider({ children }: ModalProviderProps) {
  return (
    <>
      {children}
      <SpatialTaskModal />
      <SpatialProjectModal />
      <InviteMemberModal />
      <ConfirmModal />
    </>
  );
}
