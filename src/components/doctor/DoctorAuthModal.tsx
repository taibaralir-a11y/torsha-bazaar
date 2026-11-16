import React from 'react';
import { Doctor, LocalityInfo, PartnerAccount } from '../../types';
import { PartnerAuthModal } from '../common/PartnerAuthModal';

interface DoctorAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (account: PartnerAccount) => void;
  doctors?: Doctor[];
  localities?: LocalityInfo[];
}

export const DoctorAuthModal: React.FC<DoctorAuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess
}) => {
  return (
    <PartnerAuthModal
      isOpen={isOpen}
      onClose={onClose}
      expectedRole="doctor"
      onLoginSuccess={onLoginSuccess}
    />
  );
};
