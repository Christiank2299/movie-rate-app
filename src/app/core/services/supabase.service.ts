import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private supabase: SupabaseClient;
  
  private _user = new BehaviorSubject<User | null>(null);
  user$ = this._user.asObservable();

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey,
      {
        auth: {
          storage: window.localStorage,
          flowType: 'pkce',
          detectSessionInUrl: true,
          persistSession: true,
          lock: async (_name: string, _acquireTimeout: number, fn: () => Promise<any>) => {
            return fn();
          }
        }
      }
    );

    this.supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth event:', event, session?.user?.email);
      this._user.next(session?.user ?? null);
    });

    this.supabase.auth.getSession().then(({ data }) => {
      console.log('Initial session:', data.session?.user?.email);
      this._user.next(data.session?.user ?? null);
    });
  }

  async signInWithGoogle() {
  return this.supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: 'https://christiank2299.github.io/movie-rate-app/'
    }
  });
}

  async signOut() {
    return this.supabase.auth.signOut();
  }

  getCurrentUser(): User | null {
    return this._user.value;
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }
}