
// Composant racine de l'application.
// RouterOutlet est nécessaire pour afficher
// les composants selon la route active.

import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './shared/components/toast/toast';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastComponent],  // ← nécessaire pour le routing
  template: `<router-outlet />
              <app-toast />`,  // ← affiche le composant de la route active
})
export class App {}