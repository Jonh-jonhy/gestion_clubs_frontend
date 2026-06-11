// src/app/features/admin/publications/publications.ts
//
// Page de gestion des publications pour l'administrateur.
// Permet de valider ou rejeter les publications soumises
// par les présidents et secrétaires des clubs.
// Filtrage par statut : Tous / En attente / Publiées / Rejetées

import { Component, inject, signal,
         computed, OnInit } from '@angular/core';
import { CommonModule }  from '@angular/common';
import { RouterLink }    from '@angular/router';
import { ReactiveFormsModule,
         FormBuilder, FormGroup,
         Validators } from '@angular/forms';

import { PublicationService } from '../../../core/services/publication.service';
import { ToastService } from '../../../core/services/toast.service';
import { HeaderApp }          from '../../../shared/components/header-app/header-app';
import { SidebarAdmin }       from '../../../shared/components/sidebar-admin/sidebar-admin';
import { BadgeStatut }        from '../../../shared/components/badge-statut/badge-statut';
import { Publication }        from '../../../core/models/publication.model';

type Filtre = 'tous' | 'en_attente' | 'publiee' | 'rejetee';

@Component({
  selector: 'app-admin-publications',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    HeaderApp,
    SidebarAdmin,
    BadgeStatut,
  ],
  templateUrl: './publications.html',
  styleUrl:    './publications.css'
})
export class AdminPublications implements OnInit {

  private pubService = inject(PublicationService);
  private fb         = inject(FormBuilder);
  private toastService = inject(ToastService);

  // ── Données ───────────────────────────────────────────────────
  publications = signal<Publication[]>([]);
  chargement   = signal(true);

  // ── Filtre actif ──────────────────────────────────────────────
  filtreActif = signal<Filtre>('tous');

  // ── Recherche ─────────────────────────────────────────────────
  recherche = signal('');

  // ── Publications filtrées (computed) ─────────────────────────
  publicationsFiltrees = computed(() => {
    let liste = this.publications();

    // Filtre par statut
    if (this.filtreActif() !== 'tous') {
      liste = liste.filter(p => p.statut === this.filtreActif());
    }

    // Filtre par recherche
    const terme = this.recherche().toLowerCase().trim();
    if (terme) {
      liste = liste.filter(
        p => p.titre.toLowerCase().includes(terme) ||
             p.club_nom.toLowerCase().includes(terme)
      );
    }

    return liste;
  });

  // ── Compteurs par statut ──────────────────────────────────────
  nbEnAttente = computed(() =>
    this.publications().filter(p => p.statut === 'en_attente').length
  );

  // ── Modal rejet ───────────────────────────────────────────────
  modalRejetOuvert      = signal(false);
  publicationSelectionnee = signal<Publication | null>(null);
  chargementAction      = signal<number | null>(null);

  formulaireRejet: FormGroup = this.fb.group({
    motif_rejet: ['', [
      Validators.required,
      Validators.minLength(10)
    ]]
  });

  get motifRejet() {
    return this.formulaireRejet.get('motif_rejet');
  }

  // ── Onglets de filtre ─────────────────────────────────────────
  onglets: { label: string; valeur: Filtre }[] = [
    { label: 'Tous',        valeur: 'tous'       },
    { label: 'En attente',  valeur: 'en_attente' },
    { label: 'Publiées',    valeur: 'publiee'    },
    { label: 'Rejetées',    valeur: 'rejetee'    },
  ];

  ngOnInit(): void {
    this.chargerPublications();
  }

  chargerPublications(): void {
    this.chargement.set(true);

    // Charge toutes les publications (en attente)
    this.pubService.getPublicationsEnAttente().subscribe({
      next: (pubs) => {
        this.publications.set(pubs);
        this.chargement.set(false);
      },
      error: () => this.chargement.set(false)
    });
  }

  // ── Changer le filtre ─────────────────────────────────────────
  changerFiltre(filtre: Filtre): void {
    this.filtreActif.set(filtre);
  }

  // ── Valider une publication ───────────────────────────────────
  publier(pub: Publication): void {
    this.chargementAction.set(pub.id);

    this.pubService.validerPublication(pub.id, {
      action: 'publier'
    }).subscribe({
      next: () => {
        this.toastService.succes(
          'Publication publiée !',
          `"${pub.titre}" est maintenant visible publiquement.`
        );
        // Met à jour localement
        this.publications.update(liste =>
          liste.map(p =>
            p.id === pub.id
              ? { ...p, statut: 'publiee' as const }
              : p
          )
        );
        this.chargementAction.set(null);
      },
      error: () => this.chargementAction.set(null)
    });
  }

  // ── Ouvrir modal rejet ────────────────────────────────────────
  ouvrirModalRejet(pub: Publication): void {
    this.publicationSelectionnee.set(pub);
    this.formulaireRejet.reset();
    this.modalRejetOuvert.set(true);
  }

  fermerModalRejet(): void {
    this.modalRejetOuvert.set(false);
    this.publicationSelectionnee.set(null);
  }

  // ── Confirmer le rejet ────────────────────────────────────────
  confirmerRejet(): void {
    if (this.formulaireRejet.invalid) {
      this.formulaireRejet.markAllAsTouched();
      return;
    }

    const pub = this.publicationSelectionnee();
    if (!pub) return;

    this.chargementAction.set(pub.id);

    this.pubService.validerPublication(pub.id, {
      action:      'rejeter',
      motif_rejet: this.formulaireRejet.value.motif_rejet
    }).subscribe({
      next: () => {
        this.toastService.info(
          'Publication rejetée',
          'Le président du club a été notifié.'
        );
        // Met à jour localement
        this.publications.update(liste =>
          liste.map(p =>
            p.id === pub.id
              ? { ...p, statut: 'rejetee' as const,
                  motif_rejet: this.formulaireRejet.value.motif_rejet }
              : p
          )
        );
        this.fermerModalRejet();
        this.chargementAction.set(null);
      },
      error: () => this.chargementAction.set(null)
    });
  }

  // ── Formatage date ────────────────────────────────────────────
  formaterDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day:   '2-digit',
      month: 'short',
      year:  'numeric'
    });
  }

  // ── Numéro de publication ─────────────────────────────────────
  getPubNum(index: number): string {
    return `PUB-${String(index + 1).padStart(3, '0')}`;
  }

  annee = new Date().getFullYear();
}