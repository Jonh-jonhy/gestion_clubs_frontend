// src/app/features/publications/detail/detail.ts
//
// Page de détail d'une publication.
// Accessible depuis "Lire la suite" sur la page publique.
// Affiche le contenu complet + infos du club.

import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink }        from '@angular/router';
import { CommonModule }                      from '@angular/common';

import { PublicationService } from '../../../core/services/publication.service';
import { AuthService }        from '../../../core/services/auth.service';
import { HeaderPublic }       from '../../../shared/components/header-public/header-public';
import { HeaderApp }          from '../../../shared/components/header-app/header-app';
import { Sidebar }            from '../../../shared/components/sidebar/sidebar';
import { Publication }        from '../../../core/models/publication.model';

@Component({
  selector: 'app-detail-publication',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    HeaderPublic,
    HeaderApp,
    Sidebar,
  ],
  templateUrl: './detail.html',
  styleUrl:    './detail.css'
})
export class DetailPublication implements OnInit {

  private route      = inject(ActivatedRoute);
  protected authService = inject(AuthService);
  private pubService = inject(PublicationService);

  publication = signal<Publication | null>(null);
  chargement  = signal(true);
  erreur      = signal(false);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.chargerPublication(id);
  }

  chargerPublication(id: number): void {
    // On récupère depuis la liste et on filtre
    // (on ajoutera un endpoint détail plus tard)
    this.pubService.getPublications().subscribe({
      next: (pubs) => {
        const pub = pubs.find(p => p.id === id);
        if (pub) {
          this.publication.set(pub);
        } else {
          this.erreur.set(true);
        }
        this.chargement.set(false);
      },
      error: () => {
        this.erreur.set(true);
        this.chargement.set(false);
      }
    });
  }

  formaterDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day:     'numeric',
      month:   'long',
      year:    'numeric'
    });
  }

  annee = new Date().getFullYear();
}