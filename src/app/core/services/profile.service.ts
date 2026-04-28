import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface UserProfile {
  displayName: string;
  favoriteGenres: number[];
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private supabase = inject(SupabaseService);
  private _profile = signal<UserProfile | null>(null);

  get profile() { return this._profile; }

  hasProfile(): boolean {
    return this._profile() !== null;
  }

  async loadProfile() {
    const user = this.supabase.getCurrentUser();
    if (!user) return;

    const { data } = await this.supabase.getClient()
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (data) {
      this._profile.set({
        displayName: data.display_name,
        favoriteGenres: data.favorite_genres ?? [],
        createdAt: data.created_at,
      });
    }
  }

  async save(profile: UserProfile) {
    const user = this.supabase.getCurrentUser();
    if (!user) return;

    this._profile.set(profile);

    await this.supabase.getClient()
      .from('profiles')
      .upsert({
        id: user.id,
        display_name: profile.displayName,
        favorite_genres: profile.favoriteGenres,
        created_at: profile.createdAt,
      });
  }
}