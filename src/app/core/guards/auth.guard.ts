// import { inject } from '@angular/core';
// import { Router } from '@angular/router';
// import { SupabaseService } from '../services/supabase.service';
// import { firstValueFrom, timeout, catchError } from 'rxjs';
// import { of } from 'rxjs';

// export const authGuard = async () => {
//   const supabase = inject(SupabaseService);
//   const router = inject(Router);

//   const client = supabase.getClient();
//   const { data } = await client.auth.getSession();
  
//   if (data.session?.user) {
//     return true;
//   }

//   router.navigate(['/login']);
//   return false;
// };

import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

export const authGuard = async () => {
  const supabase = inject(SupabaseService);
  const router = inject(Router);

  // Wait for Supabase to fully establish session from URL
  const { data } = await supabase.getClient().auth.getSession();
  
  if (data.session?.user) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};