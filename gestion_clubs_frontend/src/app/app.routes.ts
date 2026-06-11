// src/app/app.routes.ts
//
// Définition de toutes les routes de l'application.
// On utilise le lazy loading (loadComponent) pour
// charger chaque page uniquement quand elle est visitée.
// → Améliore les performances au démarrage.

import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [

  // ── Pages publiques ──────────────────────────────────────────
  {
    path: '',
    loadComponent: () =>
      import('./features/home/home')
        .then(m => m.Home),
  },
  {
    path: 'publications',
    loadComponent: () =>
      import('./features/publications/liste/liste')
        .then(m => m.Liste),
  },

  // ── Auth (bloqué si déjà connecté) ───────────────────────────
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/login/login')
        .then(m => m.Login),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/register/register')
        .then(m => m.Register),
  },

  // ── Pages membres (connecté requis) ──────────────────────────
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard')
        .then(m => m.Dashboard),
  },
  {
    path: 'clubs/creer',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/clubs/creer/creer')
        .then(m => m.Creer),
  },
  {
    path: 'clubs/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/clubs/detail/detail')
        .then(m => m.Detail),
  },
  {
    path: 'notifications',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/notifications/notifications')
        .then(m => m.Notifications),
  },
  {
    path: 'clubs/:id/publication',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/publications/creer/creer')
        .then(m => m.CreerPublication),
  },
  // ── Pages admin uniquement ────────────────────────────────────
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./features/admin/dashboard/dashboard')
        .then(m => m.AdminDashboard),
  },
  {
    path: 'admin/clubs',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./features/admin/clubs/clubs')
        .then(m => m.AdminClubs),
  },
  {
    path: 'admin/publications',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./features/admin/publications/publications')
        .then(m => m.AdminPublications),
  },
  {
  path: 'clubs',
  canActivate: [authGuard],
  loadComponent: () =>
    import('./features/clubs/liste/liste')
      .then(m => m.ListeClubs),
},
{
  path: 'admin/clubs',
  canActivate: [adminGuard],
  loadComponent: () =>
    import('./features/admin/clubs/clubs')
      .then(m => m.AdminClubs),
},

{
  path: 'publications/:id',
  loadComponent: () =>
    import('./features/publications/detail/detail')
      .then(m => m.DetailPublication),
},

  // ── Redirection par défaut ────────────────────────────────────
  { path: '**',
    loadComponent: () =>
    import('./features/not-found/not-found')
      .then(m => m.NotFound)
  }
  ,
];