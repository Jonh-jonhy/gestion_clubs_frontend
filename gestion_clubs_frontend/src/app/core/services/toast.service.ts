// src/app/core/services/toast.service.ts
//
// Service global de notifications toast.
// Utilisé depuis n'importe quel composant via inject().
// Les toasts s'affichent en bas à droite et
// disparaissent automatiquement après 3 secondes.

import { Injectable, signal } from '@angular/core';

export type ToastType = 'succes' | 'erreur' | 'info' | 'attention';

export interface Toast {
  id: number;
  type: ToastType;
  titre: string;
  message?: string;
  duree: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {

  // Signal contenant la liste des toasts actifs
  toasts = signal<Toast[]>([]);

  private nextId = 0;

  // ── Méthodes publiques ────────────────────────────────────────

  succes(titre: string, message?: string, duree = 3000): void {
    this.ajouter('succes', titre, message, duree);
  }

  erreur(titre: string, message?: string, duree = 4000): void {
    this.ajouter('erreur', titre, message, duree);
  }

  info(titre: string, message?: string, duree = 3000): void {
    this.ajouter('info', titre, message, duree);
  }

  attention(titre: string, message?: string, duree = 3500): void {
    this.ajouter('attention', titre, message, duree);
  }

  // ── Fermer manuellement un toast ──────────────────────────────
  fermer(id: number): void {
    this.toasts.update(liste => liste.filter(t => t.id !== id));
  }

  // ── Méthode privée ────────────────────────────────────────────
  private ajouter(
    type: ToastType,
    titre: string,
    message?: string,
    duree = 3000
  ): void {
    const id = this.nextId++;

    const toast: Toast = { id, type, titre, message, duree };

    // Ajoute le toast à la liste
    this.toasts.update(liste => [...liste, toast]);

    // Supprime automatiquement après la durée
    setTimeout(() => this.fermer(id), duree);
  }
}