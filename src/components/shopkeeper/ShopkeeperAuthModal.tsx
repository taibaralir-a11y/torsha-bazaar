import React from 'react';
import { PartnerAccount, Shop, LocalityInfo } from '../../types';
import { PartnerAuthModal } from '../common/PartnerAuthModal';

interface ShopkeeperAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (account: PartnerAccount) => void;
  existingShop?: Shop;
  localities?: LocalityInfo[];
}

export const ShopkeeperAuthModal: React.FC<ShopkeeperAuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess
}) => {
  return (
    <PartnerAuthModal
      isOpen={isOpen}
      onClose={onClose}
      expectedRole="shopkeeper"
      onLoginSuccess={onLoginSuccess}
    />
  );
};
