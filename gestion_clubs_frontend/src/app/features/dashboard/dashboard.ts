// src/app/features/dashboard/dashboard.ts
//
// Dashboard principal du membre connecté.
// Affiche ses clubs, publications récentes et aperçu rapide.
// Les données sont chargées depuis l'API au démarrage.

import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { AuthService }       from '../../core/services/auth.service';
import { ClubService }       from '../../core/services/club.service';
import { PublicationService } from '../../core/services/publication.service';

import { HeaderApp }    from '../../shared/components/header-app/header-app';
import { Sidebar }      from '../../shared/components/sidebar/sidebar';
import { BadgeStatut }  from '../../shared/components/badge-statut/badge-statut';
import { BadgeRole }    from '../../shared/components/badge-role/badge-role';

import { Club, Adhesion } from '../../core/models/club.model';
import { Publication }    from '../../core/models/publication.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    HeaderApp,
    Sidebar,
    BadgeStatut,
    BadgeRole,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {

  private authService  = inject(AuthService);
  private clubService  = inject(ClubService);
  private pubService   = inject(PublicationService);

  // ── Signals pour les données ──────────────────────────────────
  mesAdhesions    = signal<Adhesion[]>([]);
  publications    = signal<Publication[]>([]);
  chargement      = signal(true);

  // ── Toutes les publications de mes clubs ──────────────────────
  publicationsMesClubs = signal<Publication[]>([]);

  // ── Événements à venir parmi mes clubs ────────────────────────
  prochainsEvenements = computed(() => {
    const maintenant = new Date();
    return this.publicationsMesClubs()
      .filter(p =>
        p.est_evenement &&
        p.date_debut &&
        new Date(p.date_debut) >= maintenant
      )
      .sort((a, b) =>
        new Date(a.date_debut!).getTime() -
        new Date(b.date_debut!).getTime()
      )
      .slice(0, 3);
  });

  // ── Nombre d'événements à venir ce mois ───────────────────────
  evenementsCeMois = computed(() => {
    const maintenant = new Date();
    const moisActuel = maintenant.getMonth();
    const anneeActuelle = maintenant.getFullYear();

    return this.publicationsMesClubs().filter(p => {
      if (!p.est_evenement || !p.date_debut) return false;
      const date = new Date(p.date_debut);
      return date.getMonth() === moisActuel &&
            date.getFullYear() === anneeActuelle;
    }).length;
  });

  // ── Publications publiées ce mois (toutes, pour comparaison) ──
  publicationsCeMois = computed(() => {
    const maintenant = new Date();
    const moisActuel = maintenant.getMonth();
    const anneeActuelle = maintenant.getFullYear();

    return this.publicationsMesClubs().filter(p => {
      const date = new Date(p.date_creation);
      return date.getMonth() === moisActuel &&
            date.getFullYear() === anneeActuelle;
    }).length;
  });

  // ── Taux d'engagement simulé mais basé sur données réelles ────
  // Ratio publications/clubs pour donner un indicateur cohérent
  tauxActivite = computed(() => {
    const nbClubs = this.mesAdhesions().length;
    if (nbClubs === 0) return 0;
    const ratio = (this.publicationsCeMois() / nbClubs) * 25;
    return Math.min(Math.round(ratio), 100);
  });

  // Formate "Demain, 14h00" / "Lundi 15 nov, 14h00"
  formaterDateEvenement(dateStr: string): string {
    const date = new Date(dateStr);
    const maintenant = new Date();
    const demain = new Date(maintenant);
    demain.setDate(demain.getDate() + 1);

    const estAujourdhui = date.toDateString() === maintenant.toDateString();
    const estDemain     = date.toDateString() === demain.toDateString();

    const heure = date.toLocaleTimeString('fr-FR', {
      hour: '2-digit', minute: '2-digit'
    });

    if (estAujourdhui) return `Aujourd'hui, ${heure}`;
    if (estDemain)     return `Demain, ${heure}`;

    return date.toLocaleDateString('fr-FR', {
      weekday: 'short', day: 'numeric', month: 'short'
    }) + `, ${heure}`;
  }

  // ── Date du jour ──────────────────────────────────────────────
  dateAujourdhui = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // ── Utilisateur connecté ──────────────────────────────────────
  get utilisateur() {
    return this.authService.utilisateur();
  }

  ngOnInit(): void {
    this.chargerDonnees();
  }

  // dashboard.ts — remplace chargerDonnees()

chargerDonnees(): void {
  this.chargement.set(true);

  this.clubService.getMesAdhesions().subscribe({
    next: (adhesions) => {
      this.mesAdhesions.set(adhesions);
      this.chargement.set(false);

      // Une fois les clubs connus, charge leurs publications
      this.chargerPublicationsMesClubs(adhesions);
    },
    error: () => this.chargement.set(false)
  });

  // Publications récentes (toutes, pour la liste générale)
  this.pubService.getPublications().subscribe({
    next: (pubs) => this.publications.set(pubs.slice(0, 4))
  });
}

// ── Charge les publications de chaque club dont je suis membre ──
chargerPublicationsMesClubs(adhesions: Adhesion[]): void {
  if (adhesions.length === 0) {
    this.publicationsMesClubs.set([]);
    return;
  }

  // Charge les publications de chaque club et fusionne
  const requetes = adhesions.map(a =>
    this.pubService.getPublicationsClub(a.club.id)
  );

  forkJoin(requetes).subscribe({
    next: (resultats) => {
      // Fusionne tous les tableaux en un seul
      const toutes = resultats.flat();
      this.publicationsMesClubs.set(toutes);
    }
  });
}

  // Retourne le premier rôle d'une adhésion pour l'affichage
  getPremierRole(adhesion: Adhesion): string {
    return adhesion.roles_club?.[0]?.libelle ?? 'membre';
  }

  // Formate la date relative (il y a 2h, hier...)
  dateRelative(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const h    = Math.floor(diff / 3600000);
    const j    = Math.floor(diff / 86400000);
    if (h < 1)  return "À l'instant";
    if (h < 24) return `Il y a ${h}h`;
    if (j === 1) return 'Hier';
    return `Il y a ${j} jours`;
  }

  annee = new Date().getFullYear();
}