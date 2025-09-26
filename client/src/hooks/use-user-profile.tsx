import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserProfile, PLAN_CONFIGS, PlanConfig } from "@shared/schema";
import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./use-auth";
import { getUserProfile, updateUserProfile } from "@/lib/supabase-service";

interface UserProfileContextType {
  profile: UserProfile | null;
  planConfig: PlanConfig | null;
  isLoading: boolean;
  error: Error | null;
  canPerformAction: (action: string, requirements?: { storage_mb?: number; image_count?: number }) => boolean;
  updateStorage: (deltas: { storage_mb_delta: number; image_count_delta: number }) => Promise<void>;
  isDemo: boolean;
  isBasic: boolean;
  isPremium: boolean;
  hasFeature: (feature: keyof PlanConfig['features']) => boolean;
  isReadOnly: boolean;
  isButtonDisabled: (buttonId: string) => boolean;
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

export function UserProfileProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Fetch user profile
  const {
    data: profileData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['user-profile'],
    queryFn: getUserProfile,
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (profileData) {
      setProfile(profileData as UserProfile);
    }
  }, [profileData]);

  // Update storage mutation
  const updateStorageMutation = useMutation({
    mutationFn: async (updates: Partial<UserProfile>) => {
      return await updateUserProfile(updates);
    },
    onSuccess: (updatedProfile) => {
      setProfile(updatedProfile);
      queryClient.setQueryData(['user-profile'], updatedProfile);
    }
  });

  // Note: Check limits now handled client-side since we have the profile data

  const planConfig = profile ? PLAN_CONFIGS[profile.plan_type] : null;

  const canPerformAction = (action: string, requirements?: { storage_mb?: number; image_count?: number }): boolean => {
    if (!profile || !planConfig) return false;

    // Demo plan restrictions
    if (profile.plan_type === 'demo') {
      if (['upload', 'save', 'add', 'create', 'edit', 'delete'].some(keyword => action.toLowerCase().includes(keyword))) {
        return false;
      }
    }

    // Storage and image limits
    if (requirements?.storage_mb && (profile.storage_used_mb + requirements.storage_mb) > profile.storage_limit_mb) {
      return false;
    }

    if (requirements?.image_count && (profile.image_count + requirements.image_count) > profile.image_limit) {
      return false;
    }

    return true;
  };

  const updateStorage = async (deltas: { storage_mb_delta: number; image_count_delta: number }) => {
    if (!profile) return;
    const updates = {
      storage_used_mb: profile.storage_used_mb + deltas.storage_mb_delta,
      image_count: profile.image_count + deltas.image_count_delta,
    };
    await updateStorageMutation.mutateAsync(updates);
  };

  const contextValue: UserProfileContextType = {
    profile,
    planConfig,
    isLoading,
    error: error as Error | null,
    canPerformAction,
    updateStorage,
    isDemo: profile?.plan_type === 'demo',
    isBasic: profile?.plan_type === 'basic',
    isPremium: profile?.plan_type === 'premium',
    hasFeature: (feature) => planConfig?.features[feature] ?? false,
    isReadOnly: planConfig?.ui_restrictions.read_only ?? false,
    isButtonDisabled: (buttonId) => planConfig?.ui_restrictions.disabled_buttons.includes(buttonId) ?? false,
  };

  return (
    <UserProfileContext.Provider value={contextValue}>
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile(): UserProfileContextType {
  const context = useContext(UserProfileContext);
  if (context === undefined) {
    throw new Error('useUserProfile must be used within a UserProfileProvider');
  }
  return context;
}

// Convenience hooks
export function usePlanFeatures() {
  const { planConfig } = useUserProfile();
  return planConfig?.features || {};
}

export function useStorageStatus() {
  const { profile } = useUserProfile();
  
  if (!profile) {
    return {
      usedMB: 0,
      limitMB: 0,
      usedImages: 0,
      limitImages: 0,
      storagePercentage: 0,
      imagePercentage: 0,
      isStorageFull: false,
      isImagesFull: false,
    };
  }

  const storagePercentage = profile.storage_limit_mb > 0 
    ? (profile.storage_used_mb / profile.storage_limit_mb) * 100 
    : 0;
  
  const imagePercentage = profile.image_limit > 0 
    ? (profile.image_count / profile.image_limit) * 100 
    : 0;

  return {
    usedMB: profile.storage_used_mb,
    limitMB: profile.storage_limit_mb,
    usedImages: profile.image_count,
    limitImages: profile.image_limit,
    storagePercentage,
    imagePercentage,
    isStorageFull: storagePercentage >= 100,
    isImagesFull: imagePercentage >= 100,
  };
}