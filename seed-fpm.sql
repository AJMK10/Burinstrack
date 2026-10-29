-- =====================================================
-- SEED FPM DATA — BurinTrack
-- Supprime toutes les données sauf l'utilisateur admin
-- Insère : client FPM, 12 copieurs, 9 mois de relevés
-- =====================================================

BEGIN;

-- 1. NETTOYAGE (ordre FK)
DELETE FROM "Releves";
DELETE FROM "Interventions";
DELETE FROM "Documents";
DELETE FROM "Copieurs";
DELETE FROM "Clients";
DELETE FROM "AuditLogs";
DELETE FROM "Techniciens";

-- 2. CLIENT FPM
INSERT INTO "Clients" (
  "Id","NomClient","RaisonSociale","NumeroContrat","SecteurActivite",
  "Adresse","Ville","Commune","Pays","Latitude","Longitude",
  "NomContact","FonctionContact","Telephone","Email",
  "EstActif","TypeFacturation",
  "ForfaitMensuelHT","ForfaitCopieMono","ForfaitCopieCouleur",
  "PrixCopieSupMono","PrixCopieSupCouleur","TauxTVA",
  "CreatedAt","UpdatedAt"
) VALUES (
  'aaaaaaaa-0000-0000-0000-000000000001',
  'FPM',
  'Fonds de Prévoyance Militaire',
  '11936/MEMDEF/FPM/DG/DJC',
  'Défense / Armée',
  'Abidjan',
  'Abidjan',
  'Cocody',
  'Côte d''Ivoire',
  NULL, NULL,
  'Direction FPM',
  'Direction Générale',
  '+225 27 20 25 35 35',
  'contact@fpm.ci',
  true,
  1,
  920000, 52000, 8000,
  10, 50, 18,
  NOW(), NULL
);

-- 3. COPIEURS (12)
-- Copier IDs: bb...01 à bb...12
INSERT INTO "Copieurs" (
  "Id","ClientId","Marque","Modele","Designation","NumeroSerie",
  "DateDebutContrat","DateFinContrat","StatutContrat","Situation",
  "Localisation","AdresseIP","NotesTechniques","CreatedAt","UpdatedAt"
) VALUES
  ('bbbbbbbb-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000001','CANON','imageRUNNER Advance DX C5850i','CANON iR Advance DX C5850i — Service Courrier','2YA21855','2025-12-01T00:00:00Z','2026-11-30T00:00:00Z',0,0,'Service Courrier',NULL,NULL,NOW(),NULL),
  ('bbbbbbbb-0000-0000-0000-000000000002','aaaaaaaa-0000-0000-0000-000000000001','CANON','imageRUNNER C3326i','CANON iR C3326i — DRH','4ND13452','2025-12-01T00:00:00Z','2026-11-30T00:00:00Z',0,0,'DRH',NULL,NULL,NOW(),NULL),
  ('bbbbbbbb-0000-0000-0000-000000000003','aaaaaaaa-0000-0000-0000-000000000001','CANON','imageRUNNER C3326i','CANON iR C3326i — PRM','4ND13384','2025-12-01T00:00:00Z','2026-11-30T00:00:00Z',0,0,'PRM',NULL,NULL,NOW(),NULL),
  ('bbbbbbbb-0000-0000-0000-000000000004','aaaaaaaa-0000-0000-0000-000000000001','CANON','imageRUNNER C3326i','CANON iR C3326i — Regis','4ND23369','2025-12-01T00:00:00Z','2026-11-30T00:00:00Z',0,0,'Regis',NULL,NULL,NOW(),NULL),
  ('bbbbbbbb-0000-0000-0000-000000000005','aaaaaaaa-0000-0000-0000-000000000001','Canon','imageRUNNER C1538iF','Canon iR C1538iF — DCSID','3EB04419','2025-12-01T00:00:00Z','2026-11-30T00:00:00Z',0,0,'DCSID',NULL,NULL,NOW(),NULL),
  ('bbbbbbbb-0000-0000-0000-000000000006','aaaaaaaa-0000-0000-0000-000000000001','Canon','imageRUNNER C1538iF','Canon iR C1538iF — Secrétariat DCFF','3EB04427','2025-12-01T00:00:00Z','2026-11-30T00:00:00Z',0,0,'Secrétariat DCFF',NULL,NULL,NOW(),NULL),
  ('bbbbbbbb-0000-0000-0000-000000000007','aaaaaaaa-0000-0000-0000-000000000001','Canon','imageRUNNER C1538iF','Canon iR C1538iF — Secrétariat DG','3EB04410','2025-12-01T00:00:00Z','2026-11-30T00:00:00Z',0,0,'Secrétariat DG',NULL,NULL,NOW(),NULL),
  ('bbbbbbbb-0000-0000-0000-000000000008','aaaaaaaa-0000-0000-0000-000000000001','Canon','imageRUNNER C1538iF','Canon iR C1538iF — Archives','3EB02228','2025-12-01T00:00:00Z','2026-11-30T00:00:00Z',0,0,'Archives',NULL,NULL,NOW(),NULL),
  ('bbbbbbbb-0000-0000-0000-000000000009','aaaaaaaa-0000-0000-0000-000000000001','Canon','imageRUNNER 2945i','Canon iR 29545i — DPMMD','4PT00512','2025-12-01T00:00:00Z','2026-11-30T00:00:00Z',0,0,'DPMMD',NULL,NULL,NOW(),NULL),
  ('bbbbbbbb-0000-0000-0000-000000000010','aaaaaaaa-0000-0000-0000-000000000001','Canon','imageRUNNER 2945i','Canon iR 29545i — Compta MMD','4PT00509','2025-12-01T00:00:00Z','2026-11-30T00:00:00Z',0,0,'Compta MMD',NULL,NULL,NOW(),NULL),
  ('bbbbbbbb-0000-0000-0000-000000000011','aaaaaaaa-0000-0000-0000-000000000001','Canon','imageRUNNER 2945i','Canon iR 29545i — Compta PERM','4PT00506','2025-12-01T00:00:00Z','2026-11-30T00:00:00Z',0,0,'Compta PERM',NULL,NULL,NOW(),NULL),
  ('bbbbbbbb-0000-0000-0000-000000000012','aaaaaaaa-0000-0000-0000-000000000001','Canon','imageRUNNER 29530i','Canon iR 29530i — Service PRET','4TN04857','2025-12-01T00:00:00Z','2026-11-30T00:00:00Z',0,0,'Service PRET',NULL,NULL,NOW(),NULL);

-- 4. RELEVES COMPTEURS
-- Format: (Id, CopieurId, Annee, Mois, A3MonoDebut, A4MonoDebut, A3CoulDebut, A4CoulDebut, A3MonoFin, A4MonoFin, A3CoulFin, A4CoulFin, CreatedAt, UpdatedAt)

INSERT INTO "Releves" (
  "Id","CopieurId","Annee","Mois",
  "A3MonoDebut","A4MonoDebut","A3CoulDebut","A4CoulDebut",
  "A3MonoFin","A4MonoFin","A3CoulFin","A4CoulFin",
  "CreatedAt","UpdatedAt"
) VALUES

-- === Service Courrier (2YA21855) bb...01 ===
-- Déc 2025
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000001',2025,12, 359,61329,160,65071, 414,64982,210,69927, NOW(),NULL),
-- Jan 2026
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000001',2026,1, 414,64982,210,69927, 460,71100,257,76106, NOW(),NULL),
-- Fév 2026
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000001',2026,2, 460,71100,257,76106, 496,73739,268,79423, NOW(),NULL),
-- Mars 2026
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000001',2026,3, 496,73739,268,79423, 531,78400,296,85492, NOW(),NULL),
-- Avr 2026
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000001',2026,4, 531,78400,296,85492, 540,80559,310,88940, NOW(),NULL),
-- Mai 2026
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000001',2026,5, 540,80559,310,88940, 541,82828,310,93173, NOW(),NULL),
-- Juin 2026
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000001',2026,6, 541,82828,310,93173, 566,86769,323,98705, NOW(),NULL),
-- Juil 2026
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000001',2026,7, 566,86769,323,98705, 569,91411,468,102177, NOW(),NULL),
-- Août 2026
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000001',2026,8, 569,91411,468,102177, 571,94806,469,106465, NOW(),NULL),

-- === DRH (4ND13452) bb...02 ===
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000002',2025,12, 3,2873,10,5043, 3,3256,10,7095, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000002',2026,1, 3,3256,10,7095, 29,3863,105,10304, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000002',2026,2, 29,3863,105,10304, 31,4412,121,12545, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000002',2026,3, 31,4412,121,12545, 33,5271,200,16335, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000002',2026,4, 33,5271,200,16335, 33,5854,205,17825, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000002',2026,5, 33,5854,205,17825, 33,6875,211,19912, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000002',2026,6, 33,6875,211,19912, 53,8169,265,22785, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000002',2026,7, 53,8169,265,22785, 73,8779,276,26789, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000002',2026,8, 73,8779,276,26789, 73,9330,318,29571, NOW(),NULL),

-- === PRM (4ND13384) bb...03 ===
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000003',2025,12, 7,3065,8,3758, 73,4425,10,6429, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000003',2026,1, 73,4425,10,6429, 115,6466,12,9400, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000003',2026,2, 115,6466,12,9400, 115,7750,17,11361, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000003',2026,3, 115,7750,17,11361, 145,9907,38,14594, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000003',2026,4, 145,9907,38,14594, 145,11475,38,16417, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000003',2026,5, 145,11475,38,16417, 145,12328,38,17356, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000003',2026,6, 145,12328,38,17356, 156,13967,39,22222, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000003',2026,7, 156,13967,39,22222, 156,15254,47,23637, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000003',2026,8, 156,15254,47,23637, 156,16672,47,24412, NOW(),NULL),

-- === Regis (4ND23369) bb...04 ===
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000004',2025,12, 3,4375,10,5722, 3,6410,10,7930, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000004',2026,1, 3,6410,10,7930, 3,8112,10,11614, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000004',2026,2, 3,8112,10,11614, 3,9218,10,13526, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000004',2026,3, 3,9218,10,13526, 3,11389,10,16269, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000004',2026,4, 3,11389,10,16269, 3,12870,10,18372, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000004',2026,5, 3,12870,10,18372, 3,13581,10,19957, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000004',2026,6, 3,13581,10,19957, 3,14839,10,21953, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000004',2026,7, 3,14839,10,21953, 3,16535,10,24442, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000004',2026,8, 3,16535,10,24442, 3,17975,10,27073, NOW(),NULL),

-- === DCSID (3EB04419) bb...05 ===
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000005',2025,12, 0,10736,0,14329, 0,11301,0,14965, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000005',2026,1, 0,11301,0,14965, 0,11934,0,16686, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000005',2026,2, 0,11934,0,16686, 0,12324,0,17588, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000005',2026,3, 0,12324,0,17588, 0,13219,0,18991, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000005',2026,4, 0,13219,0,18991, 0,13530,0,19967, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000005',2026,5, 0,13530,0,19967, 0,13942,0,20727, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000005',2026,6, 0,13942,0,20727, 0,14428,0,21405, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000005',2026,7, 0,14428,0,21405, 0,14803,0,22297, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000005',2026,8, 0,14803,0,22297, 0,15114,0,23259, NOW(),NULL),

-- === Secrétariat DCFF (3EB04427) bb...06 ===
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000006',2025,12, 0,6287,0,21325, 0,6548,0,21870, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000006',2026,1, 0,6548,0,21870, 0,7050,0,23441, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000006',2026,2, 0,7050,0,23441, 0,7536,0,24324, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000006',2026,3, 0,7536,0,24324, 0,8136,0,25925, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000006',2026,4, 0,8136,0,25925, 0,8573,0,27027, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000006',2026,5, 0,8573,0,27027, 0,8765,0,27772, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000006',2026,6, 0,8765,0,27772, 0,9457,0,28905, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000006',2026,7, 0,9457,0,28905, 0,10139,0,29884, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000006',2026,8, 0,10139,0,29884, 0,10533,0,31171, NOW(),NULL),

-- === Secrétariat DG (3EB04410) bb...07 ===
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000007',2025,12, 0,1424,0,3444, 0,1486,0,3811, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000007',2026,1, 0,1486,0,3811, 0,2013,0,4188, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000007',2026,2, 0,2013,0,4188, 0,2036,0,4594, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000007',2026,3, 0,2036,0,4594, 0,2081,0,4983, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000007',2026,4, 0,2081,0,4983, 0,2088,0,4991, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000007',2026,5, 0,2088,0,4991, 0,2123,0,5131, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000007',2026,6, 0,2123,0,5131, 0,2149,0,5418, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000007',2026,7, 0,2149,0,5418, 0,2193,0,6091, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000007',2026,8, 0,2193,0,6091, 0,2212,0,6972, NOW(),NULL),

-- === Archives (3EB02228) bb...08 ===
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000008',2025,12, 0,297,0,131, 0,329,0,215, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000008',2026,1, 0,329,0,215, 0,456,0,318, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000008',2026,2, 0,456,0,318, 0,532,0,641, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000008',2026,3, 0,532,0,641, 0,816,0,942, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000008',2026,4, 0,816,0,942, 0,1892,0,3596, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000008',2026,5, 0,1892,0,3596, 0,1961,0,3612, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000008',2026,6, 0,1961,0,3612, 0,2138,0,3664, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000008',2026,7, 0,2138,0,3664, 0,2190,0,3742, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000008',2026,8, 0,2190,0,3742, 0,2488,0,7374, NOW(),NULL),

-- === DPMMD (4PT00512) bb...09 ===
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000009',2025,12, 27,66524,0,0, 27,68807,0,0, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000009',2026,1, 27,68807,0,0, 27,72957,0,0, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000009',2026,2, 27,72957,0,0, 27,75471,0,0, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000009',2026,3, 27,75471,0,0, 27,79703,0,0, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000009',2026,4, 27,79703,0,0, 27,82484,0,0, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000009',2026,5, 27,82484,0,0, 27,84265,0,0, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000009',2026,6, 27,84265,0,0, 27,88313,0,0, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000009',2026,7, 27,88313,0,0, 27,90403,0,0, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000009',2026,8, 27,90403,0,0, 27,93965,0,0, NOW(),NULL),

-- === Compta MMD (4PT00509) bb...10 ===
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000010',2025,12, 245,40238,0,0, 247,41558,0,0, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000010',2026,1, 247,41558,0,0, 273,43808,0,0, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000010',2026,2, 273,43808,0,0, 307,46102,0,0, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000010',2026,3, 307,46102,0,0, 450,50556,0,0, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000010',2026,4, 450,50556,0,0, 494,52150,0,0, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000010',2026,5, 494,52150,0,0, 494,53472,0,0, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000010',2026,6, 494,53472,0,0, 516,56765,0,0, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000010',2026,7, 516,56765,0,0, 526,58013,0,0, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000010',2026,8, 526,58013,0,0, 533,59788,0,0, NOW(),NULL),

-- === Compta PERM (4PT00506) bb...11 ===
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000011',2025,12, 149,18420,0,0, 162,18887,0,0, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000011',2026,1, 162,18887,0,0, 162,20312,0,0, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000011',2026,2, 162,20312,0,0, 162,21161,0,0, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000011',2026,3, 162,21161,0,0, 162,24095,0,0, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000011',2026,4, 162,24095,0,0, 162,25316,0,0, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000011',2026,5, 162,25316,0,0, 162,25741,0,0, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000011',2026,6, 162,25741,0,0, 162,26624,0,0, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000011',2026,7, 162,26624,0,0, 162,27268,0,0, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000011',2026,8, 162,27268,0,0, 162,28089,0,0, NOW(),NULL),

-- === Service PRET (4TN04857) bb...12 ===
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000012',2025,12, 14,76115,0,0, 14,78934,0,0, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000012',2026,1, 14,78934,0,0, 14,86151,0,0, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000012',2026,2, 14,86151,0,0, 14,86869,0,0, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000012',2026,3, 14,86869,0,0, 14,92483,0,0, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000012',2026,4, 14,92483,0,0, 14,95836,0,0, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000012',2026,5, 14,95836,0,0, 14,97620,0,0, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000012',2026,6, 14,97620,0,0, 14,101956,0,0, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000012',2026,7, 14,101956,0,0, 14,105511,0,0, NOW(),NULL),
(gen_random_uuid(),'bbbbbbbb-0000-0000-0000-000000000012',2026,8, 14,105511,0,0, 14,109819,0,0, NOW(),NULL);

COMMIT;

-- Vérification
SELECT 'Clients' AS table_name, COUNT(*) FROM "Clients"
UNION ALL SELECT 'Copieurs', COUNT(*) FROM "Copieurs"
UNION ALL SELECT 'Releves', COUNT(*) FROM "Releves";
