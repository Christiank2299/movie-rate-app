import { Injectable, signal } from '@angular/core';

export interface UserProfile {
  displayName: string;
  favoriteGenres: number[];
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly KEY = 'movierate_profile';

  private _profile = signal<UserProfile | null>(this.load());

  get profile() { return this._profile; }

  hasProfile(): boolean {
    return this._profile() !== null;
  }

  save(profile: UserProfile) {
    this._profile.set(profile);
    localStorage.setItem(this.KEY, JSON.stringify(profile));
  }

  private load(): UserProfile | null {
    try {
      const raw = localStorage.getItem(this.KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }
}