import type { MobileProfileViewData } from "@gynecology-chatbot/app-core";
import { useSyncExternalStore } from "react";

type PatientProfileSyncSnapshot = {
  profile: MobileProfileViewData | null;
  version: number;
};

let snapshot: PatientProfileSyncSnapshot = {
  profile: null,
  version: 0,
};

const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function readSnapshot() {
  return snapshot;
}

export function usePatientProfileSyncSnapshot() {
  return useSyncExternalStore(subscribe, readSnapshot, readSnapshot);
}

export function publishPatientProfileSyncProfile(
  profile: MobileProfileViewData | null,
) {
  snapshot = {
    profile,
    version: snapshot.version + 1,
  };
  emitChange();
}

export function mergePatientProfileSyncSnapshot(
  profile: MobileProfileViewData | null,
  syncedProfile: MobileProfileViewData | null,
  userId?: string,
) {
  if (!syncedProfile) {
    return profile;
  }

  if (userId) {
    if (syncedProfile.userId !== userId) {
      return profile;
    }
  } else if (!profile || profile.userId !== syncedProfile.userId) {
    return profile;
  }

  if (!profile) {
    return syncedProfile;
  }

  return {
    ...profile,
    ...syncedProfile,
  };
}
