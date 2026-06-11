// src/app/shared/components/sidebar-admin/sidebar-admin.ts

import { Component, inject, signal,
         OnInit, Input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService }        from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-sidebar-admin',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar-admin.html',
  styleUrl: './sidebar-admin.css'
})
export class SidebarAdmin implements OnInit {

  private authService  = inject(AuthService);
  private notifService = inject(NotificationService);

  @Input() clubsEnAttente        = 0;
  @Input() publicationsEnAttente = 0;

  // Badge notifications chargé automatiquement
  notifNonLues = signal(0);

  ngOnInit(): void {
    this.chargerNotifications();
  }

  chargerNotifications(): void {
    this.notifService.getNotifications().subscribe({
      next: (notifs) => {
        this.notifNonLues.set(
          notifs.filter(n => !n.est_lue).length
        );
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }
}