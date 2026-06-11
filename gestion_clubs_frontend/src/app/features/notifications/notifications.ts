// src/app/features/notifications/notifications.ts
// Ajout de la détection du rôle pour afficher
// la bonne sidebar
import { ToastService } from '../../core/services/toast.service';
import { Component, inject, signal,
         computed, OnInit } from '@angular/core';
import { CommonModule, NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';

import { NotificationService } from '../../core/services/notification.service';
import { AuthService }         from '../../core/services/auth.service';
import { HeaderApp }           from '../../shared/components/header-app/header-app';
import { Sidebar }             from '../../shared/components/sidebar/sidebar';
import { SidebarAdmin }        from '../../shared/components/sidebar-admin/sidebar-admin';
import { Notification, TypeNotification }
  from '../../core/models/notification.model';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [
    CommonModule,
    NgTemplateOutlet,
    RouterLink,
    HeaderApp,
    Sidebar,
    SidebarAdmin,   // ← ajoute
  ],
  templateUrl: './notifications.html',
  styleUrl:    './notifications.css'
})
export class Notifications implements OnInit {

  private toastService = inject(ToastService)
  private notifService  = inject(NotificationService);
  protected authService = inject(AuthService);  // ← protected

  notifications = signal<Notification[]>([]);
  chargement    = signal(true);

  nonLues = computed(() =>
    this.notifications().filter(n => !n.est_lue).length
  );

  groupes = computed(() => {
    const maintenant   = new Date();
    const debutJour    = new Date(maintenant);
    debutJour.setHours(0, 0, 0, 0);
    const debutSemaine = new Date(maintenant);
    debutSemaine.setDate(maintenant.getDate() - 7);

    const aujourdhui: Notification[] = [];
    const semaine:    Notification[] = [];
    const ancien:     Notification[] = [];

    this.notifications().forEach(n => {
      const date = new Date(n.date_creation);
      if (date >= debutJour)    { aujourdhui.push(n); }
      else if (date >= debutSemaine) { semaine.push(n); }
      else                      { ancien.push(n); }
    });

    return { aujourdhui, semaine, ancien };
  });

  ngOnInit(): void { this.chargerNotifications(); }

  chargerNotifications(): void {
    this.chargement.set(true);
    this.notifService.getNotifications().subscribe({
      next:  (notifs) => {
        this.notifications.set(notifs);
        this.chargement.set(false);
      },
      error: () => this.chargement.set(false)
    });
  }

  marquerLue(notif: Notification): void {
    if (notif.est_lue) return;
    this.notifService.marquerLue(notif.id).subscribe({
      next: () => {
        this.notifications.update(liste =>
          liste.map(n =>
            n.id === notif.id ? { ...n, est_lue: true } : n
          )
        );
      }
    });
  }

    marquerToutLu(): void {
      this.notifService.marquerToutLu().subscribe({
        next: () => {
          this.toastService.info('Toutes les notifications sont lues.');
          // Met à jour localement
          this.notifications.update(liste =>
            liste.map(n => ({ ...n, est_lue: true }))
          );
          // La sidebar se rechargera au prochain
          // changement de route automatiquement
        }
      });
    }

  getIcone(type: TypeNotification): string {
    const icones: Record<TypeNotification, string> = {
      club_soumis:          'clock',
      club_valide:          'check-circle',
      club_rejete:          'x-circle',
      club_suspendu:        'pause-circle',
      publication_soumise:  'send',
      publication_validee:  'check-circle',
      publication_rejetee:  'x-circle',
      membre_ajoute:        'user-plus',
    };
    return icones[type] ?? 'bell';
  }

  getCouleur(type: TypeNotification): string {
    const couleurs: Record<TypeNotification, string> = {
      club_soumis:          'text-purple-600 bg-purple-50',
      club_valide:          'text-green-600  bg-green-50',
      club_rejete:          'text-red-600    bg-red-50',
      club_suspendu:        'text-orange-600 bg-orange-50',
      publication_soumise:  'text-blue-600   bg-blue-50',
      publication_validee:  'text-green-600  bg-green-50',
      publication_rejetee:  'text-red-600    bg-red-50',
      membre_ajoute:        'text-blue-400   bg-blue-50',
    };
    return couleurs[type] ?? 'text-gray-500 bg-gray-100';
  }

  getTitreCouleur(type: TypeNotification): string {
    const couleurs: Record<TypeNotification, string> = {
      club_valide:          'text-primary-700',
      membre_ajoute:        'text-primary-700',
      publication_soumise:  'text-primary-700',
      club_soumis:          'text-primary-700',
      club_rejete:          'text-red-600',
      club_suspendu:        'text-orange-600',
      publication_validee:  'text-green-600',
      publication_rejetee:  'text-red-600',
    };
    return couleurs[type] ?? 'text-gray-900';
  }

  dateRelative(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const min  = Math.floor(diff / 60000);
    const h    = Math.floor(diff / 3600000);
    const j    = Math.floor(diff / 86400000);
    if (min < 1)  return "À l'instant";
    if (min < 60) return `Il y a ${min} min`;
    if (h < 24)   return `Il y a ${h}h`;
    if (j === 1)  return 'Hier';
    if (j < 7)    return `Il y a ${j} jours`;
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  }

  annee = new Date().getFullYear();
}