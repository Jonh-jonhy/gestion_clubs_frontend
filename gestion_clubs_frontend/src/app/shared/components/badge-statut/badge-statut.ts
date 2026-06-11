import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-badge-statut',
  standalone: true,
  template: `
    <span [class]="classes" class="badge-anim">
      {{ label }}
    </span>
  `,
  styleUrl: './badge-statut.css'
})
export class BadgeStatut {
  @Input() statut = '';

  get label(): string {
    const map: Record<string, string> = {
      en_attente: 'En attente',
      valide:     'Validé',
      publiee:    'Publiée',
      rejetee:    'Rejetée',
      suspendu:   'Suspendu',
      archive:    'Archivé',
    };
    return map[this.statut] ?? this.statut;
  }

  get classes(): string {
    const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    const map: Record<string, string> = {
      en_attente: `${base} bg-orange-50 text-orange-600`,
      valide:     `${base} bg-green-50  text-green-600`,
      publiee:    `${base} bg-green-50  text-green-600`,
      rejetee:    `${base} bg-red-50    text-red-600`,
      suspendu:   `${base} bg-red-50    text-red-600`,
      archive:    `${base} bg-gray-100  text-gray-500`,
    };
    return map[this.statut] ?? `${base} bg-gray-100 text-gray-500`;
  }
}