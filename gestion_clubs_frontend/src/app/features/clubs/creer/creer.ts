// src/app/features/clubs/creer/creer.ts
//
// Page de création d'un club avec stepper 3 étapes.
// Étape 1 → Informations de base
// Étape 2 → Personnalisation (logo)
// Étape 3 → Confirmation et soumission
//
// Après soumission, l'admin reçoit une notification
// et valide la demande (statut EN_ATTENTE par défaut).

import { ToastService } from '../../../core/services/toast.service';
import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule,
         FormBuilder, FormGroup,
         Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { ClubService }  from '../../../core/services/club.service';
import { HeaderApp }    from '../../../shared/components/header-app/header-app';
import { Sidebar }      from '../../../shared/components/sidebar/sidebar';

@Component({
  selector: 'app-creer',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    HeaderApp,
    Sidebar,
  ],
  templateUrl: './creer.html',
  styleUrl: './creer.css'
})
export class Creer {

  private fb          = inject(FormBuilder);
  private clubService = inject(ClubService);
  private router      = inject(Router);
  private toastService = inject(ToastService);

  // ── Étape courante (1, 2 ou 3) ───────────────────────────────
  etapeCourante = signal(1);

  // ── États ─────────────────────────────────────────────────────
  chargement  = signal(false);
  erreur      = signal<string | null>(null);
  succes      = signal(false);

  // ── Prévisualisation du logo ──────────────────────────────────
  logoPreview = signal<string | null>(null);
  logoFichier = signal<File | null>(null);

  // ── Filières disponibles (depuis notre backend Django) ────────
  filieres = [
    { valeur: 'genie_logiciel',  label: 'Génie Logiciel'              },
    { valeur: 'reseaux_telecom', label: 'Réseaux & Télécommunications' },
    { valeur: 'genie_civil',     label: 'Génie Civil'                  },
    { valeur: 'comptabilite',    label: 'Comptabilité'                 },
    { valeur: 'marketing',       label: 'Marketing'                    },
    { valeur: 'toutes_filieres', label: 'Toutes filières'              },
  ];

  // ── Formulaire étape 1 ────────────────────────────────────────
  formEtape1: FormGroup = this.fb.group({
    nom: ['', [
      Validators.required,
      Validators.minLength(3),
      Validators.maxLength(150)
    ]],
    filiere: ['', Validators.required],
    mission: ['', [
      Validators.required,
      Validators.minLength(20),
      Validators.maxLength(500)
    ]],
  });

  // ── Getters pour accéder aux champs ──────────────────────────
  get nom()     { return this.formEtape1.get('nom');     }
  get filiere() { return this.formEtape1.get('filiere'); }
  get mission() { return this.formEtape1.get('mission'); }

  // ── Nombre de caractères restants pour la mission ─────────────
  get missionRestant(): number {
    return 500 - (this.mission?.value?.length ?? 0);
  }

  // ── Étape suivante ────────────────────────────────────────────
  etapeSuivante(): void {
    if (this.etapeCourante() === 1) {
      // Valide le formulaire avant de passer à l'étape 2
      if (this.formEtape1.invalid) {
        this.formEtape1.markAllAsTouched();
        return;
      }
    }
    this.etapeCourante.update(e => Math.min(e + 1, 3));
  }

  // ── Étape précédente ──────────────────────────────────────────
  etapePrecedente(): void {
    this.etapeCourante.update(e => Math.max(e - 1, 1));
  }

  // ── Upload du logo ────────────────────────────────────────────
  onLogoChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0];

    if (!file) return;

    // Vérifie le type et la taille (max 2Mo)
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      this.erreur.set('Format non supporté. Utilisez PNG, JPG ou WEBP.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      this.erreur.set('Le fichier est trop lourd (max 2Mo).');
      return;
    }

    this.logoFichier.set(file);
    this.erreur.set(null);

    // Génère un aperçu local
    const reader = new FileReader();
    reader.onload = (e) => {
      this.logoPreview.set(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  // ── Supprime le logo sélectionné ──────────────────────────────
  supprimerLogo(): void {
    this.logoPreview.set(null);
    this.logoFichier.set(null);
  }

  // ── Soumission finale ─────────────────────────────────────────
  soumettre(): void {
    this.chargement.set(true);
    this.erreur.set(null);

    // Construction du FormData pour envoyer le fichier image
    const formData = new FormData();
    formData.append('nom',     this.formEtape1.value.nom);
    formData.append('filiere', this.formEtape1.value.filiere);
    formData.append('mission', this.formEtape1.value.mission);

    if (this.logoFichier()) {
      formData.append('logo', this.logoFichier()!);
    }

    this.clubService.creerClub(formData as any).subscribe({
      next: () => {
        this.toastService.succes(
          'Demande envoyée !',
          'En attente de validation par l\'administrateur.'
        );
        this.succes.set(true);
        this.chargement.set(false);
        // Redirige vers le dashboard après 2 secondes
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 2500);
      },
      error: (err) => {
        this.toastService.erreur(
          'Erreur',
          err.error?.nom?.[0] ?? 'Une erreur est survenue.'
        );
        const e = err.error;
        this.erreur.set(
          e?.nom?.[0] ?? e?.mission?.[0] ?? 'Une erreur est survenue.'
        );
        this.chargement.set(false);
        // Retourne à l'étape 1 si erreur sur les champs
        this.etapeCourante.set(1);
      }
    });
  }

  // ── Label filière depuis la valeur ────────────────────────────
  getFiliereLabel(valeur: string): string {
    return this.filieres.find(f => f.valeur === valeur)?.label ?? valeur;
  }

  annee = new Date().getFullYear();
}