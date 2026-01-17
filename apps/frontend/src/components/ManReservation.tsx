import { useEffect, useState } from "react";
import StarRating from "@/components/StarRating";
import Navbar from "@/components/Navbar";
import "@/index.css";
import medicalHero from "@/assets/medical-hero.jpg";
import { useAuth } from "@/contexts/AuthContext";
import { getDoctor, getProcedures, getReservations, type Reservation as ApiReservation } from "@/lib/api";

type CompletedReservation = {
  id: string;
  clinic: string;
  procedure: string;
  doctor: string;
  datetime: string;
  status?: string;
  rating?: number;
};

const RATINGS_STORAGE_KEY = "reservation_ratings";

const readRatings = (): Record<string, number> => {
  const stored = localStorage.getItem(RATINGS_STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed === "object") {
        return parsed as Record<string, number>;
      }
    } catch {
      return {};
    }
  }

  const legacy = localStorage.getItem("reservations");
  if (!legacy) {
    return {};
  }

  try {
    const parsed = JSON.parse(legacy);
    if (!Array.isArray(parsed)) {
      return {};
    }
    const migrated: Record<string, number> = {};
    parsed.forEach((item) => {
      if (!item || typeof item !== "object") return;
      const id = (item as { id?: string | number }).id;
      const rating = (item as { rating?: number }).rating;
      if ((typeof id === "string" || typeof id === "number") && typeof rating === "number") {
        migrated[id.toString()] = rating;
      }
    });
    localStorage.setItem(RATINGS_STORAGE_KEY, JSON.stringify(migrated));
    return migrated;
  } catch {
    return {};
  }
};

const writeRatings = (ratings: Record<string, number>) => {
  localStorage.setItem(RATINGS_STORAGE_KEY, JSON.stringify(ratings));
};

export default function ManReservations() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<CompletedReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCompletedReservations = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const [reservationsData, procedures] = await Promise.all([
          getReservations(user.id),
          getProcedures(),
        ]);

        const procedureMap = new Map(procedures.map((proc) => [proc.id, proc.name]));
        const now = new Date();
        const completedReservations = reservationsData
          .filter((res) => new Date(res.slotStart) < now && res.status === "confirmed")
          .sort((a, b) => new Date(b.slotStart).getTime() - new Date(a.slotStart).getTime());

        const doctorIds = Array.from(
          new Set(completedReservations.map((res) => res.doctorId).filter(Boolean))
        );
        const doctorPairs = await Promise.all(
          doctorIds.map(async (doctorId) => {
            try {
              const doctor = await getDoctor(doctorId);
              return [doctorId, doctor] as const;
            } catch (err) {
              console.error(`Failed to load doctor ${doctorId}:`, err);
              return [doctorId, null] as const;
            }
          })
        );
        const doctorMap = new Map(doctorPairs);
        const ratings = readRatings();

        const mapped: CompletedReservation[] = completedReservations.map((res: ApiReservation) => {
          const doctor = doctorMap.get(res.doctorId);
          const doctorName =
            doctor?.name ||
            `${doctor?.firstName ?? ""} ${doctor?.lastName ?? ""}`.trim() ||
            "Unknown Doctor";
          const procedureName =
            res.procedure?.name ||
            res.procedureName ||
            procedureMap.get(res.procedureId) ||
            res.note ||
            "Appointment";
          return {
            id: res.id,
            clinic: doctor?.department || "MediCare",
            procedure: procedureName,
            doctor: doctorName,
            datetime: res.slotStart,
            status: res.status,
            rating: ratings[res.id],
          };
        });

        setReservations(mapped);
      } catch (err: any) {
        console.error("Failed to load completed reservations:", err);
        setError(err?.message || "Failed to load completed reservations");
      } finally {
        setLoading(false);
      }
    };

    loadCompletedReservations();
  }, [user?.id]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return {
      date: d.toLocaleDateString("cs-CZ", { day: "2-digit", month: "2-digit", year: "numeric" }),
      time: d.toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" }),
    };
  };

  const handleRateChange = (id: string, rating: number) => {
    setReservations((prev) => prev.map((r) => (r.id === id ? { ...r, rating } : r)));
    const ratings = readRatings();
    ratings[id] = rating;
    writeRatings(ratings);
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <Navbar />

      {/* Background Image (stejné řešení jako v ostatních stránkách) */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat scale-105 transition-transform duration-700 ease-out"
        style={{ backgroundImage: `url(${medicalHero})` }}
      >
        {/* Multi-layer gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/90 to-background/85" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/10 via-transparent to-secondary/10" />
        <div className="absolute inset-0 backdrop-blur-[2px]" />
      </div>

      {/* Subtle pattern overlay */}
      <div
        className="fixed inset-0 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, hsl(var(--foreground)) 1px, transparent 0)`,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Animated gradient orbs for depth (kopie z ostatních stránek pro konzistenci) */}
      <div className="fixed top-20 right-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse opacity-50 pointer-events-none" />
      <div
        className="fixed bottom-20 left-20 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse opacity-50 pointer-events-none"
        style={{ animationDelay: "1s" }}
      />

      {/* Content (nad pozadím) */}
      <div className="container mx-auto px-4 py-8 pt-24 relative z-10">
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 1rem" }}>
          <div style={{ height: 24 }} />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <div>
              <h1 className="text-3xl font-bold" style={{ margin: 0 }}>
                Completed Reservations
              </h1>
              <p className="text-muted-foreground" style={{ marginTop: 8 }}>
                Review and rate your completed appointments.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="dashboard-card glass-dashboard card-hover" style={{ padding: "3rem 2rem", textAlign: "center" }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⏳</div>
              <h3 style={{ margin: 0 }} className="text-muted-foreground">
                Loading completed reservations...
              </h3>
            </div>
          ) : error ? (
            <div className="dashboard-card glass-dashboard card-hover" style={{ padding: "3rem 2rem", textAlign: "center" }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚠️</div>
              <h3 style={{ margin: 0 }} className="text-muted-foreground">
                {error}
              </h3>
            </div>
          ) : reservations.length === 0 ? (
            <div className="dashboard-card glass-dashboard card-hover" style={{ padding: "3rem 2rem", textAlign: "center" }}>
              <h3 style={{ margin: 0 }} className="text-muted-foreground">
                No Completed Reservations
              </h3>
              <p className="text-muted-foreground" style={{ marginTop: 12 }}>
                You do not have any completed reservations yet.
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
              {reservations.map((res) => {
                const d = formatDate(res.datetime);
                const displayId = res.id.slice(-6);
                return (
                  <div key={res.id} className="dashboard-card glass-dashboard card-hover" style={{ padding: 12, display: "flex", flexDirection: "column" }}>
                    <div style={{ paddingBottom: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{res.procedure}</h3>
                          <p style={{ margin: 0 }} className="text-muted-foreground">
                            {res.clinic}
                          </p>
                        </div>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "4px 8px",
                            borderRadius: 999,
                            background: "hsl(var(--primary) / 0.12)",
                            color: "LightSeaGreen",
                            fontWeight: 600,
                          }}
                        >
                          # {displayId}
                        </span>
                      </div>
                    </div>

                    <div style={{ paddingTop: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                        <div>
                          <div className="text-muted-foreground" style={{ fontSize: 13 }}>
                            👨‍⚕️ Doctor
                          </div>
                          <div style={{ fontWeight: 600 }}>{res.doctor}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div className="text-muted-foreground" style={{ fontSize: 13 }}>
                            📅 Date
                          </div>
                          <div style={{ fontWeight: 600 }}>{d.date}</div>
                          <div className="text-muted-foreground" style={{ fontSize: 13 }}>
                            {d.time}
                          </div>
                        </div>
                      </div>

                      <div style={{ marginTop: 8 }}>
                        <div className="text-muted-foreground" style={{ fontSize: 13, marginBottom: 6 }}>
                          ⭐ My Rating
                        </div>
                        <StarRating
                          maxRating={5}
                          defaultRating={res.rating || 0}
                          onRatingChange={(rating) => handleRateChange(res.id, rating)}
                          size="medium"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
