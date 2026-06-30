import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getProfile, updateProfile } from "../../shared/api/auth";

const KEY = ["profile", "me"] as const;

export function useProfile() {
  return useQuery({
    queryKey: KEY,
    queryFn: getProfile,
    staleTime: 60_000,
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      full_name?: string;
      avatar_url?: string;
      bio?: string;
    }) => updateProfile(payload),
    onSuccess: (data) => {
      qc.setQueryData(KEY, data);
      qc.invalidateQueries({ queryKey: ["me"] });
    },
  });
}
