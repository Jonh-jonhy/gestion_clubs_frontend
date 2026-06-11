// src/app/features/clubs/liste/liste.ts
//
// Page liste des clubs — accessible aux membres connectés.
// Affiche tous les clubs validés.
// Le membre peut voir les clubs dont il fait partie
// et accéder aux détails de chaque club.

import { Component, inject, signal,
         computed, OnInit } from '@angular/core';
import { CommonModule }  from '@angular/common';
import { RouterLink }    from '@angular/router';
import { FormsModule }   from '@angular/forms';

import { ClubService }  from '../../../core/services/club.service';
import { AuthService }  from '../../../core/services/auth.service';
import { HeaderApp }    from '../../../shared/components/header-app/header-app';
import { Sidebar }      from '../../../shared/components/sidebar/sidebar';
import { BadgeRole }    from '../../../shared/components/badge-role/badge-role';
import { Club }         from '../../../core/models/club.model';

@Component({
  selector: 'app-liste-clubs',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    HeaderApp,
    Sidebar,
    BadgeRole,
  ],
  templateUrl: './liste.html',
  styleUrl:    './liste.css'
})
export class ListeClubs implements OnInit {

  private clubService  = inject(ClubService);
  protected authService = inject(AuthService);

  // ── Données ───────────────────────────────────────────────────
  clubs      = signal<Club[]>([]);
  chargement = signal(true);

  // ── Filtres ───────────────────────────────────────────────────
  recherche  = signal('');
  filiere    = signal('tous');

  // ── Filières pour le filtre ───────────────────────────────────
  filieres = [
    { valeur: 'tous',            label: 'Toutes les filières' },
    { valeur: 'genie_logiciel',  label: 'Génie Logiciel'      },
    { valeur: 'reseaux_telecom', label: 'Réseaux & Télécom'   },
    { valeur: 'genie_civil',     label: 'Génie Civil'         },
    { valeur: 'comptabilite',    label: 'Comptabilité'        },
    { valeur: 'marketing',       label: 'Marketing'           },
    { valeur: 'toutes_filieres', label: 'Transversal'         },
  ];

  // ── Clubs filtrés ─────────────────────────────────────────────
  clubsFiltres = computed(() => {
    let liste = this.clubs();

    if (this.filiere() !== 'tous') {
      liste = liste.filter(c => c.filiere === this.filiere());
    }

    const terme = this.recherche().toLowerCase().trim();
    if (terme) {
      liste = liste.filter(
        c => c.nom.toLowerCase().includes(terme) ||
             c.mission.toLowerCase().includes(terme)
      );
    }

    return liste;
  });

  ngOnInit(): void {
    this.clubService.getClubs().subscribe({
      next: (clubs) => {
        this.clubs.set(clubs);
        this.chargement.set(false);
      },
      error: () => this.chargement.set(false)
    });
  }

  annee = new Date().getFullYear();
}