// src/app/features/publications/creer/creer.ts
//
// Page de création d'une publication.
// Accessible au président et au secrétaire d'un club.
// La publication est soumise EN_ATTENTE jusqu'à validation admin.
// Si c'est un événement → affiche les champs date début/fin.
import { ToastService } from '../../../core/services/toast.service';
import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule,
         FormBuilder, FormGroup,
         Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { PublicationService } from '../../../core/services/publication.service';
import { ClubService }        from '../../../core/services/club.service';
import { HeaderApp }          from '../../../shared/components/header-app/header-app';
import { Sidebar }            from '../../../shared/components/sidebar/sidebar';

@Component({
  selector: 'app-creer-publication',
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
export class CreerPublication implements OnInit {

  private fb      = inject(FormBuilder);
  private route   = inject(ActivatedRoute);
  private router  = inject(Router);
  private pubService  = inject(PublicationService);
  private clubService = inject(ClubService);
  private toastService = inject(ToastService);

  // ── ID du club depuis l'URL /clubs/:clubId/publication ────────
  clubId = signal<number>(0);
  nomClub = signal<string>('');

  // ── États ─────────────────────────────────────────────────────
  chargement  = signal(false);
  erreur      = signal<string | null>(null);
  succes      = signal(false);

  // ── Toggle événement ──────────────────────────────────────────
  estEvenement = signal(false);

  // ── Aperçu image ─────────────────────────────────────────────
  imagePreview = signal<string | null>(null);
  imageFichier = signal<File | null>(null);

  // ── Compteur caractères description ──────────────────────────
  readonly MAX_DESCRIPTION = 2000;

  formulaire: FormGroup = this.fb.group({
    titre: ['', [
      Validators.required,
      Validators.minLength(5),
      Validators.maxLength(200)
    ]],
    description: ['', [
      Validators.required,
      Validators.minLength(10),
      Validators.maxLength(2000)
    ]],
    date_debut: [null],
    date_fin:   [null],
  });

  get titre()       { return this.formulaire.get('titre');       }
  get description() { return this.formulaire.get('description'); }
  get date_debut()  { return this.formulaire.get('date_debut');  }
  get date_fin()    { return this.formulaire.get('date_fin');    }

  get descriptionRestant(): number {
    return this.MAX_DESCRIPTION -
           (this.description?.value?.length ?? 0);
  }

  ngOnInit(): void {
    // Récupère l'id du club depuis l'URL
    this.clubId.set(
      Number(this.route.snapshot.paramMap.get('id'))
    );

    // Charge le nom du club pour l'afficher
    if (this.clubId()) {
      this.clubService.getClub(this.clubId()).subscribe({
        next: (club) => this.nomClub.set(club.nom)
      });
    }
  }

  // ── Toggle événement ──────────────────────────────────────────
  toggleEvenement(): void {
    this.estEvenement.update(v => !v);

    if (!this.estEvenement()) {
      // Réinitialise les dates si on désactive l'événement
      this.formulaire.patchValue({
        date_debut: null,
        date_fin: null
      });
      this.date_debut?.clearValidators();
      this.date_fin?.clearValidators();
    } else {
      // Rend les dates obligatoires si c'est un événement
      this.date_debut?.setValidators([Validators.required]);
      this.date_fin?.setValidators([Validators.required]);
    }

    this.date_debut?.updateValueAndValidity();
    this.date_fin?.updateValueAndValidity();
  }

  // ── Upload image ──────────────────────────────────────────────
  onImageChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0];
    if (!file) return;

    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      this.erreur.set('Format non supporté. PNG, JPG ou WEBP uniquement.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.erreur.set('Image trop lourde (max 5Mo).');
      return;
    }

    this.imageFichier.set(file);
    this.erreur.set(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      this.imagePreview.set(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  supprimerImage(): void {
    this.imagePreview.set(null);
    this.imageFichier.set(null);
  }

  // ── Soumission ────────────────────────────────────────────────
  soumettre(): void {
    if (this.formulaire.invalid) {
      this.formulaire.markAllAsTouched();
      return;
    }

    // Validation dates si événement
    if (this.estEvenement()) {
      const debut = new Date(this.date_debut?.value);
      const fin   = new Date(this.date_fin?.value);
      if (fin <= debut) {
        this.erreur.set(
          'La date de fin doit être postérieure à la date de début.'
        );
        return;
      }
    }

    this.chargement.set(true);
    this.erreur.set(null);

    // Construction FormData pour support image
    const formData = new FormData();
    formData.append('titre',       this.formulaire.value.titre);
    formData.append('description', this.formulaire.value.description);

    if (this.estEvenement()) {
      formData.append('date_debut', this.formulaire.value.date_debut);
      formData.append('date_fin',   this.formulaire.value.date_fin);
    }

    if (this.imageFichier()) {
      formData.append('image', this.imageFichier()!);
    }

    this.pubService.creerPublication(
      this.clubId(),
      formData
    ).subscribe({
      next: () => {
        this.toastService.succes(
          'Publication soumise !',
          'En attente de validation par l\'administrateur.'
        );
        this.succes.set(true);
        this.chargement.set(false);
        setTimeout(() => {
          this.router.navigate(['/clubs', this.clubId()]);
        }, 2000);
      },
      error: (err) => {
        this.toastService.erreur(
          'Erreur lors de la soumission',
          err.error?.titre?.[0] ?? 'Vérifiez les champs.'
        );
        const e = err.error;
        this.erreur.set(
          e?.titre?.[0]       ??
          e?.description?.[0] ??
          e?.date_fin?.[0]    ??
          'Une erreur est survenue.'
        );
        this.chargement.set(false);
      }
    });
  }

  annee = new Date().getFullYear();
}