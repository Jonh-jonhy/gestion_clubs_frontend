// src/app/core/interceptors/jwt.interceptor.ts
//
// Intercepteur HTTP global.
// Rôle 1 : Ajoute le token JWT sur chaque requête.
// Rôle 2 : Gère les erreurs HTTP globalement.
//   401 → token expiré → logout + redirect /login
//   403 → accès refusé → toast erreur
//   500 → erreur serveur → toast erreur
//   0   → hors ligne → toast attention

import { HttpInterceptorFn, HttpErrorResponse }
  from '@angular/common/http';
import { inject }    from '@angular/core';
import { Router }    from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AuthService }  from '../services/auth.service';
import { ToastService } from '../services/toast.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {

  const authService  = inject(AuthService);
  const toastService = inject(ToastService);
  const router       = inject(Router);

  const token = authService.getAccessToken();

  // ── Ajoute le token si disponible ────────────────────────────
  const reqAvecToken = token
    ? req.clone({
        setHeaders: { Authorization: `Bearer ${token}` }
      })
    : req;

  // ── Intercepte les erreurs ────────────────────────────────────
  return next(reqAvecToken).pipe(
    catchError((erreur: HttpErrorResponse) => {

      switch (erreur.status) {

        case 401:
          // Token expiré ou invalide → déconnexion forcée
          toastService.attention(
            'Session expirée',
            'Veuillez vous reconnecter.'
          );
          authService.logout();
          router.navigate(['/login']);
          break;

        case 403:
          // Accès refusé
          toastService.erreur(
            'Accès refusé',
            'Vous n\'avez pas les droits pour cette action.'
          );
          break;

        case 404:
          // Ressource introuvable — géré localement par chaque page
          // On ne montre pas de toast global pour le 404
          break;

        case 500:
        case 502:
        case 503:
          // Erreur serveur Django
          toastService.erreur(
            'Erreur serveur',
            'Une erreur est survenue. Réessayez dans quelques instants.'
          );
          break;

        case 0:
          // Pas de connexion réseau
          toastService.attention(
            'Hors ligne',
            'Vérifiez votre connexion internet.'
          );
          break;

        default:
          // Autres erreurs non gérées
          if (erreur.status >= 400) {
            // Ne pas afficher de toast pour les erreurs
            // de validation (400) — gérées par les formulaires
          }
          break;
      }

      // Propage l'erreur pour que les composants
      // puissent aussi la gérer localement
      return throwError(() => erreur);
    })
  );
};