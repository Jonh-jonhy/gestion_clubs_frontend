// src/app/core/services/notification.sevice.ts
//
// Service pour les notifications utilisateur.

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environement.prod';
import { Notification } from '../models/notification.model';

@Injectable({ providedIn: 'root' })
export class NotificationService {

  private http   = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/auth`;

  // GET /api/auth/notifications/
  getNotifications() {
    return this.http.get<Notification[]>(
      `${this.apiUrl}/notifications/`
    );
  }

  // PATCH /api/auth/notifications/<pk>/lire/
  marquerLue(id: number) {
    return this.http.patch(
      `${this.apiUrl}/notifications/${id}/lire/`, {}
    );
  }

  // PATCH /api/auth/notifications/lire-tout/
  marquerToutLu() {
    return this.http.patch(
      `${this.apiUrl}/notifications/lire-tout/`, {}
    );
  }
}