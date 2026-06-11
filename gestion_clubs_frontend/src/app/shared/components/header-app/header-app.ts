// src/app/shared/components/header-app/header-app.ts

import { Component, inject, ViewChild } from '@angular/core';
import { RouterLink }  from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { Sidebar }     from '../sidebar/sidebar';

@Component({
  selector: 'app-header-app',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './header-app.html',
  styleUrl: './header-app.css'
})
export class HeaderApp {
  protected authService = inject(AuthService);

  // Référence à la sidebar pour toggle mobile
  @ViewChild(Sidebar) sidebar?: Sidebar;

  toggleSidebar(): void {
    this.sidebar?.toggleMenuMobile();
  }

  get initiales(): string {
    const u = this.authService.utilisateur();
    if (!u) return '?';
    return `${u.prenom[0]}${u.nom[0]}`.toUpperCase();
  }

  get roleLabel(): string {
    switch (this.authService.utilisateur()?.role) {
      case 'administrateur': return 'Administrateur Principal';
      case 'membre':         return 'Membre';
      default:               return 'Visiteur';
    }
  }
}