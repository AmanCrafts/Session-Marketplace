import { getSupabase } from "./supabase";
import type { MeResponse, Profile } from "./types";
import { api } from "./axios";

export async function getMe(): Promise<MeResponse> {
  const { data } = await api.get<MeResponse>("/me/full");
  return data;
}

export async function getProfile(): Promise<Profile> {
  const { data } = await api.get<Profile>("/me/profile");
  return data;
}

export async function updateProfile(payload: {
  full_name?: string;
  avatar_url?: string;
  bio?: string;
}): Promise<Profile> {
  const { data } = await api.patch<Profile>("/me/profile", payload);
  return data;
}

export async function signInWithOAuth(
  provider: "google" | "github"
): Promise<void> {
  const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
  await getSupabase().auth.signInWithOAuth({
    provider,
    options: { redirectTo: `${appUrl}/auth/callback` },
  });
}

export async function signOut(): Promise<void> {
  await getSupabase().auth.signOut();
}
