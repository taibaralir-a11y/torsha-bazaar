/**
 * Pure list eviction & Admin/Partner session cleanup helpers.
 */

export function mergeWithRemoteEvictionList<T extends { id: string }>(
  localList: T[],
  remoteList: T[],
  syncedIds: Set<string>
): { nextList: T[]; nextSyncedIds: Set<string> } {
  const nextRemoteIds = new Set(remoteList.map((item) => item.id));
  const removedRemoteIds = new Set(
    Array.from(syncedIds).filter((id) => !nextRemoteIds.has(id))
  );

  const retained = localList.filter((item) => !removedRemoteIds.has(item.id));
  if (remoteList.length === 0) {
    return { nextList: retained, nextSyncedIds: nextRemoteIds };
  }

  const remoteMap = new Map(remoteList.map((item) => [item.id, item]));
  const updatedLocal = retained.map((item) => remoteMap.get(item.id) || item);
  const newRemote = remoteList.filter((item) => !retained.some((l) => l.id === item.id));
  return {
    nextList: [...newRemote, ...updatedLocal],
    nextSyncedIds: nextRemoteIds
  };
}

/**
 * Reconciles an owned sub-slice (e.g. an employer's own jobs or applicant's own job applications)
 * inside a combined directory array without retaining stale remote deletions when snapshot is empty.
 */
export function reconcileScopedRemoteSlice<T extends { id: string }>(
  currentList: T[],
  remoteSlice: T[],
  belongsToScope: (item: T) => boolean
): T[] {
  const others = currentList.filter((item) => !belongsToScope(item));
  return [...remoteSlice, ...others];
}
