import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Phone, Printer, User } from 'lucide-react';
import api from '../lib/api';
import type { Client } from '../types';
import { Badge, EmptyState, ErrorState, PageHeader, Skeleton } from '../components/ui';

delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl, iconShadow });

export default function CartePage() {
  const { data: clients = [], isLoading, isError, refetch } = useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: () => api.get('/clients').then((r) => r.data),
  });

  const avecCoords = clients.filter((c) => c.latitude != null && c.longitude != null);
  const sansCoords = clients.filter((c) => c.latitude == null || c.longitude == null);

  return (
    <div>
      <PageHeader
        title="Carte des clients"
        subtitle={
          <>
            <strong>{avecCoords.length}</strong> client{avecCoords.length > 1 ? 's' : ''} géolocalisé{avecCoords.length > 1 ? 's' : ''}
            {sansCoords.length > 0 && (
              <span className="ms-2 text-muted">· {sansCoords.length} sans coordonnées</span>
            )}
          </>
        }
      />

      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading ? (
        <Skeleton style={{ height: 600, borderRadius: '0.5rem' }} />
      ) : avecCoords.length === 0 ? (
        <EmptyState
          icon={<MapPin size={26} />}
          title="Aucun client géolocalisé"
          text="Ajoutez des coordonnées GPS aux fiches clients pour les afficher sur la carte."
        />
      ) : (
        <div className="card border-0 shadow-sm overflow-hidden animate-slide-up mb-4" style={{ padding: 0 }}>
          <MapContainer
            center={[5.3364, -4.0266]}
            zoom={12}
            style={{ height: 600, width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {avecCoords.map((c) => (
              <Marker key={c.id} position={[c.latitude!, c.longitude!]}>
                <Popup>
                  <div style={{ minWidth: 180, fontSize: '0.85rem' }}>
                    <p className="fw-bold mb-1" style={{ color: '#343a40' }}>{c.nomClient}</p>
                    <p className="d-flex align-items-center gap-1 mb-1 text-muted">
                      <MapPin size={12} style={{ flexShrink: 0 }} /> {c.adresse}, {c.ville}
                    </p>
                    <p className="d-flex align-items-center gap-1 mb-1 text-muted">
                      <User size={12} style={{ flexShrink: 0 }} /> {c.nomContact}
                    </p>
                    <p className="d-flex align-items-center gap-1 mb-1 text-muted">
                      <Phone size={12} style={{ flexShrink: 0 }} />{' '}
                      <a href={`tel:${c.telephone}`} className="text-primary">{c.telephone}</a>
                    </p>
                    <p className="d-flex align-items-center gap-1 mb-0 text-muted">
                      <Printer size={12} style={{ flexShrink: 0 }} /> {c.nombreCopieurs} copieur{c.nombreCopieurs > 1 ? 's' : ''}
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}

      {sansCoords.length > 0 && (
        <div className="animate-slide-up">
          <h6 className="mb-3 fw-semibold text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.06em', color: '#6c757d' }}>
            Clients sans géolocalisation ({sansCoords.length})
          </h6>
          <div className="card border-0 shadow-sm overflow-hidden" style={{ padding: 0 }}>
            {sansCoords.map((c, idx) => (
              <div
                key={c.id}
                className="d-flex align-items-center gap-3 px-4 py-3"
                style={{ borderTop: idx > 0 ? '1px solid #f0f0f0' : 'none' }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p className="mb-0 fw-semibold text-truncate" style={{ color: '#343a40', fontSize: '0.875rem' }}>{c.nomClient}</p>
                  <p className="mb-0 text-truncate text-muted" style={{ fontSize: '0.78rem' }}>{c.adresse}, {c.ville}</p>
                </div>
                <Badge tone="slate">
                  <MapPin size={11} className="me-1" style={{ display: 'inline' }} /> Sans GPS
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
