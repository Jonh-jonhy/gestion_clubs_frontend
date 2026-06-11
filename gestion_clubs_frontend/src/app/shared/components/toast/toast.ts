// src/app/shared/components/toast/toast.ts

import { Component, inject } from '@angular/core';
import { CommonModule }      from '@angular/common';
import { ToastService, Toast } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.html',
  styleUrl:    './toast.css'
})
export class ToastComponent {
  protected toastService = inject(ToastService);

  // Couleurs et icônes selon le type
  getConfig(type: string): {
    bg: string; border: string;
    icon: string; iconColor: string; titleColor: string;
  } {
    const configs: Record<string, any> = {
      succes: {
        bg:         'bg-white',
        border:     'border-l-4 border-green-500',
        icon:       'check',
        iconColor:  'text-green-500 bg-green-50',
        titleColor: 'text-green-700',
      },
      erreur: {
        bg:         'bg-white',
        border:     'border-l-4 border-red-500',
        icon:       'x',
        iconColor:  'text-red-500 bg-red-50',
        titleColor: 'text-red-700',
      },
      info: {
        bg:         'bg-white',
        border:     'border-l-4 border-blue-500',
        icon:       'info',
        iconColor:  'text-blue-500 bg-blue-50',
        titleColor: 'text-blue-700',
      },
      attention: {
        bg:         'bg-white',
        border:     'border-l-4 border-orange-500',
        icon:       'warning',
        iconColor:  'text-orange-500 bg-orange-50',
        titleColor: 'text-orange-700',
      },
    };
    return configs[type] ?? configs['info'];
  }

  trackById(index: number, toast: Toast): number {
    return toast.id;
  }
}