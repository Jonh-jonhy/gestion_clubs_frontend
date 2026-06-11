// src/app/shared/components/sidebar/sidebar.ts

import { Component, inject, signal,
         OnInit, HostListener } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService }          from '../../../core/services/auth.service';
import { NotificationService }  from '../../../core/services/notification.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class Sidebar implements OnInit {

  private authService  = inject(AuthService);
  private notifService = inject(NotificationService);

  notifCount       = signal(0);
  menuMobileOuvert = signal(false);

  ngOnInit(): void {
    this.chargerNotifications();
  }

  chargerNotifications(): void {
    this.notifService.getNotifications().subscribe({
      next: (notifs) => {
        this.notifCount.set(
          notifs.filter(n => !n.est_lue).length
        );
      }
    });
  }

  // Détecte si on est sur mobile
  isMobile(): boolean {
    return window.innerWidth < 768;
  }

  // Ouvre/ferme le menu mobile
  // Appelé depuis header-app
  toggleMenuMobile(): void {
    this.menuMobileOuvert.update(v => !v);
  }

  fermerMenuMobile(): void {
    this.menuMobileOuvert.set(false);
  }

  // Ferme sur resize vers desktop
  @HostListener('window:resize')
  onResize(): void {
    if (!this.isMobile()) {
      this.menuMobileOuvert.set(false);
    }
  }

  logout(): void {
    this.authService.logout();
  }
}