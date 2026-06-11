// src/app/features/admin/dashboard/dashboard.ts
//
// Dashboard administrateur.
// Affiche les statistiques globales, les clubs en attente
// de validation, un graphique par filière et l'activité récente.

import { Component, inject, signal,
         OnInit, AfterViewInit,
         ElementRef, ViewChild } from '@angular/core';
import { CommonModule }   from '@angular/common';
import { RouterLink }     from '@angular/router';
import { Chart,
         ChartConfiguration,
         registerables } from 'chart.js';

import { ClubService }        from '../../../core/services/club.service';
import { PublicationService } from '../../../core/services/publication.service';
import { AuthService }        from '../../../core/services/auth.service';
import { HeaderApp }          from '../../../shared/components/header-app/header-app';
import { SidebarAdmin }       from '../../../shared/components/sidebar-admin/sidebar-admin';
import { BadgeStatut }        from '../../../shared/components/badge-statut/badge-statut';
import { Club }               from '../../../core/models/club.model';

// Enregistre tous les composants Chart.js nécessaires
Chart.register(...registerables);

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    HeaderApp,
    SidebarAdmin,
    BadgeStatut,
  ],
  templateUrl: './dashboard.html',
  styleUrl:    './dashboard.css'
})
export class AdminDashboard implements OnInit, AfterViewInit {

  private clubService  = inject(ClubService);
  private pubService   = inject(PublicationService);
  protected authService = inject(AuthService);

  // Référence au canvas du graphique
  @ViewChild('chartCanvas')
  chartCanvas!: ElementRef<HTMLCanvasElement>;

  private chart: Chart | null = null;

  // ── Données ───────────────────────────────────────────────────
  stats = signal({
    total_clubs:      0,
    clubs_valides:    0,
    total_membres:    0,
    pubs_en_attente:  0,
  });

  clubsEnAttente   = signal<Club[]>([]);
  chargement       = signal(true);
  chargementAction = signal<number | null>(null);

  // ── Données graphique filières ────────────────────────────────
  donneesGraph = signal<{label: string; valeur: number}[]>([]);

  // ── Activité récente (simulée pour l'instant) ─────────────────
  activiteRecente = [
    {
      icone:   'check',
      couleur: 'text-green-600',
      texte:   "Validation du club 'Photo ISJ'",
      auteur:  'Admin Principal',
      heure:   '14:30'
    },
    {
      icone:   'x',
      couleur: 'text-red-500',
      texte:   "Publication rejetée: 'Soirée Gala'",
      auteur:  'Admin Principal',
      heure:   '11:15'
    },
    {
      icone:   'clock',
      couleur: 'text-blue-500',
      texte:   'Nouveau membre admin ajouté',
      auteur:  'Super Admin',
      heure:   'Hier'
    },
    {
      icone:   'clock',
      couleur: 'text-gray-400',
      texte:   "Mise à jour des règles du club Sport",
      auteur:  'Admin Principal',
      heure:   'Hier'
    },
  ];

  ngOnInit(): void {
    this.chargerDonnees();
  }

  ngAfterViewInit(): void {
    // Le graphique est initialisé après que les données
    // soient chargées dans chargerDonnees()
  }

  chargerDonnees(): void {
    this.chargement.set(true);

    // ── Statistiques ──────────────────────────────────────────────
    this.clubService.getStatistiques().subscribe({
      next: (data) => {
        this.stats.set({
          total_clubs:     data.clubs.total,
          clubs_valides:   data.clubs.valides,
          total_membres:   data.utilisateurs.membres,
          pubs_en_attente: data.publications.en_attente,
        });

        // Données graphique
        this.donneesGraph.set(data.top_clubs.map((c: any) => ({
          label:  c.nom,
          valeur: c.nb_membres
        })));

        setTimeout(() => this.initGraphique(), 100);
        this.chargement.set(false);
      },
      error: () => this.chargement.set(false)
    });

    // ── Clubs en attente ──────────────────────────────────────────
    // On utilise le nouvel endpoint admin
    this.clubService.getClubsParStatut('en_attente').subscribe({
      next: (clubs) => {
        this.clubsEnAttente.set(clubs);
      },
      error: (err) => {
        console.error('Erreur chargement clubs en attente', err);
      }
    });
  }

  // ── Initialisation Chart.js ───────────────────────────────────
  initGraphique(): void {
    if (!this.chartCanvas || this.chart) return;

    const labels  = this.donneesGraph().map(d => d.label);
    const valeurs = this.donneesGraph().map(d => d.valeur);

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Membres',
          data: valeurs,
          backgroundColor: [
            'rgba(124, 58, 237, 0.8)',
            'rgba(124, 58, 237, 0.6)',
            'rgba(124, 58, 237, 0.5)',
            'rgba(124, 58, 237, 0.4)',
            'rgba(124, 58, 237, 0.3)',
          ],
          borderColor: 'rgba(124, 58, 237, 1)',
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#7C3AED',
            titleColor: '#fff',
            bodyColor: '#fff',
            padding: 10,
            cornerRadius: 8,
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: '#f3f4f6' },
            ticks: {
              color: '#9ca3af',
              font: { size: 11 }
            }
          },
          x: {
            grid: { display: false },
            ticks: {
              color: '#9ca3af',
              font: { size: 10 },
              maxRotation: 30,
            }
          }
        }
      }
    };

    this.chart = new Chart(
      this.chartCanvas.nativeElement,
      config
    );
  }

  // ── Valider un club ───────────────────────────────────────────
  validerClub(clubId: number): void {
    this.chargementAction.set(clubId);

    this.clubService.validerClub(clubId).subscribe({
      next: () => {
        // Recharge les données depuis l'API
        // pour avoir le nombre_membres à jour
        this.chargerDonnees();
        this.chargementAction.set(null);
      },
      error: () => this.chargementAction.set(null)
    });
  }

  // ── Formater la date relative ─────────────────────────────────
  dateRelative(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const j    = Math.floor(diff / 86400000);
    if (j === 0) return "Aujourd'hui";
    if (j === 1) return 'Hier';
    if (j < 7)   return `Il y a ${j} jours`;
    if (j < 14)  return 'Il y a 1 semaine';
    return `Il y a ${Math.floor(j / 7)} semaines`;
  }

  get prenomAdmin(): string {
    return this.authService.utilisateur()?.prenom ?? 'Admin';
  }

  annee = new Date().getFullYear();
}