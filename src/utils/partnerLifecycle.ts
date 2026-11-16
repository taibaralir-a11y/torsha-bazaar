import {
  DeliveryPerson,
  Doctor,
  Driver,
  PartnerAccount,
  PartnerAccountStatus,
  PartnerRoleType,
  ServiceProvider,
  Shop,
  ShopApprovalStatus,
  ShopCategoryType
} from '../types.ts';

/**
 * Maps human-readable shop category labels to canonical ShopCategoryType values.
 */
export function resolveShopTypeFromCategory(category: string): ShopCategoryType {
  const normalized = (category || '').trim().toLowerCase();
  if (normalized.includes('medical') || normalized.includes('pharmacy') || normalized.includes('medicine') || normalized.includes('chemist')) {
    return 'medical';
  }
  if (normalized.includes('meat') || normalized.includes('chicken') || normalized.includes('mutton') || normalized.includes('fish')) {
    return 'meat';
  }
  if (normalized.includes('mobile') || normalized.includes('phone') || normalized.includes('accessor') || normalized.includes('electronics')) {
    return 'mobile';
  }
  if (normalized.includes('grocery') || normalized.includes('kirana') || normalized.includes('ration') || normalized.includes('vegetable')) {
    return 'grocery';
  }
  return 'general';
}

/**
 * Determines the safe entity status when Super Admin reactivates a suspended partner account.
 * CRITICAL SECURITY INVARIANT:
 * - Only restore to 'approved' if the entity was previously valid/approved (or unknown legacy 'suspended' without record? No — be safe: require explicit 'approved'!).
 * - Never auto-approve an entity that was 'rejected' or 'pending'.
 */
export function computeReactivatedEntityStatus(
  previousStatus: ShopApprovalStatus | undefined,
  currentStatus: ShopApprovalStatus | undefined
): ShopApprovalStatus {
  if (currentStatus === 'rejected') {
    return 'rejected';
  }
  if (previousStatus === 'rejected') {
    return 'rejected';
  }
  if (previousStatus === 'pending') {
    return 'pending';
  }
  if (previousStatus === 'approved') {
    return 'approved';
  }
  // If entity is currently still 'approved' (e.g., partial failure previously), keep 'approved';
  // otherwise fallback to 'pending' so rejected/unknown entities cannot bypass approval.
  if (currentStatus === 'approved') {
    return 'approved';
  }
  return 'pending';
}

export interface ChunkedProductSyncResult {
  totalProducts: number;
  totalChunks: number;
  completedChunks: number;
  failedChunkIndex?: number;
  error?: string;
}

/**
 * Computes unified account + linked entity patch data for suspending or reactivating a partner account.
 * Preserves pre-suspension entity approval status so reactivation never auto-approves rejected/pending profiles,
 * and signals clearing suspendedEntityPreviousStatus once reactivated to 'active'.
 */
export function buildAccountStatusSyncPlan(params: {
  account: PartnerAccount;
  targetStatus: PartnerAccountStatus;
  currentEntityStatus?: ShopApprovalStatus;
  now?: string;
}): {
  accountPatch: {
    status: PartnerAccountStatus;
    updatedAt: string;
    suspendedEntityPreviousStatus?: ShopApprovalStatus;
  };
  nextEntityStatus: ShopApprovalStatus | undefined;
  clearSuspendedPreviousStatus: boolean;
} {
  const { account, targetStatus, currentEntityStatus, now = new Date().toISOString() } = params;

  if (targetStatus === 'suspended') {
    // Only record non-suspended status so double-suspends don't overwrite the real prior approval state
    const priorStatus: ShopApprovalStatus | undefined =
      currentEntityStatus && currentEntityStatus !== 'suspended'
        ? currentEntityStatus
        : account.suspendedEntityPreviousStatus || currentEntityStatus;

    return {
      accountPatch: {
        status: 'suspended',
        updatedAt: now,
        ...(priorStatus ? { suspendedEntityPreviousStatus: priorStatus } : {})
      },
      nextEntityStatus: currentEntityStatus !== undefined ? 'suspended' : undefined,
      clearSuspendedPreviousStatus: false
    };
  }

  // Reactivating to 'active'
  const restoredStatus =
    currentEntityStatus !== undefined
      ? computeReactivatedEntityStatus(account.suspendedEntityPreviousStatus, currentEntityStatus)
      : undefined;

  return {
    accountPatch: {
      status: 'active',
      updatedAt: now
    },
    nextEntityStatus: restoredStatus,
    clearSuspendedPreviousStatus: true
  };
}

/**
 * Bidirectional helper: maps an Admin entity status change ('approved' | 'pending' | 'rejected' | 'suspended')
 * to the corresponding PartnerAccount status without losing history.
 */
export function resolvePartnerAccountStatusForEntityStatus(
  entityStatus: ShopApprovalStatus,
  currentAccountStatus?: PartnerAccountStatus
): PartnerAccountStatus | undefined {
  if (entityStatus === 'suspended' || entityStatus === 'rejected') {
    return 'suspended';
  }
  if (entityStatus === 'approved') {
    return 'active';
  }
  // For 'pending', preserve 'active' if account was active so pending profile awaits review
  return currentAccountStatus;
}

/**
 * Builds the PartnerAccount update plan when Admin changes an entity's status directly
 * (e.g. from the Shops, Drivers, Delivery, Doctors, or Providers tabs), ensuring
 * stale `suspendedEntityPreviousStatus` never causes future auto-approval after rejection/pending transitions.
 */
export function buildManualEntityStatusAccountPatch(params: {
  entityStatus: ShopApprovalStatus;
  currentAccount: PartnerAccount;
  previousEntityStatus?: ShopApprovalStatus;
  now?: string;
}): {
  status: PartnerAccountStatus;
  suspendedEntityPreviousStatus?: ShopApprovalStatus;
  clearSuspendedPreviousStatus: boolean;
  updatedAt: string;
} {
  const { entityStatus, currentAccount, previousEntityStatus, now = new Date().toISOString() } = params;
  const resolvedAccountStatus =
    resolvePartnerAccountStatusForEntityStatus(entityStatus, currentAccount.status) || currentAccount.status;

  if (entityStatus === 'suspended') {
    const priorStatus: ShopApprovalStatus | undefined =
      previousEntityStatus && previousEntityStatus !== 'suspended'
        ? previousEntityStatus
        : currentAccount.suspendedEntityPreviousStatus || previousEntityStatus;
    return {
      status: 'suspended',
      ...(priorStatus ? { suspendedEntityPreviousStatus: priorStatus } : {}),
      clearSuspendedPreviousStatus: false,
      updatedAt: now
    };
  }

  if (entityStatus === 'pending' && currentAccount.status === 'suspended') {
    return {
      status: 'suspended',
      suspendedEntityPreviousStatus: 'pending',
      clearSuspendedPreviousStatus: false,
      updatedAt: now
    };
  }

  // 'approved', 'rejected', or 'pending' on an active account: clear any stale prior-status memory
  return {
    status: resolvedAccountStatus,
    clearSuspendedPreviousStatus: true,
    updatedAt: now
  };
}

/**
 * Runtime guard used across UI portals & listeners to confirm a partner session is operational.
 */
export function isPartnerAccountOperational(
  account: PartnerAccount | null | undefined,
  requiredRole: PartnerRoleType,
  entityStatus?: ShopApprovalStatus
): boolean {
  if (!account || account.status !== 'active' || account.role !== requiredRole) {
    return false;
  }
  if (entityStatus && entityStatus !== 'approved') {
    return false;
  }
  return true;
}

/**
 * Determines whether a Shopkeeper can mutate catalog products in the UI.
 * Strictly requires non-empty linkedEntityId matching shop.id and ownerId matching uid.
 */
export function canShopkeeperMutateCatalog(params: {
  isAdmin: boolean;
  account: PartnerAccount | null | undefined;
  shop: Shop | null | undefined;
}): boolean {
  if (params.isAdmin) return true;
  if (!params.shop || !params.shop.id || params.shop.status !== 'approved') return false;
  if (!params.account || params.account.status !== 'active' || params.account.role !== 'shopkeeper') return false;
  if (!params.account.linkedEntityId || params.account.linkedEntityId !== params.shop.id) return false;
  if (!params.shop.ownerId || params.shop.ownerId !== params.account.uid) return false;
  return true;
}

/**
 * Determines whether a partner entity is blocked/suspended for UI lock screens & operational guards.
 */
export function isEntityBlockedOrSuspended(
  entity: Pick<Shop | Driver | DeliveryPerson | Doctor | ServiceProvider, 'status'> | null | undefined,
  account?: PartnerAccount | null
): boolean {
  if (account && account.status === 'suspended') return true;
  if (entity && (entity.status === 'suspended' || entity.status === 'rejected')) return true;
  return false;
}
