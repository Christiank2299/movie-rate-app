import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../core/services/supabase.service';
import { MovieService } from '../../core/services/movie.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login.html',
})
export class Login implements OnInit {
  private supabase = inject(SupabaseService);
  private movieService = inject(MovieService);
  
  isLoading = false;
  posters = signal<string[]>([]);

  ngOnInit() {
    this.movieService.getPopular().subscribe(movies => {
      const urls = movies
        .filter(m => m.posterUrl)
        .map(m => m.posterUrl);
      // Duplicate for seamless scroll
      this.posters.set([...urls, ...urls]);
    });
  }

  async signInWithGoogle() {
    this.isLoading = true;
    await this.supabase.signInWithGoogle();
  }
}