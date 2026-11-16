import React from 'react';
import { Driver, LocalityInfo, PartnerAccount } from '../../types';
import { PartnerAuthModal } from '../common/PartnerAuthModal';

interface DriverAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  drivers?: Driver[];
  onLoginSuccess: (account: PartnerAccount) => void;
  localities?: LocalityInfo[];
}

export const DriverAuthModal: React.FC<DriverAuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess
}) => {
  return (
    <PartnerAuthModal
      isOpen={isOpen}
      onClose={onClose}
      expectedRole="driver"
      onLoginSuccess={onLoginSuccess}
    />
  );
};
