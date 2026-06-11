// src/app/core/services/publication.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environement';
import { Publication } from '../models/publication.model';

@Injectable({ providedIn: 'root' })
export class PublicationService {

  private http   = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/clubs`;

  // GET /api/clubs/publications/ — liste publique
  getPublications(): Observable<Publication[]> {
    return this.http.get<Publication[]>(
      `${this.apiUrl}/publications/`
    );
  }

  // GET /api/clubs/<id>/publications/ — publications d'un club
  getPublicationsClub(clubId: number): Observable<Publication[]> {
    return this.http.get<Publication[]>(
      `${this.apiUrl}/${clubId}/publications/`
    );
  }

  // POST /api/clubs/<id>/publications/creer/
  creerPublication(clubId: number, data: any): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/${clubId}/publications/creer/`, data
    );
  }

  // GET /api/clubs/publications/en-attente/ — admin
  getPublicationsEnAttente(): Observable<Publication[]> {
    return this.http.get<Publication[]>(
      `${this.apiUrl}/publications/en-attente/`
    );
  }

  // POST /api/clubs/publications/<id>/valider/ — admin
  validerPublication(pubId: number, data: any): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/publications/${pubId}/valider/`, data
    );
  }
}