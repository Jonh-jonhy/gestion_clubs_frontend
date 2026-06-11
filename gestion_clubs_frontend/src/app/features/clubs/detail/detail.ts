// src/app/features/clubs/detail/detail.ts
//
// Page de détail d'un club.
// Affiche les infos du club, ses publications et ses membres.
// Les actions disponibles dépendent du rôle de l'utilisateur
// dans ce club (président, secrétaire, membre simple).

import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';

import { ToastService } from '../../../core/services/toast.service';
import { AuthService }        from '../../../core/services/auth.service';
import { ClubService }        from '../../../core/services/club.service';
import { PublicationService } from '../../../core/services/publication.service';

import { HeaderApp }   from '../../../shared/components/header-app/header-app';
import { Sidebar }     from '../../../shared/components/sidebar/sidebar';
import { BadgeStatut } from '../../../shared/components/badge-statut/badge-statut';
import { BadgeRole }   from '../../../shared/components/badge-role/badge-role';

import { Club, Adhesion, RoleClub } from '../../../core/models/club.model';
import { Publication }              from '../../../core/models/publication.model';

@Component({
  selector: 'app-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    HeaderApp,
    Sidebar,
    BadgeStatut,
    BadgeRole,
  ],
  templateUrl: './detail.html',
  styleUrl: './detail.css'
})
export class Detail implements OnInit {

  private route      = inject(ActivatedRoute);
  protected authService = inject(AuthService);
  private clubService = inject(ClubService);
  private pubService  = inject(PublicationService);
  private fb          = inject(FormBuilder);
  private toastService = inject(ToastService);

  // ── Données ───────────────────────────────────────────────────
  club         = signal<Club | null>(null);
  membres      = signal<Adhesion[]>([]);
  publications = signal<Publication[]>([]);
  roles        = signal<RoleClub[]>([]);
  chargement   = signal(true);

  // ── Modal gérer les rôles ─────────────────────────────────────
  modalRolesOuvert     = signal(false);
  membreSelectionne    = signal<Adhesion | null>(null);
  rolesSelectionnes    = signal<number[]>([]);

  // ── Modal ajouter un membre ───────────────────────────────────
  modalAjoutOuvert = signal(false);
  formulaireAjout: FormGroup;
  erreurAjout      = signal<string | null>(null);
  chargementAjout  = signal(false);

  // ── ID du club depuis l'URL ───────────────────────────────────
  protected clubId!: number;

  constructor() {
    this.formulaireAjout = this.fb.group({
      email:     [''],
      roles_ids: [[]]
    });
  }

  ngOnInit(): void {
    this.clubId = Number(this.route.snapshot.paramMap.get('id'));
    this.chargerDonnees();
  }

  chargerDonnees(): void {
    this.chargement.set(true);

    // Charge le club
    this.clubService.getClub(this.clubId).subscribe({
      next: (club) => {
        this.club.set(club);
        this.chargement.set(false);
      },
      error: () => this.chargement.set(false)
    });

    // Charge les membres
    this.clubService.getMembres(this.clubId).subscribe({
      next: (membres) => this.membres.set(membres)
    });

    // Charge les publications du club
    this.pubService.getPublicationsClub(this.clubId).subscribe({
      next: (pubs) => this.publications.set(pubs)
    });

    // Charge les rôles disponibles
    this.clubService.getRoles(this.clubId).subscribe({
      next: (roles) => this.roles.set(roles)
    });
  }

  // ── Vérifie le rôle de l'utilisateur dans ce club ────────────
  get monAdhesion(): Adhesion | undefined {
    const userId = this.authService.utilisateur()?.id;
    return this.membres().find(
      m => m.utilisateur.id === userId && m.est_actif
    );
  }

  get estPresident(): boolean {
    return this.monAdhesion?.roles_club
      .some(r => r.libelle === 'president') ?? false;
  }

  get estSecretaire(): boolean {
    return this.monAdhesion?.roles_club
      .some(r => r.libelle === 'secretaire') ?? false;
  }

  get peutPublier(): boolean {
    return this.estPresident ||
           this.estSecretaire ||
           this.authService.estAdmin();
  }

  // ── Rôles filtrés (sans président — réservé à l'admin) ───────
  get rolesDisponibles(): RoleClub[] {
    if (this.authService.estAdmin()) return this.roles();
    return this.roles().filter(r => r.libelle !== 'president');
  }

  // ── Modal rôles ───────────────────────────────────────────────
  ouvrirModalRoles(membre: Adhesion): void {
    this.membreSelectionne.set(membre);
    // Pré-coche les rôles actuels du membre
    const rolesActuels = membre.roles_club
      .filter(r => r.libelle !== 'president')
      .map(r => r.id);
    this.rolesSelectionnes.set(rolesActuels);
    this.modalRolesOuvert.set(true);
  }

  fermerModalRoles(): void {
    this.modalRolesOuvert.set(false);
    this.membreSelectionne.set(null);
  }

  toggleRole(roleId: number): void {
    const actuels = this.rolesSelectionnes();
    if (actuels.includes(roleId)) {
      this.rolesSelectionnes.set(actuels.filter(id => id !== roleId));
    } else {
      this.rolesSelectionnes.set([...actuels, roleId]);
    }
  }

  enregistrerRoles(): void {
    const membre = this.membreSelectionne();
    if (!membre) return;

    this.clubService.gererRoles(
      this.clubId,
      membre.utilisateur.id,
      this.rolesSelectionnes()
    ).subscribe({
      next: () => {
        this.toastService.succes(
          'Rôles mis à jour !',
        );
        this.fermerModalRoles();
        this.chargerDonnees();
      }
    });
  }

  // ── Modal ajout membre ────────────────────────────────────────
  ouvrirModalAjout(): void {
    this.modalAjoutOuvert.set(true);
    this.erreurAjout.set(null);
    this.formulaireAjout.reset({ email: '', roles_ids: [] });
  }

  fermerModalAjout(): void {
    this.modalAjoutOuvert.set(false);
  }

  ajouterMembre(): void {
    this.chargementAjout.set(true);
    this.erreurAjout.set(null);

    this.clubService.ajouterMembre(
      this.clubId,
      this.formulaireAjout.value
    ).subscribe({
      
      next: () => {
        this.toastService.succes(
           'Membre ajouté !'
          // ,
          // `${utilisateur.get_full_name} a rejoint le club.`
        );
        this.fermerModalAjout();
        this.chargerDonnees();
        this.chargementAjout.set(false);

        // Rafraîchit le profil de l'utilisateur connecté
        // car son rôle peut être passé de visiteur à membre
        this.authService.rafraichirProfil();
      },
      error: (err) => {
        this.erreurAjout.set(
          err.error?.error ?? 'Une erreur est survenue.'
        );
        this.chargementAjout.set(false);
      }
    });
  }

  // ── Retirer un membre ─────────────────────────────────────────
  retirerMembre(userId: number): void {
    if (!confirm('Confirmer le retrait de ce membre ?')) return;
    this.clubService.retirerMembre(this.clubId, userId)
      .subscribe({ next: () => {
        this.toastService.info('Membre retiré du club.');
        this.chargerDonnees()
      } });
  }

  // ── Helpers ───────────────────────────────────────────────────
  getPremierRole(adhesion: Adhesion): string {
    return adhesion.roles_club?.[0]?.libelle ?? 'membre';
  }

  dateRelative(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const h = Math.floor(diff / 3600000);
    const j = Math.floor(diff / 86400000);
    if (h < 1)   return "À l'instant";
    if (h < 24)  return `Il y a ${h}h`;
    if (j === 1) return 'Hier';
    return `Il y a ${j} jours`;
  }

  annee = new Date().getFullYear();
}