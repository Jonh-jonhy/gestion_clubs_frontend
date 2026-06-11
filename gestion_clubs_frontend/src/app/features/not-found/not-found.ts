// src/app/features/not-found/not-found.ts

import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { inject } from '@angular/core';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  templateUrl: './not-found.html',
  styleUrl: './not-found.css'
})
export class NotFound {
  protected authService = inject(AuthService);

  // Redirige vers la bonne page selon le rôle
  get lienAccueil(): string {
    if (!this.authService.estConnecte()) return '/';
    if (this.authService.estAdmin())     return '/admin';
    return '/dashboard';
  }

  history = history;
  annee   = new Date().getFullYear();
}