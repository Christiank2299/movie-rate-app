import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../core/services/supabase.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login.html',
})
export class Login {
  private supabase = inject(SupabaseService);
  isLoading = false;

  async signInWithGoogle() {
    this.isLoading = true;
    await this.supabase.signInWithGoogle();
  }
}