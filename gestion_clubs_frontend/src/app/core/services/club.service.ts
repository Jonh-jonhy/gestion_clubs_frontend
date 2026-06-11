// src/app/core/services/club.service.ts
//
// Service de gestion des clubs.
// Centralise tous les appels API liés aux clubs.

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environement';
import { Club,
         RoleClub, 
         Adhesion,
         ClubCreationRequest,
         } from '../models/club.model';

@Injectable({ providedIn: 'root' })
export class ClubService {

  private http   = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/clubs`;

  // GET /api/clubs/ — liste publique clubs validés
  getClubs(): Observable<Club[]> {
    return this.http.get<Club[]>(`${this.apiUrl}/`);
  }

  // GET /api/clubs/admin/tous/
  getTousClubsAdmin(): Observable<Club[]> {
    return this.http.get<Club[]>(
      `${this.apiUrl}/admin/tous/`
    );
  }

    // GET /api/clubs/admin/tous/?statut=en_attente
  getClubsParStatut(statut: string): Observable<Club[]> {
    return this.http.get<Club[]>(
      `${this.apiUrl}/admin/tous/?statut=${statut}`
    );
  }

  // GET /api/clubs/<id>/ — détail d'un club
  getClub(id: number): Observable<Club> {
    return this.http.get<Club>(`${this.apiUrl}/${id}/`);
  }

  // POST /api/clubs/creer/ — créer un club
  creerClub(data: ClubCreationRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/creer/`, data);
  }

  // GET /api/clubs/<id>/membres/ — membres d'un club
  getMembres(clubId: number): Observable<Adhesion[]> {
    return this.http.get<Adhesion[]>(
      `${this.apiUrl}/${clubId}/membres/`
    );
  }

  // GET /api/clubs/<id>/roles/ — rôles d'un club
  getRoles(clubId: number): Observable<RoleClub[]> {
    return this.http.get<RoleClub[]>(
      `${this.apiUrl}/${clubId}/roles/`
    );
  }

  // POST /api/clubs/<id>/membres/ajouter/
  ajouterMembre(clubId: number, data: any): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/${clubId}/membres/ajouter/`, data
    );
  }

  // DELETE /api/clubs/<id>/membres/<userId>/retirer/
  retirerMembre(clubId: number, userId: number): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/${clubId}/membres/${userId}/retirer/`
    );
  }

  // PUT /api/clubs/<id>/membres/<userId>/roles/
  gererRoles(
    clubId: number,
    userId: number,
    rolesIds: number[]
  ): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/${clubId}/membres/${userId}/roles/`,
      { roles_ids: rolesIds }
    );
  }

  // POST /api/clubs/<id>/valider/ — admin
  validerClub(clubId: number): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/${clubId}/valider/`, {}
    );
  }

  // POST /api/clubs/<id>/suspendre/ — admin
  suspendreClub(clubId: number): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/${clubId}/suspendre/`, {}
    );
  }

  // GET /api/clubs/statistiques/ — admin
  getStatistiques(): Observable<any> {
    return this.http.get(`${this.apiUrl}/statistiques/`);
  }

  // ── Archiver un club ──────────────────────────────────────────
  archiverClub(clubId: number): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/${clubId}/archiver/`, {}
    );
  }

  // ── Mes adhésions ─────────────────────────────────────────────
  // GET /api/clubs/mes-adhesions/
  getMesAdhesions(): Observable<Adhesion[]> {
    return this.http.get<Adhesion[]>(
      `${this.apiUrl}/mes-adhesions/`
    );
  }
}