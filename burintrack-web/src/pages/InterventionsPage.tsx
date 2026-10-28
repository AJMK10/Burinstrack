import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Filter, Clock, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import api from '../lib/api';
import type { Intervention, StatutIntervention } from '../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuthStore } from '../store/authStore';

const STATUT_CONFIG: Record<StatutIntervention, { label: string; color: string; icon: any }> = {
  Ouverte: { label: 'Ouverte', color: 'bg-blue-100 text-blue-700', icon: AlertCircle },
  EnCours: { label: 'En cours', color: 'bg-amber-100 text-amber-700', icon: Clock },
  Resolue: { label: 'Résolue', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  Fermee: { label: 'Fermée', color: 'bg-gray-100 text-gray-700', icon: XCircle },
};

const NATURE_LABELS: Record<string, string> = {
  MaintenancePreventive: 'Maintenance préventive',
  MaintenanceCurative: 'Maintenance curative',
  Panne: 'Panne',
  Installation: 'Installation',
  FormationUtilisateur: 'Formation',
  DeplacementTechnique: 'Déplacement technique',
  Autre: 'Autre',
};

export default function InterventionsPage() {
  const { hasRole } = useAuthStore();
  const canCreate = hasRole('Administrateur') || hasRole('ResponsableSAV') || hasRole('Technicien');
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState<StatutIntervention | ''>('');
  const [page, setPage] = useState(1);

  const { data: interventions = [], isLoading } = useQuery<Intervention[]>({
    queryKey: ['interventions', statutFilter, page],
    queryFn: () => api.get('/interventions', {
      params: { statut: statutFilter || undefined, page, taille: 20 }
    }).then(r => r.data),
  });

  const filtered = interventions.filter(i =>
    !search ||
    i.nomClient.toLowerCase().includes(search.toLowerCase()) ||
    i.numeroIntervention.toLowerCase().includes(search.toLowerCase()) ||
    i.nomTechnicien.toLowerCase().includes(search.toLowerCase()) ||
    i.designationCopieur.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold text-gray-900">Interventions</h1>
        {canCreate && (
          <button className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Nouvelle intervention
          </button>
        )}
      </div>

      {/* Filtres */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            className="input pl-9"
            placeholder="Rechercher..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="relative">
          <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <select
            className="input pl-9 pr-8 appearance-none"
            value={statutFilter}
            onChange={e => { setStatutFilter(e.target.value as any); setPage(1); }}
          >
            <option value="">Tous les statuts</option>
            <option value="Ouverte">Ouvertes</option>
            <option value="EnCours">En cours</option>
            <option value="Resolue">Résolues</option>
            <option value="Fermee">Fermées</option>
          </select>
        </div>
      </div>

      {/* Compteurs statuts */}
      <div className="flex gap-2 flex-wrap">
        {(Object.keys(STATUT_CONFIG) as StatutIntervention[]).map(s => {
          const count = interventions.filter(i => i.statut === s).length;
          const cfg = STATUT_CONFIG[s];
          const Icon = cfg.icon;
          return (
            <button
              key={s}
              onClick={() => setStatutFilter(statutFilter === s ? '' : s)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                statutFilter === s ? cfg.color + ' border-current' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              <Icon size={12} />
              {cfg.label}
              {count > 0 && <span className="ml-0.5">({count})</span>}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="flex justify-center h-32 items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center text-gray-500 py-12">Aucune intervention trouvée.</div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">N° / Date</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Client / Copieur</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Technicien</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Nature</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Compteurs NB</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(i => {
                  const statut = STATUT_CONFIG[i.statut];
                  const Icon = statut.icon;
                  return (
                    <tr key={i.id} className="hover:bg-gray-50 transition-colors cursor-pointer">
                      <td className="px-4 py-3">
                        <p className="font-mono text-xs font-medium text-brand-600">{i.numeroIntervention}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {format(new Date(i.dateIntervention), 'dd MMM yyyy', { locale: fr })}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{i.nomClient}</p>
                        <p className="text-xs text-gray-500">{i.designationCopieur}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{i.nomTechnicien}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{NATURE_LABELS[i.nature] ?? i.nature}</td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-gray-700">
                          <span className="text-gray-400">Préc.</span> {i.compteurNBPrecedent.toLocaleString('fr-FR')}
                          <br />
                          <span className="text-gray-400">Act.</span> {i.compteurNBActuel.toLocaleString('fr-FR')}
                          {i.volumeNBConsomme > 0 && (
                            <span className="ml-1 text-brand-600 font-medium">(+{i.volumeNBConsomme.toLocaleString('fr-FR')})</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge ${statut.color} flex items-center gap-1 w-fit`}>
                          <Icon size={11} />
                          {statut.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-600">{filtered.length} résultat(s)</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary text-xs px-3 py-1"
              >
                Précédent
              </button>
              <span className="flex items-center text-sm text-gray-600 px-2">Page {page}</span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={interventions.length < 20}
                className="btn-secondary text-xs px-3 py-1"
              >
                Suivant
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
