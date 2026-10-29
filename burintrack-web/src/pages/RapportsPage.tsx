import { useState } from 'react';
import {
  Download,
  FileSpreadsheet,
  FileText,
  BarChart2,
  Users,
  Printer,
  Wrench,
  Clock,
} from 'lucide-react';
import api from '../lib/api';
import { PageHeader, Spinner } from '../components/ui';
import { toast } from '../store/toastStore';

interface ReportDef {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  endpoint: string;
  formats: ('excel' | 'pdf')[];
}

const REPORTS: ReportDef[] = [
  {
    id: 'interventions',
    icon: <Wrench size={20} />,
    title: 'Rapport d\'interventions',
    description: 'Historique complet des interventions SAV sur une période donnée, avec détails technicien, client, copieur et compteurs.',
    endpoint: '/rapports/interventions',
    formats: ['excel', 'pdf'],
  },
  {
    id: 'clients',
    icon: <Users size={20} />,
    title: 'Liste des clients',
    description: 'Export de la liste complète des clients avec leurs informations de contact, adresse et nombre de copieurs.',
    endpoint: '/rapports/clients',
    formats: ['excel', 'pdf'],
  },
  {
    id: 'copieurs',
    icon: <Printer size={20} />,
    title: 'Parc copieurs',
    description: 'Inventaire complet du parc de copieurs avec état des contrats, dates d\'échéance et derniers compteurs relevés.',
    endpoint: '/rapports/copieurs',
    formats: ['excel', 'pdf'],
  },
  {
    id: 'compteurs',
    icon: <BarChart2 size={20} />,
    title: 'Relevés de compteurs',
    description: 'Synthèse des volumes NB et couleur consommés par copieur et par client sur la période sélectionnée.',
    endpoint: '/rapports/compteurs',
    formats: ['excel'],
  },
  {
    id: 'contrats',
    icon: <FileText size={20} />,
    title: 'Suivi des contrats',
    description: 'Tableau de bord des contrats : actifs, expirés, à renouveler dans les 30 et 90 jours à venir.',
    endpoint: '/rapports/contrats',
    formats: ['excel', 'pdf'],
  },
  {
    id: 'activite-techniciens',
    icon: <Clock size={20} />,
    title: 'Activité techniciens',
    description: 'Récapitulatif de l\'activité par technicien : nombre d\'interventions, temps moyen, taux de clôture.',
    endpoint: '/rapports/techniciens',
    formats: ['excel', 'pdf'],
  },
];

type LoadingKey = string; // `${reportId}-${format}`

export default function RapportsPage() {
  const [dateDebut, setDateDebut] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [dateFin, setDateFin] = useState(() => new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState<LoadingKey | null>(null);

  const handleExport = async (report: ReportDef, format: 'excel' | 'pdf') => {
    const key: LoadingKey = `${report.id}-${format}`;
    setLoading(key);
    try {
      const resp = await api.get(report.endpoint, {
        params: { dateDebut, dateFin, format },
        responseType: 'blob',
      });
      const ext = format === 'excel' ? 'xlsx' : 'pdf';
      const mime = format === 'excel'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'application/pdf';
      const url = URL.createObjectURL(new Blob([resp.data], { type: mime }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report.id}_${dateDebut}_${dateFin}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Export réussi', `Le rapport "${report.title}" a été téléchargé.`);
    } catch {
      toast.error('Échec de l\'export', 'Le rapport n\'est pas disponible pour le moment. Réessayez plus tard.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Rapports & Exports"
        subtitle="Générez et téléchargez des rapports Excel ou PDF"
      />

      {/* Period selector */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row align-items-end g-3">
            <div className="col-sm-auto">
              <label className="form-label">Période du</label>
              <input
                type="date"
                className="form-control"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
                style={{ maxWidth: 180 }}
              />
            </div>
            <div className="col-sm-auto">
              <label className="form-label">au</label>
              <input
                type="date"
                className="form-control"
                value={dateFin}
                min={dateDebut}
                onChange={(e) => setDateFin(e.target.value)}
                style={{ maxWidth: 180 }}
              />
            </div>
            <div className="col">
              <p className="mb-0 text-muted" style={{ fontSize: '0.82rem' }}>
                La période s'applique aux rapports d'interventions, de compteurs et d'activité techniciens.
                Les autres rapports exportent la totalité des données.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Report cards grid */}
      <div className="row g-3">
        {REPORTS.map((report) => {
          const isExcelLoading = loading === `${report.id}-excel`;
          const isPdfLoading   = loading === `${report.id}-pdf`;
          return (
            <div key={report.id} className="col-md-6 col-xl-4">
              <div className="card border-0 shadow-sm h-100 animate-slide-up">
                <div className="card-body d-flex flex-column">
                  <div className="d-flex align-items-start gap-3 mb-3">
                    <div
                      className="rounded-3 d-flex align-items-center justify-content-center text-white flex-shrink-0"
                      style={{ width: 44, height: 44, background: 'linear-gradient(135deg, #CC1416, #8b0000)' }}
                    >
                      {report.icon}
                    </div>
                    <div>
                      <div className="fw-bold" style={{ fontSize: '0.9rem', color: '#343a40' }}>{report.title}</div>
                      <div className="text-muted" style={{ fontSize: '0.78rem', marginTop: 2, lineHeight: 1.4 }}>
                        {report.description}
                      </div>
                    </div>
                  </div>
                  <div className="d-flex gap-2 mt-auto pt-3 border-top">
                    {report.formats.includes('excel') && (
                      <button
                        className="btn btn-sm d-flex align-items-center gap-2 flex-grow-1"
                        style={{ background: '#217346', color: '#fff', border: 'none' }}
                        onClick={() => handleExport(report, 'excel')}
                        disabled={!!loading}
                      >
                        {isExcelLoading ? <Spinner size={14} /> : <FileSpreadsheet size={14} />}
                        Excel
                      </button>
                    )}
                    {report.formats.includes('pdf') && (
                      <button
                        className="btn btn-sm d-flex align-items-center gap-2 flex-grow-1"
                        style={{ background: '#dc2626', color: '#fff', border: 'none' }}
                        onClick={() => handleExport(report, 'pdf')}
                        disabled={!!loading}
                      >
                        {isPdfLoading ? <Spinner size={14} /> : <Download size={14} />}
                        PDF
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
