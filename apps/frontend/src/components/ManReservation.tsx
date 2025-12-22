import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import StarRating from "@/components/StarRating";
import Navbar from "@/components/Navbar";
import "@/index.css"; 
import medicalHero from "@/assets/medical-hero.jpg";

type Reservation = {
  id: number;
  clinic: string;
  procedure: string;
  doctor: string;
  datetime: string;
  status?: string;
  rating?: number;
};

const defaultReservations: Reservation[] = [
  {
    id: 1,
    clinic: "Klinika Slunce",
    procedure: "Preventivní prohlídka",
    doctor: "MUDr. Jan Novák",
    datetime: "2025-12-11T10:30",
    status: "dokončeno",
    rating: 5,
  },
  {
    id: 2,
    clinic: "Klinika Slunce",
    procedure: "Oční vyšetření",
    doctor: "MUDr. Jan Novák",
    datetime: "2025-12-11T10:30",
    status: "dokončeno",
    rating: 2,
  },
  {
    id: 3,
    clinic: "MediCenter Plus",
    procedure: "Kontrolní vyšetření",
    doctor: "MUDr. Pavel Svoboda",
    datetime: "2025-11-20T09:15",
    status: "dokončeno",
    rating: 4,
  },
];

export default function ManReservations() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const saved: Reservation[] = JSON.parse(localStorage.getItem("reservations") || "[]");
    const map = new Map<number, Reservation>();
    defaultReservations.forEach((r) => map.set(r.id, r));
    saved.forEach((r) => map.set(r.id, r));
    const all = Array.from(map.values()).sort((a, b) => b.id - a.id);
    setReservations(all);
  }, []);

  const ratedReservations = reservations.filter((r) => typeof r.rating === "number" && r.rating! > 0);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return {
      date: d.toLocaleDateString("cs-CZ", { day: "2-digit", month: "2-digit", year: "numeric" }),
      time: d.toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" }),
    };
  };

  const handleRateChange = (id: number, rating: number) => {
    setReservations((prev) => {
      const next = prev.map((r) => (r.id === id ? { ...r, rating } : r));
      localStorage.setItem("reservations", JSON.stringify(next));
      return next;
    });
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
                ⭐ My Rated Reservations
              </h1>
              <p className="text-muted-foreground" style={{ marginTop: 8 }}>
                Display of your reservations that you have rated.
              </p>
            </div>
          </div>

          {ratedReservations.length === 0 ? (
            <div className="dashboard-card glass-dashboard card-hover" style={{ padding: "3rem 2rem", textAlign: "center" }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⭐</div>
              <h3 style={{ margin: 0 }} className="text-muted-foreground">
                No Rated Reservations
              </h3>
              <p className="text-muted-foreground" style={{ marginTop: 12 }}>
                You have not rated any reservations yet. Please go to the reservations page to rate your completed appointments.
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
              {ratedReservations.map((res) => {
                const d = formatDate(res.datetime);
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
                          # {res.id}
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