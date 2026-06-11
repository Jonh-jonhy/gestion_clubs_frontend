import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-badge-role',
  standalone: true,
  styleUrl: '../badge-statut/badge-statut.css',
  template: `
    <span [class]="classes" class="badge-anim">
      {{ label }}
    </span>
  `
})
export class BadgeRole {
  @Input() role = '';

  get label(): string {
    const map: Record<string, string> = {
      president:  'Président',
      secretaire: 'Secrétaire',
      tresorier:  'Trésorier',
      membre:     'Membre',
    };
    return map[this.role] ?? this.role;
  }

  get classes(): string {
    const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    const map: Record<string, string> = {
      president:  `${base} bg-purple-100 text-purple-700`,
      secretaire: `${base} bg-blue-50    text-blue-600`,
      tresorier:  `${base} bg-green-50   text-green-600`,
      membre:     `${base} bg-gray-100   text-gray-500`,
    };
    return map[this.role] ?? `${base} bg-gray-100 text-gray-500`;
  }
}