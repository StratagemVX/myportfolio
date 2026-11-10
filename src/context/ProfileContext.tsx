import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';
import type { OwnerSecurityProfile } from '../../server/types';
import projectsData from '../data/projects.json';

interface ProfileContextType {
  profile: OwnerSecurityProfile | null;
  displayName: string;
  legalName: string;
  professionalTitle: string;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: {
    preferredDisplayName?: string;
    displayName?: string;
    legalName?: string;
    fullName?: string;
    professionalTitle?: string;
    location?: string;
  }) => Promise<OwnerSecurityProfile>;
}

const ProfileContext = createContext<ProfileContextType>({
  profile: null,
  displayName: projectsData.owner.displayName || 'Karna',
  legalName: projectsData.owner.fullName || 'Chethan Kumar B S',
  professionalTitle: projectsData.owner.title,
  loading: false,
  refreshProfile: async () => {},
  updateProfile: async () => ({} as OwnerSecurityProfile)
});

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<OwnerSecurityProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const res = await apiClient.getProfile();
      if (res && res.profile) {
        setProfile(res.profile);
      }
    } catch {
      // Fallback if offline
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only invoke API profile synchronization if an active owner session exists or on admin route,
    // avoiding unnecessary critical-path network latency and re-renders for public visitors.
    if (typeof window !== 'undefined' && (apiClient.getSessionToken() || window.location.pathname.startsWith('/admin'))) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const updateProfile = async (updates: {
    preferredDisplayName?: string;
    displayName?: string;
    legalName?: string;
    fullName?: string;
    professionalTitle?: string;
    location?: string;
  }): Promise<OwnerSecurityProfile> => {
    const res = await apiClient.updateProfile(updates);
    if (res && res.profile) {
      setProfile(res.profile);
      return res.profile;
    }
    throw new Error('Failed to update profile.');
  };

  const displayName = profile?.preferredDisplayName || profile?.displayName || projectsData.owner.displayName || 'Karna';
  const legalName = profile?.legalName || profile?.fullName || projectsData.owner.fullName || 'Chethan Kumar B S';
  const professionalTitle = profile?.professionalTitle || projectsData.owner.title;

  return (
    <ProfileContext.Provider
      value={{
        profile,
        displayName,
        legalName,
        professionalTitle,
        loading,
        refreshProfile: fetchProfile,
        updateProfile
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  return useContext(ProfileContext);
}
