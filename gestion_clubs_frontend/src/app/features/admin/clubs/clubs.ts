// src/app/features/admin/clubs/clubs.ts
//
// Page de gestion des clubs pour l'administrateur.
// Permet de valider, suspendre et archiver les clubs.
// Filtrage par statut avec compteurs.

import { Component, inject, signal,
         computed, OnInit } from '@angular/core';
import { CommonModule }  from '@angular/common';
import { RouterLink }    from '@angular/router';

import { ClubService }  from '../../../core/services/club.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { HeaderApp }    from '../../../shared/components/header-app/header-app';
import { SidebarAdmin } from '../../../shared/components/sidebar-admin/sidebar-admin';
import { BadgeStatut }  from '../../../shared/components/badge-statut/badge-statut';
import { Club }         from '../../../core/models/club.model';

type Filtre = 'tous' | 'en_attente' | 'valide' | 'suspendu' | 'archive';

@Component({
  selector: 'app-admin-clubs',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    HeaderApp,
    SidebarAdmin,
    BadgeStatut,
  ],
  templateUrl: './clubs.html',
  styleUrl:    './clubs.css'
})
export class AdminClubs implements OnInit {

  private clubService = inject(ClubService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  // ── Données ───────────────────────────────────────────────────
  clubs      = signal<Club[]>([]);
  chargement = signal(true);

  // ── Filtre actif ──────────────────────────────────────────────
  filtreActif = signal<Filtre>('tous');

  // ── Recherche ─────────────────────────────────────────────────
  recherche = signal('');

  // ── Action en cours (id du club) ──────────────────────────────
  chargementAction = signal<number | null>(null);

  // ── Clubs filtrés (computed) ──────────────────────────────────
  clubsFiltres = computed(() => {
    let liste = this.clubs();

    if (this.filtreActif() !== 'tous') {
      liste = liste.filter(c => c.statut === this.filtreActif());
    }

    const terme = this.recherche().toLowerCase().trim();
    if (terme) {
      liste = liste.filter(
        c => c.nom.toLowerCase().includes(terme) ||
             c.filiere_display.toLowerCase().includes(terme) ||
             c.createur?.nom?.toLowerCase().includes(terme)
      );
    }

    return liste;
  });

  // ── Compteurs ─────────────────────────────────────────────────
  nbEnAttente = computed(() =>
    this.clubs().filter(c => c.statut === 'en_attente').length
  );
  nbValides = computed(() =>
    this.clubs().filter(c => c.statut === 'valide').length
  );
  nbSuspendus = computed(() =>
    this.clubs().filter(c => c.statut === 'suspendu').length
  );

  // ── Onglets ───────────────────────────────────────────────────
  onglets: { label: string; valeur: Filtre }[] = [
    { label: 'Tous',        valeur: 'tous'       },
    { label: 'En attente',  valeur: 'en_attente' },
    { label: 'Validés',     valeur: 'valide'     },
    { label: 'Suspendus',   valeur: 'suspendu'   },
    { label: 'Archivés',    valeur: 'archive'    },
  ];

  // ── Modal confirmation ────────────────────────────────────────
  modalOuvert   = signal(false);
  clubSelectionne = signal<Club | null>(null);
  actionEnCours = signal<'valider' | 'suspendre' | 'archiver' | null>(null);

  ngOnInit(): void {
  this.chargerClubs();
  }

  chargerClubs(): void {
    this.chargement.set(true);

    // Utilise l'endpoint admin qui retourne TOUS les clubs
    this.clubService.getTousClubsAdmin().subscribe({
      next: (clubs) => {
        this.clubs.set(clubs);
        this.chargement.set(false);
      },
      error: () => this.chargement.set(false)
    });
  }

  // ── Ouvrir modal confirmation ─────────────────────────────────
  ouvrirModal(
    club: Club,
    action: 'valider' | 'suspendre' | 'archiver'
  ): void {
    this.clubSelectionne.set(club);
    this.actionEnCours.set(action);
    this.modalOuvert.set(true);
  }

  fermerModal(): void {
    this.modalOuvert.set(false);
    this.clubSelectionne.set(null);
    this.actionEnCours.set(null);
  }

  // ── Confirmer l'action ────────────────────────────────────────
// src/app/features/admin/clubs/clubs.ts

  confirmerAction(): void {
    const club   = this.clubSelectionne();
    const action = this.actionEnCours();
    if (!club || !action) return;

    this.chargementAction.set(club.id);

    let observable;
    switch (action) {
      case 'valider':
        observable = this.clubService.validerClub(club.id);
        break;
      case 'suspendre':
        observable = this.clubService.suspendreClub(club.id);
        break;
      case 'archiver':
        observable = this.clubService.archiverClub(club.id);
        break;
      default:
        return;
    }

    observable.subscribe({
      next: () => {
        const messages = {
          valider:   '✅ Club validé avec succès !',
          suspendre: 'Club suspendu.',
          archiver:  'Club archivé.',
        };
        this.toastService.succes(
          messages[action!],
          `Le club "${club!.nom}" a été ${action === 'valider' ? 'validé' : action === 'suspendre' ? 'suspendu' : 'archivé'}.`
        );
        this.fermerModal();
        this.chargementAction.set(null);
        this.chargerClubs();

        // Si on vient de valider un club → le créateur
        // devient membre, on rafraîchit le profil
        if (action === 'valider') {
          this.authService.rafraichirProfil();
        }
      },
      error: (err) => {
      this.toastService.erreur(
        'Erreur',
        err.error?.message ?? 'Une erreur est survenue.'
      );
      this.chargementAction.set(null);
    }
    });
  }

  // ── Helpers ───────────────────────────────────────────────────
  getActionLabel(): string {
    switch (this.actionEnCours()) {
      case 'valider':   return 'Valider';
      case 'suspendre': return 'Suspendre';
      case 'archiver':  return 'Archiver';
      default:          return '';
    }
  }

  getActionCouleur(): string {
    switch (this.actionEnCours()) {
      case 'valider':   return 'bg-green-600 hover:bg-green-700';
      case 'suspendre': return 'bg-orange-500 hover:bg-orange-600';
      case 'archiver':  return 'bg-gray-600   hover:bg-gray-700';
      default:          return 'bg-primary-700';
    }
  }

  formaterDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }

  annee = new Date().getFullYear();
}