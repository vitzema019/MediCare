import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import StarRating from "./StarRating";
import Navbar from "@/components/Navbar";

type ReservationStatus = 
  | "potvrzeno" 
  | "čeká na schválení změny" 
  | "čeká na schválení zrušení"
  | "změna zamítnuta"
  | "zrušení zamítnuto"
  | "dokončeno" 
  | "zrušeno"
  | "změněno";

type PendingAction = {
  id: string;
  reservationId: number;
  type: 'change' | 'cancel';
  requestedAt: string;
  requestedBy: string;
  originalDateTime?:  string;
  newDateTime?: string;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
}

type Reservation = {
  id: number;
  clinic: string;
  procedure: string;
  doctor: string;
  datetime: string;
  originalDateTime?:  string; // Pro sledování původního termínu
  status: ReservationStatus;
  rating?:  number;
  pendingAction?: PendingAction;
  lastModified?: string;
  modificationHistory?: Array<{
    date: string;
    action: string;
    by: 'patient' | 'doctor';
    details: string;
  }>;
};

const defaultReservations: Reservation[] = [
  {
    id: 1,
    clinic: "Klinika Slunce",
    procedure: "Preventivní prohlídka",
    doctor: "MUDr. Jan Novák",
    datetime:  "2025-12-11T10:30",
    status: "dokončeno",
    rating: 0,
    modificationHistory: []
  },
  {
    id: 2,
    clinic: "Zdraví centrum",
    procedure: "Očkování proti chřipce", 
    doctor: "MUDr. Eva Sedláčková",
    datetime: "2025-12-15T14:00",
    status: "potvrzeno",
    modificationHistory: []
  },
  {
    id: 3,
    clinic: "MediCenter Plus",
    procedure: "Kontrolní vyšetření",
    doctor:  "MUDr. Pavel Svoboda", 
    datetime: "2025-11-20T09:15",
    status: "dokončeno",
    rating: 4,
    modificationHistory: []
  },
  {
    id: 4,
    clinic: "Zdraví centrum",
    procedure: "Dermatologické vyšetření",
    doctor: "MUDr.  Petra Krásná",
    datetime: "2025-12-20T11:00",
    originalDateTime: "2025-12-18T09:30",
    status: "čeká na schválení změny",
    pendingAction: {
      id:  "PA001",
      reservationId: 4,
      type: 'change',
      requestedAt: "2025-12-14T10:30: 00Z",
      requestedBy: "Pacient Karel Novák",
      originalDateTime: "2025-12-18T09:30",
      newDateTime: "2025-12-20T11:00",
      reason: "Časový konflikt s prací",
      status: 'pending'
    },
    modificationHistory: [
      {
        date: "2025-12-14T10:30:00Z",
        action: "Žádost o změnu termínu",
        by: 'patient',
        details: "Z 18.12. 9:30 na 20.12. 11:00"
      }
    ]
  },
  {
    id: 5,
    clinic: "Downtown Clinic",
    procedure: "Oční vyšetření",
    doctor:  "MUDr.  Tomáš Světlý",
    datetime: "2025-12-25T14:30",
    status: "čeká na schválení zrušení",
    pendingAction: {
      id:  "PA002", 
      reservationId: 5,
      type: 'cancel',
      requestedAt:  "2025-12-14T15:45:00Z",
      requestedBy: "Pacient Marie Svobodná",
      reason: "Zdravotní důvody",
      status: 'pending'
    },
    modificationHistory: [
      {
        date: "2025-12-14T15:45:00Z",
        action: "Žádost o zrušení",
        by: 'patient',
        details: "Důvod: Zdravotní důvody"
      }
    ]
  }
];

export default function ManReservations() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [message, setMessage] = useState<string>('');
  const [showChangeModal, setShowChangeModal] = useState<number | null>(null);
  const [showCancelModal, setShowCancelModal] = useState<number | null>(null);
  const [changeReason, setChangeReason] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const savedReservations = JSON.parse(localStorage.getItem('reservations') || '[]');
    const allReservations = [...defaultReservations, ...savedReservations];
    setReservations(allReservations);

    if (location.state?.message) {
      setMessage(location.state.message);
      setTimeout(() => setMessage(''), 5000);
    }
  }, [location. state]);

  const handleRatingChange = (reservationId: number, rating: number) => {
    setReservations(prev => 
      prev.map(res => 
        res.id === reservationId 
          ? { ...res, rating } 
          : res
      )
    );
  };

  // Žádost o změnu termínu
  const handleRequestChange = (id: number) => {
    if (!changeReason. trim()) {
      alert('⚠️ Prosím zadejte důvod změny termínu.');
      return;
    }

    const reservation = reservations.find(r => r.id === id);
    if (!reservation) return;

    const pendingAction:  PendingAction = {
      id: `PA${Date.now()}`,
      reservationId: id,
      type:  'change',
      requestedAt: new Date().toISOString(),
      requestedBy:  "Pacient", // V reálné aplikaci by se vzalo z user context
      originalDateTime: reservation.datetime,
      reason: changeReason,
      status: 'pending'
    };

    setReservations(prev => 
      prev.map(res => 
        res.id === id 
          ? { 
              ...res, 
              status: "čeká na schválení změny" as ReservationStatus,
              pendingAction,
              modificationHistory: [
                ...(res.modificationHistory || []),
                {
                  date: new Date().toISOString(),
                  action: "Žádost o změnu termínu",
                  by: 'patient',
                  details:  `Důvod: ${changeReason}`
                }
              ]
            }
          : res
      )
    );

    setMessage(`📤 Žádost o změnu termínu byla odeslána lékaři ${reservation.doctor} ke schválení. `);
    setShowChangeModal(null);
    setChangeReason('');
  };

  // Žádost o zrušení
  const handleRequestCancel = (id: number) => {
    if (!cancelReason.trim()) {
      alert('⚠️ Prosím zadejte důvod zrušení rezervace.');
      return;
    }

    const reservation = reservations.find(r => r.id === id);
    if (!reservation) return;

    const pendingAction: PendingAction = {
      id: `PA${Date.now()}`,
      reservationId: id,
      type:  'cancel',
      requestedAt: new Date().toISOString(),
      requestedBy:  "Pacient",
      reason: cancelReason,
      status: 'pending'
    };

    setReservations(prev => 
      prev.map(res => 
        res.id === id 
          ? { 
              ...res, 
              status: "čeká na schválení zrušení" as ReservationStatus,
              pendingAction,
              modificationHistory: [
                ...(res.modificationHistory || []),
                {
                  date: new Date().toISOString(),
                  action: "Žádost o zrušení",
                  by: 'patient',
                  details: `Důvod: ${cancelReason}`
                }
              ]
            }
          : res
      )
    );

    setMessage(`📤 Žádost o zrušení rezervace byla odeslána lékaři ${reservation.doctor} ke schválení.`);
    setShowCancelModal(null);
    setCancelReason('');
  };

  const getStatusInfo = (status: ReservationStatus) => {
    switch (status) {
      case "potvrzeno":
        return { class: "medicare-badge-success", icon: "✅", text: "Potvrzeno", color: "text-green-700" };
      case "čeká na schválení změny":
        return { class:  "medicare-badge-warning", icon: "🕐", text: "Čeká na schválení změny", color: "text-yellow-700" };
      case "čeká na schválení zrušení":
        return { class: "medicare-badge-warning", icon: "🕐", text: "Čeká na schválení zrušení", color: "text-yellow-700" };
      case "změna zamítnuta":
        return { class: "medicare-badge-error", icon: "❌", text: "Změna zamítnuta", color: "text-red-700" };
      case "zrušení zamítnuto":
        return { class: "medicare-badge-error", icon: "❌", text: "Zrušení zamítnuto", color: "text-red-700" };
      case "dokončeno": 
        return { class: "medicare-badge-primary", icon: "✅", text: "Dokončeno", color: "text-blue-700" };
      case "zrušeno":
        return { class: "medicare-badge-error", icon: "🚫", text: "Zrušeno", color: "text-red-700" };
      case "změněno":
        return { class: "medicare-badge-success", icon: "🔄", text: "Změněno", color: "text-green-700" };
      default: 
        return { class: "medicare-badge-primary", icon: "ℹ️", text: status, color: "text-blue-700" };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString("cs-CZ", {
        day: "2-digit",
        month: "2-digit", 
        year: "numeric"
      }),
      time: date.toLocaleTimeString("cs-CZ", {
        hour: "2-digit",
        minute: "2-digit"
      }),
      weekday: date.toLocaleDateString("cs-CZ", {
        weekday: 'long'
      })
    };
  };

  const activeReservations = reservations.filter(res => 
    ! ['zrušeno', 'dokončeno'].includes(res.status)
  );
  const completedReservations = reservations. filter(res => res.status === 'dokončeno');
  const cancelledReservations = reservations.filter(res => res.status === 'zrušeno');

  return (
  
    <div className="medicare-bg-gray-50" style={{ minHeight: 'calc(100vh - 200px)', padding: '2rem 0' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
        <Navbar />
        <br />
        <br />
        {/* Header */}
        <div className="medicare-flex medicare-justify-between medicare-items-center medicare-mb-8">
          <div>
            <h1 className="medicare-h1 medicare-text-primary medicare-m-0">
              Moje rezervace
            </h1>
            <p className="medicare-text-gray-600" style={{ marginTop: '0.5rem' }}>
              Přehled všech vašich zdravotních rezervací a jejich stavu
            </p>
          </div>
          <button
            className="medicare-btn medicare-btn-primary medicare-btn-lg"
            onClick={() => navigate("/rezervovat")}
          >
            ➕ Nová rezervace
          </button>
        </div>

        {/* Message */}
        {message && (
          <div className="medicare-alert medicare-alert-success medicare-mb-6">
            {message}
          </div>
        )}

        {/* Statistics */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns:  'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '1.5rem',
          marginBottom:  '3rem'
        }}>
          <div className="medicare-card medicare-text-center">
            <div className="medicare-card-body">
              <div style={{ fontSize: '3rem', marginBottom:  '1rem' }}>📅</div>
              <div className="medicare-text-3xl medicare-font-bold medicare-text-primary">
                {activeReservations.length}
              </div>
              <div className="medicare-text-gray-600">Aktivní rezervace</div>
            </div>
          </div>
          
          <div className="medicare-card medicare-text-center">
            <div className="medicare-card-body">
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🕐</div>
              <div className="medicare-text-3xl medicare-font-bold medicare-text-warning">
                {activeReservations.filter(r => r.status. includes('čeká na schválení')).length}
              </div>
              <div className="medicare-text-gray-600">Čeká na schválení</div>
            </div>
          </div>

          <div className="medicare-card medicare-text-center">
            <div className="medicare-card-body">
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
              <div className="medicare-text-3xl medicare-font-bold medicare-text-success">
                {completedReservations.length}
              </div>
              <div className="medicare-text-gray-600">Dokončené</div>
            </div>
          </div>
        </div>

        {/* Active Reservations */}
        {activeReservations.length > 0 && (
          <div className="medicare-mb-8">
            <h2 className="medicare-h2 medicare-text-gray-800 medicare-mb-6">
             Aktivní rezervace
            </h2>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns:  'repeat(auto-fit, minmax(400px, 1fr))', 
              gap: '2rem'
            }}>
              {activeReservations.map((res) => {
                const statusInfo = getStatusInfo(res.status);
                const dateInfo = formatDate(res.datetime);
                const isPending = res.status. includes('čeká na schválení');
                const isRejected = res.status.includes('zamítnuta') || res.status.includes('zamítnuto');
                
                return (
                  <div key={res.id} className="medicare-card medicare-transition">
                    <div className="medicare-card-header">
                      <div className="medicare-flex medicare-justify-between medicare-items-start">
                        <div>
                          <h3 className="medicare-card-title">{res.procedure}</h3>
                          <p className="medicare-text-gray-600 medicare-m-0" style={{ fontSize: '0.875rem' }}>
                            📍 {res.clinic}
                          </p>
                        </div>
                        <span className={`medicare-badge ${statusInfo.class}`}>
                          {statusInfo.icon} {statusInfo.text}
                        </span>
                      </div>
                    </div>

                    <div className="medicare-card-body">
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                        <div>
                          <div className="medicare-text-gray-500" style={{ fontSize: '0.875rem' }}>👨‍⚕️ Lékař</div>
                          <div className="medicare-font-semibold">{res.doctor}</div>
                        </div>
                        <div>
                          <div className="medicare-text-gray-500" style={{ fontSize: '0.875rem' }}>📅 Termín</div>
                          <div className="medicare-font-semibold">{dateInfo. date}</div>
                          <div className="medicare-text-gray-600" style={{ fontSize: '0.875rem' }}>{dateInfo.weekday}, {dateInfo.time}</div>
                        </div>
                      </div>

                      {/* Pending Action Info */}
                      {isPending && res.pendingAction && (
                        <div className="medicare-bg-warning-50 medicare-rounded-xl medicare-p-4 medicare-mb-4" style={{
                          border: '1px solid #fbbf24',
                          backgroundColor: '#fef3c7'
                        }}>
                          <h4 className="medicare-font-semibold medicare-text-warning medicare-mb-2">
                            🕐 {res.pendingAction.type === 'change' ? 'Čeká na schválení změny' : 'Čeká na schválení zrušení'}
                          </h4>
                          <div style={{ fontSize: '0.875rem', color: '#92400e' }}>
                            <div><strong>Požadováno:</strong> {new Date(res.pendingAction. requestedAt).toLocaleString('cs-CZ')}</div>
                            {res.pendingAction.reason && <div><strong>Důvod:</strong> {res.pendingAction.reason}</div>}
                            {res.pendingAction.newDateTime && (
                              <div><strong>Nový termín:</strong> {formatDate(res.pendingAction. newDateTime).date} {formatDate(res. pendingAction.newDateTime).time}</div>
                            )}
                          </div>
                          <div className="medicare-text-warning" style={{ fontSize: '0.875rem', marginTop: '0.5rem', fontStyle: 'italic' }}>
                            💬 Lékař bude kontaktovat s potvrzením do 24 hodin. 
                          </div>
                        </div>
                      )}

                      {/* Rejected Action Info */}
                      {isRejected && (
                        <div className="medicare-bg-error-50 medicare-rounded-xl medicare-p-4 medicare-mb-4" style={{
                          border: '1px solid #ef4444',
                          backgroundColor: '#fee2e2'
                        }}>
                          <h4 className="medicare-font-semibold medicare-text-error medicare-mb-2">
                            ❌ Žádost byla zamítnuta
                          </h4>
                          <div style={{ fontSize: '0.875rem', color: '#dc2626' }}>
                            Lékař zamítl vaši žádost.  Kontaktujte prosím ordinaci pro další informace.
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      {res.status === "potvrzeno" && (
                        <div className="medicare-flex" style={{ gap: '1rem' }}>
                          <button
                            className="medicare-btn medicare-btn-secondary medicare-flex-1"
                            onClick={() => setShowChangeModal(res. id)}
                          >
                            🔄 Změnit termín
                          </button>
                          <button
                            className="medicare-btn medicare-btn-danger medicare-flex-1"
                            onClick={() => setShowCancelModal(res.id)}
                          >
                            ❌ Zrušit rezervaci
                          </button>
                        </div>
                      )}

                      {(isRejected) && (
                        <div className="medicare-flex" style={{ gap: '1rem' }}>
                          <button
                            className="medicare-btn medicare-btn-primary medicare-flex-1"
                            onClick={() => {/* Kontakt na ordinaci */}}
                          >
                            📞 Kontaktovat ordinaci
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Completed Reservations */}
        {completedReservations.length > 0 && (
          <div className="medicare-mb-8">
            <h2 className="medicare-h2 medicare-text-gray-600 medicare-mb-6">
              ✅ Dokončené návštěvy
            </h2>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns:  'repeat(auto-fit, minmax(350px, 1fr))', 
              gap:  '1.5rem'
            }}>
              {completedReservations.map((res) => {
                const dateInfo = formatDate(res.datetime);
                
                return (
                  <div key={res.id} className="medicare-card">
                    <div className="medicare-card-body">
                      <div className="medicare-flex medicare-justify-between medicare-items-start medicare-mb-4">
                        <div>
                          <h4 className="medicare-font-semibold medicare-text-lg medicare-m-0">{res.procedure}</h4>
                          <p className="medicare-text-gray-600 medicare-m-0" style={{ fontSize: '0.875rem' }}>
                            {dateInfo.date} • {dateInfo.time}
                          </p>
                        </div>
                        <span className="medicare-badge medicare-badge-success">
                          ✅ Dokončeno
                        </span>
                      </div>
                      
                      {/* Star Rating */}
                      <div className="medicare-bg-gray-50 medicare-rounded-xl medicare-p-4">
                        <h5 className="medicare-font-semibold medicare-mb-3" style={{ fontSize: '0.875rem' }}>
                          ⭐ Hodnocení návštěvy: 
                        </h5>
                        <StarRating
                          maxRating={5}
                          defaultRating={res.rating || 0}
                          onRatingChange={(rating) => handleRatingChange(res.id, rating)}
                          size="medium"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {reservations.length === 0 && (
          <div className="medicare-card medicare-text-center" style={{ padding: '4rem 2rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '2rem' }}>📅</div>
            <h3 className="medicare-h3 medicare-text-gray-600">Žádné rezervace</h3>
            <p className="medicare-text-gray-500 medicare-mb-6">
              Zatím nemáte žádné rezervace.  Vytvořte si první rezervaci. 
            </p>
            <button
              className="medicare-btn medicare-btn-primary medicare-btn-lg"
              onClick={() => navigate("/rezervovat")}
            >
              📅 Vytvořit první rezervaci
            </button>
          </div>
        )}

        {/* Change Modal */}
        {showChangeModal && (
          <div className="medicare-modal-overlay" onClick={() => setShowChangeModal(null)}>
            <div className="medicare-card" style={{ maxWidth: '500px', width: '90%' }} onClick={e => e.stopPropagation()}>
              <div className="medicare-card-header">
                <h3 className="medicare-card-title">🔄 Žádost o změnu termínu</h3>
              </div>
              <div className="medicare-card-body">
                <p className="medicare-text-gray-600 medicare-mb-4">
                  Žádost o změnu termínu bude odeslána vašemu lékaři ke schválení.
                </p>
                <div className="medicare-form-group">
                  <label className="medicare-label">
                    Důvod změny termínu *
                  </label>
                  <textarea
                    value={changeReason}
                    onChange={(e) => setChangeReason(e.target.value)}
                    className="medicare-input"
                    rows={3}
                    placeholder="Uveďte prosím důvod pro změnu termínu..."
                    style={{ resize: 'vertical', minHeight: '80px' }}
                  />
                </div>
                <div className="medicare-bg-blue-50 medicare-rounded-xl medicare-p-4 medicare-mb-6" style={{
                  backgroundColor: '#eff6ff',
                  border: '1px solid #dbeafe'
                }}>
                  <div className="medicare-text-blue-800" style={{ fontSize: '0.875rem' }}>
                    <div className="medicare-font-semibold medicare-mb-2">ℹ️ Proces schvalování:</div>
                    <ul style={{ marginLeft: '1rem', lineHeight: '1.6' }}>
                      <li>Žádost bude odeslána lékaři</li>
                      <li>Lékař posoudí možnost změny</li>
                      <li>Budete kontaktováni do 24 hodin</li>
                      <li>Po schválení můžete vybrat nový termín</li>
                    </ul>
                  </div>
                </div>
                <div className="medicare-flex" style={{ gap: '1rem' }}>
                  <button
                    className="medicare-btn medicare-btn-secondary medicare-flex-1"
                    onClick={() => setShowChangeModal(null)}
                  >
                    Zrušit
                  </button>
                  <button
                    className="medicare-btn medicare-btn-primary medicare-flex-1"
                    onClick={() => handleRequestChange(showChangeModal)}
                    disabled={!changeReason.trim()}
                  >
                    📤 Odeslat žádost
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cancel Modal */}
        {showCancelModal && (
          <div className="medicare-modal-overlay" onClick={() => setShowCancelModal(null)}>
            <div className="medicare-card" style={{ maxWidth: '500px', width: '90%' }} onClick={e => e. stopPropagation()}>
              <div className="medicare-card-header">
                <h3 className="medicare-card-title">❌ Žádost o zrušení rezervace</h3>
              </div>
              <div className="medicare-card-body">
                <p className="medicare-text-gray-600 medicare-mb-4">
                  Žádost o zrušení rezervace bude odeslána vašemu lékaři ke schválení. 
                </p>
                <div className="medicare-form-group">
                  <label className="medicare-label">
                    Důvod zrušení *
                  </label>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="medicare-input"
                    rows={3}
                    placeholder="Uveďte prosím důvod pro zrušení rezervace..."
                    style={{ resize: 'vertical', minHeight:  '80px' }}
                  />
                </div>
                <div className="medicare-bg-yellow-50 medicare-rounded-xl medicare-p-4 medicare-mb-6" style={{
                  backgroundColor: '#fefce8',
                  border:  '1px solid #fde047'
                }}>
                  <div className="medicare-text-yellow-800" style={{ fontSize:  '0.875rem' }}>
                    <div className="medicare-font-semibold medicare-mb-2">⚠️ Upozornění:</div>
                    <div>Některé ordinace mohou při krátkodobém zrušení účtovat storno poplatek.  Doporučujeme zrušit rezervaci alespoň 24 hodin předem.</div>
                  </div>
                </div>
                <div className="medicare-flex" style={{ gap: '1rem' }}>
                  <button
                    className="medicare-btn medicare-btn-secondary medicare-flex-1"
                    onClick={() => setShowCancelModal(null)}
                  >
                    Zrušit
                  </button>
                  <button
                    className="medicare-btn medicare-btn-danger medicare-flex-1"
                    onClick={() => handleRequestCancel(showCancelModal)}
                    disabled={!cancelReason. trim()}
                  >
                    📤 Odeslat žádost
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Overlay Styles */}
      <style>{`
        .medicare-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
          backdrop-filter: blur(4px);
        }
      `}</style>
    </div>
  );
}