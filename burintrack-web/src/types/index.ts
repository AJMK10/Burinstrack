export type StatutIntervention = 'Ouverte' | 'EnCours' | 'Resolue' | 'Fermee';
export type StatutCopieur = 'Actif' | 'EnMaintenance' | 'Remplace' | 'HorsService';
export type StatutContrat = 'Actif' | 'Expire' | 'Suspendu' | 'Resilie';
export type NatureIntervention =
  | 'MaintenancePreventive'
  | 'MaintenanceCurative'
  | 'Panne'
  | 'Installation'
  | 'FormationUtilisateur'
  | 'DeplacementTechnique'
  | 'Autre';

export interface Client {
  id: string;
  nomClient: string;
  raisonSociale: string;
  numeroContrat: string;
  secteurActivite: string;
  adresse: string;
  ville: string;
  commune: string;
  pays: string;
  latitude?: number | null;
  longitude?: number | null;
  nomContact: string;
  fonctionContact: string;
  telephone: string;
  email: string;
  estActif: boolean;
  nombreCopieurs: number;
  createdAt: string;
}

export interface Copieur {
  id: string;
  clientId: string;
  nomClient: string;
  marque: string;
  modele: string;
  designation: string;
  numeroSerie: string;
  dateDebutContrat: string;
  dateFinContrat: string;
  statutContrat: StatutContrat;
  situation: StatutCopieur;
  adresseIP?: string | null;
  localisation?: string | null;
  notesTechniques?: string | null;
  joursAvantExpiration: number;
  createdAt: string;
}

export interface Technicien {
  id: string;
  nom: string;
  prenom: string;
  nomComplet: string;
  telephone: string;
  email: string;
  estActif: boolean;
  totalInterventions: number;
  interventionsEnCours: number;
  createdAt: string;
}

export interface Intervention {
  id: string;
  numeroIntervention: string;
  dateIntervention: string;
  clientId: string;
  nomClient: string;
  copieurId: string;
  designationCopieur: string;
  numeroSerie: string;
  technicienId: string;
  nomTechnicien: string;
  compteurNBPrecedent: number;
  compteurNBActuel: number;
  compteurCouleurPrecedent: number;
  compteurCouleurActuel: number;
  volumeNBConsomme: number;
  volumeCouleurConsomme: number;
  nature: NatureIntervention;
  descriptionProbleme: string;
  actionsRealisees: string;
  piecesRemplacees?: string | null;
  heureArrivee?: string | null;
  heureDepart?: string | null;
  observationTechnicien?: string | null;
  observationClient?: string | null;
  statut: StatutIntervention;
  createdAt: string;
}

export interface ReleveCompteur {
  id: string;
  copieurId: string;
  nomCopieur: string;
  numeroSerie: string;
  nomClient: string;
  annee: number;
  mois: number;
  a3MonoDebut: number; a4MonoDebut: number; a3CoulDebut: number; a4CoulDebut: number;
  a3MonoFin: number;   a4MonoFin: number;   a3CoulFin: number;   a4CoulFin: number;
  copiesMonoA4Eq: number;
  copiesCoulA4Eq: number;
  createdAt: string;
}

export interface DetailCopieurFacture {
  copieurId: string;
  nomCopieur: string;
  numeroSerie: string;
  copiesMonoA4Eq: number;
  copiesCoulA4Eq: number;
}

export interface FactureMensuelle {
  clientId: string;
  nomClient: string;
  numeroContrat: string;
  annee: number;
  mois: number;
  totalMonoA4Eq: number;
  totalCoulA4Eq: number;
  forfaitCopieMono: number;
  forfaitCopieCouleur: number;
  copiesSupMono: number;
  copiesSupCouleur: number;
  forfaitMensuelHT: number;
  coutCopiesSupHT: number;
  totalHT: number;
  tauxTVA: number;
  montantTVA: number;
  totalTTC: number;
  details: DetailCopieurFacture[];
}

export interface AppUser {
  id: string;
  email: string;
  nomComplet: string;
  role: string;
  isLocked: boolean;
}

export interface Dashboard {
  totalClients: number;
  totalCopieurs: number;
  contratsActifs: number;
  interventionsOuvertes: number;
  interventionsEnCours: number;
  interventionsResolues: number;
  interventionsFermees: number;
  totalTechniciens: number;
  contratsExpirant30: number;
  contratsExpirant60: number;
  interventionsParTechnicien: {
    nomTechnicien: string;
    nombreInterventions: number;
    interventionsResolues: number;
  }[];
  contratsExpirantBientot: {
    copieurId: string;
    designation: string;
    numeroSerie: string;
    nomClient: string;
    dateFinContrat: string;
    joursRestants: number;
  }[];
  interventionsParMois: { mois: string; libelle: string; total: number; pannes: number }[];
  interventionsParNature: { cle: NatureIntervention; valeur: number }[];
  pannesRecurrentes: {
    copieurId: string;
    designation: string;
    numeroSerie: string;
    nomClient: string;
    nombrePannes: number;
  }[];
  volumesTotaux: {
    totalNB: number;
    totalCouleur: number;
    parClient: { nomClient: string; volumeNB: number; volumeCouleur: number }[];
  };
}
