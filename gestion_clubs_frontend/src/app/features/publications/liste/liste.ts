// src/app/features/publications/liste/liste.ts
//
// Page publique des publications — accessible sans connexion.
// Affiche toutes les publications validées de tous les clubs.
// Filtrage par club et recherche par titre.

import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { PublicationService } from '../../../core/services/publication.service';
import { ClubService }        from '../../../core/services/club.service';
import { HeaderPublic }       from '../../../shared/components/header-public/header-public';
import { Publication }        from '../../../core/models/publication.model';
import { Club }               from '../../../core/models/club.model';

@Component({
  selector: 'app-liste-publications',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    HeaderPublic,
  ],
  templateUrl: './liste.html',
  styleUrl: './liste.css'
})
export class Liste implements OnInit {

  private pubService  = inject(PublicationService);
  private clubService = inject(ClubService);

  // ── Données brutes ────────────────────────────────────────────
  publications = signal<Publication[]>([]);
  clubs        = signal<Club[]>([]);
  chargement   = signal(true);

  // ── Filtres ───────────────────────────────────────────────────
  recherche      = signal('');
  clubSelectionne = signal('tous');

  // ── Publications filtrées (computed) ─────────────────────────
  // computed() recalcule automatiquement quand
  // publications(), recherche() ou clubSelectionne() changent
  publicationsFiltrees = computed(() => {
    let liste = this.publications();

    // Filtre par club
    if (this.clubSelectionne() !== 'tous') {
      liste = liste.filter(
        p => p.club === Number(this.clubSelectionne())
      );
    }

    // Filtre par recherche (titre ou description)
    const recherche = this.recherche().toLowerCase().trim();
    if (recherche) {
      liste = liste.filter(
        p => p.titre.toLowerCase().includes(recherche) ||
             p.description.toLowerCase().includes(recherche)
      );
    }

    return liste;
  });

  ngOnInit(): void {
    this.chargerDonnees();
  }

  chargerDonnees(): void {
    this.chargement.set(true);

    // Charge les publications publiques
    this.pubService.getPublications().subscribe({
      next: (pubs) => {
        this.publications.set(pubs);
        this.chargement.set(false);
      },
      error: () => this.chargement.set(false)
    });

    // Charge les clubs pour le filtre
    this.clubService.getClubs().subscribe({
      next: (clubs) => this.clubs.set(clubs)
    });
  }

  // ── Mise à jour des filtres ───────────────────────────────────
  onRecherche(valeur: string): void {
    this.recherche.set(valeur);
  }

  onClubChange(valeur: string): void {
    this.clubSelectionne.set(valeur);
  }

  // ── Description tronquée ──────────────────────────────────────
  tronquer(texte: string, max = 120): string {
    return texte.length > max
      ? texte.substring(0, max) + '...'
      : texte;
  }

  // ── Formatage date ────────────────────────────────────────────
  formaterDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  annee = new Date().getFullYear();
}