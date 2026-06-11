// src/app/shared/components/header-public/header-public.ts

import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-header-public',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header-public.html',
  styleUrl: './header-public.css'
})
export class HeaderPublic {

  // Signal pour contrôler l'ouverture du menu mobile
  menuOuvert = signal(false);

  toggleMenu(): void {
    this.menuOuvert.update(v => !v);
  }
}