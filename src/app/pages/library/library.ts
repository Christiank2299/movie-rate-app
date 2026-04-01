import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LibraryService, WatchStatus } from '../../core/services/library.service';

@Component({
  selector: 'app-library',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './library.html',
})
export class Library {
  libraryService = inject(LibraryService);
  activeTab = signal<WatchStatus | 'all'>('all');

  tabs: { label: string; value: WatchStatus | 'all' }[] = [
    { label: 'All', value: 'all' },
    { label: 'Want to Watch', value: 'want' },
    { label: 'Watching', value: 'watching' },
    { label: 'Finished', value: 'finished' },
  ];

  get filtered() {
    const tab = this.activeTab();
    if (tab === 'all') return this.libraryService.entries();
    return this.libraryService.getByStatus(tab);
  }

  remove(movieId: number) {
    this.libraryService.removeMovie(movieId);
  }

  updateStatus(movieId: number, status: WatchStatus) {
    this.libraryService.updateStatus(movieId, status);
  }

  statusColor(status: WatchStatus) {
    return {
      want: 'text-rose-400',
      watching: 'text-blue-400',
      finished: 'text-green-400',
    }[status];
  }
}