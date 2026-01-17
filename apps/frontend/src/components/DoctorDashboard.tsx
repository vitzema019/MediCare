import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, ChevronRight, LogOut, Calendar as CalendarIcon, Clock, User, X, MessageSquare, Check, XCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Appointment } from "./AppointmentDialog";
import Navbar from "./Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PatientRecords } from "./PatientRecords";
import { MessagingSystem } from "./MessagingSystem";
import { AvailableHoursConfig } from "./AvailableHoursConfig";
import { PatientCards } from "./PatientCards";
import { getDoctorReservations, confirmReservation, acceptCancellation, declineCancellation, acceptReschedule, declineReschedule, acceptUpdate, declineUpdate, type Reservation } from "@/lib/api";
import medicalHero from "@/assets/medical-hero.jpg";

interface DoctorDashboardProps {
  onLogout: () => void;
  doctorId: string;
}

const DoctorDashboard = ({ onLogout, doctorId }: DoctorDashboardProps) => {
  const { toast } = useToast();
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loadingReservations, setLoadingReservations] = useState(true);
  const [isDayDetailsOpen, setIsDayDetailsOpen] = useState(false);
  const [messagingOpen, setMessagingOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "cards" | "records" | "requests" | "schedule">("overview");
  const [cardsRefreshKey, setCardsRefreshKey] = useState(0);
  const [recordsRefreshKey, setRecordsRefreshKey] = useState(0);
  const today = new Date();
  const uniquePatientsCount = new Set(
    reservations.map((res) => res.patientId).filter(Boolean)
  ).size;

  // Load reservations on mount
  useEffect(() => {
    loadReservations();
  }, [doctorId]);

  useEffect(() => {
    if (isDayDetailsOpen) {
      loadReservations();
    }
  }, [isDayDetailsOpen]);

  const loadReservations = async () => {
    setLoadingReservations(true);
    try {
      const data = await getDoctorReservations(doctorId);
      console.log("[DoctorDashboard] Loaded reservations:", data.length);
      console.log("[DoctorDashboard] Cancellation requests:", data.filter(r => r.status === "cancellation_requested").length);
      console.log("[DoctorDashboard] Reschedule requests:", data.filter(r => r.status === "reschedule_requested").length);
      console.log("[DoctorDashboard] Update requests:", data.filter(r => r.status === "update_requested").length);
      console.log("[DoctorDashboard] All statuses:", data.map(r => ({ id: r.id, status: r.status })));
      setReservations(data);
    } catch (error: any) {
      console.error("Failed to load reservations:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load reservations",
        variant: "destructive",
      });
    } finally {
      setLoadingReservations(false);
    }
  };

  const pendingReservations = reservations.filter(r => r.status === "pending" || r.status === "cancellation_requested" || r.status === "reschedule_requested" || r.status === "update_requested");
  const confirmedReservations = reservations.filter(r => r.status === "confirmed");

  const handleConfirmClick = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setConfirmMessage("");
    setConfirmDialogOpen(true);
  };

  const handleConfirmReservation = async (status: 'confirmed' | 'cancelled') => {
    if (!selectedReservation) return;

    setProcessing(true);
    try {
      await confirmReservation(selectedReservation.id, status, confirmMessage || undefined, doctorId);
      toast({
        title: "Success",
        description: `Appointment ${status === 'confirmed' ? 'confirmed' : 'declined'} successfully`,
      });
      setConfirmDialogOpen(false);
      setSelectedReservation(null);
      setConfirmMessage("");
      loadReservations(); // Reload to refresh the list
    } catch (error: any) {
      console.error("Failed to confirm reservation:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update reservation",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  // Generate calendar days for current month
  const getDaysInMonth = () => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(currentYear, currentMonth, day));
    }
    
    return days;
  };

  const days = getDaysInMonth();
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  const isToday = (date: Date | null) => {
    if (!date) return false;
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date | null) => {
    if (!date || !selectedDate) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  const isPastDate = (date: Date | null) => {
    if (!date) return false;
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return dateOnly < todayOnly;
  };

  const getAppointmentsForDate = (date: Date | null) => {
    if (!date) return [];
    return reservations.filter(res => {
      const resDate = new Date(res.slotStart);
      return resDate.toDateString() === date.toDateString();
    });
  };

  const getReservationStatusLabel = (status: Reservation["status"]) => {
    switch (status) {
      case "confirmed":
        return "Confirmed";
      case "cancelled":
        return "Cancelled";
      case "cancellation_requested":
        return "Cancellation requested";
      case "reschedule_requested":
        return "Reschedule requested";
      case "update_requested":
        return "Update requested";
      default:
        return "Pending";
    }
  };

  const getReservationStatusStyles = (status: Reservation["status"]) => {
    if (status === "confirmed") {
      return {
        chip: "bg-emerald-600/90 text-white hover:bg-emerald-600",
        badge: "border-emerald-200 text-emerald-700 bg-emerald-50",
      };
    }
    if (status === "cancelled") {
      return {
        chip: "bg-rose-500/90 text-white hover:bg-rose-500 line-through opacity-80",
        badge: "border-rose-200 text-rose-700 bg-rose-50",
      };
    }
    return {
      chip: "bg-amber-500/90 text-white hover:bg-amber-500",
      badge: "border-amber-200 text-amber-700 bg-amber-50",
    };
  };

  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };


  const handleCancelAppointment = async (reservationId: string) => {
    try {
      await confirmReservation(reservationId, "cancelled");
      await loadReservations();
      toast({
        title: "Appointment cancelled",
        description: "The appointment has been cancelled.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel appointment",
        variant: "destructive",
      });
    }
  };

  const handleMessagePatient = (patientName: string) => {
    setMessagingOpen(true);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value as typeof activeTab);
    if (value === "overview" || value === "requests") {
      loadReservations();
    }
    if (value === "cards") {
      setCardsRefreshKey((prev) => prev + 1);
    }
    if (value === "records") {
      setRecordsRefreshKey((prev) => prev + 1);
    }
  };


  const handleDayClick = (date: Date | null) => {
    if (!date) return;
    setSelectedDate(date);
    setIsDayDetailsOpen(true);
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Enhanced Background Image with Parallax Effect */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105 transition-transform duration-700 ease-out"
        style={{ backgroundImage: `url(${medicalHero})` }}
      >
        {/* Multi-layer gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/90 to-background/85" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/10 via-transparent to-secondary/10" />
        <div className="absolute inset-0 backdrop-blur-[2px]" />
      </div>

      {/* Subtle pattern overlay for consistency */}
      <div className="absolute inset-0 opacity-[0.015] pointer-events-none" style={{
        backgroundImage: `radial-gradient(circle at 2px 2px, hsl(var(--foreground)) 1px, transparent 0)`,
        backgroundSize: '40px 40px'
      }} />

      {/* Animated gradient orbs for depth */}
      <div className="absolute top-20 right-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse opacity-50" />
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse opacity-50" style={{ animationDelay: "1s" }} />
      
      <Navbar />
      <div className="container mx-auto px-4 py-8 pt-24 relative z-10">
        <div className="flex justify-between items-center mb-8 animate-fade-in-down">
          <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl font-bold text-shimmer">Doctor Dashboard</h1>
            <p className="text-muted-foreground mt-1 text-lg">Manage your patient appointments</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setMessagingOpen(true)} variant="outline" size="sm">
              <MessageSquare className="w-4 h-4 mr-2" />
              Messages
            </Button>
            <Button onClick={onLogout} variant="outline" size="sm">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6 bg-muted/50 border border-border/60">
            <TabsTrigger value="overview" className="data-[state=active]:bg-card data-[state=active]:border-b-2 data-[state=active]:border-primary">Overview</TabsTrigger>
            <TabsTrigger value="cards" className="data-[state=active]:bg-card data-[state=active]:border-b-2 data-[state=active]:border-primary">Patient Cards</TabsTrigger>
            <TabsTrigger value="records" className="data-[state=active]:bg-card data-[state=active]:border-b-2 data-[state=active]:border-primary">Patient Records</TabsTrigger>
            <TabsTrigger value="requests" className="data-[state=active]:bg-card data-[state=active]:border-b-2 data-[state=active]:border-primary">
              Pending Requests
              {pendingReservations.length > 0 && (
                <Badge className="ml-2" variant="destructive">{pendingReservations.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="schedule" className="data-[state=active]:bg-card data-[state=active]:border-b-2 data-[state=active]:border-primary">Available Hours</TabsTrigger>
          </TabsList>

          <TabsContent value="overview"
            className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Section */}
          <Card className="lg:col-span-2 p-6 glass-dashboard hover:shadow-[var(--shadow-medium)] transition-all duration-300 animate-fade-in-up">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">
                    {monthNames[currentMonth]} {currentYear}
                  </h2>
                </div>
                <Button variant="outline" size="icon" onClick={goToNextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {/* Day headers */}
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div
                  key={day}
                  className="text-center text-sm font-semibold text-muted-foreground py-2 border-b border-border/60"
                >
                  {day}
                </div>
              ))}

              {/* Calendar days */}
              {days.map((date, index) => {
                const dayAppointments = getAppointmentsForDate(date);
                return (
                  <button
                    key={index}
                    onClick={() => handleDayClick(date)}
                    disabled={!date}
                    className={`
                      aspect-square p-1 rounded-lg text-sm font-medium
                      transition-all duration-200 relative flex flex-col
                      ${!date ? "invisible" : ""}
                      ${isPastDate(date) ? "text-muted-foreground/30 bg-muted/20" : "bg-card"}
                      ${isToday(date) ? "ring-2 ring-primary ring-offset-2 ring-offset-card shadow-lg" : "border border-border/70"}
                      ${isSelected(date) ? "bg-primary text-primary-foreground shadow-lg border-primary" : ""}
                      ${date && !isSelected(date) ? "hover:bg-accent/80 hover:border-primary/50 hover:scale-105 active:scale-95 cursor-pointer hover:shadow-md" : ""}
                    `}
                  >
                    {date && (
                      <>
                        <div className="text-xs">{date.getDate()}</div>
                        {dayAppointments.length > 0 && (
                          <div className="flex-1 flex flex-col gap-0.5 mt-0.5 w-full">
                            {dayAppointments.slice(0, 2).map((res) => {
                              const resDate = new Date(res.slotStart);
                              const hours = String(resDate.getHours()).padStart(2, '0');
                              const minutes = String(resDate.getMinutes()).padStart(2, '0');
                              const patientName = res.patient 
                                ? `${res.patient.firstName} ${res.patient.lastName}`
                                : 'Patient';
                              const procedureName = res.procedure?.name || 'Unknown Procedure';
                              const statusStyles = getReservationStatusStyles(res.status);
                              const statusLabel = getReservationStatusLabel(res.status);
                              return (
                                <div
                                  key={res.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDayClick(date);
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'scale(1.1)';
                                    e.currentTarget.style.zIndex = '20';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = '';
                                    e.currentTarget.style.zIndex = '';
                                  }}
                                  className={`
                                    text-[8px] leading-tight px-0.5 py-0.5 rounded truncate
                                    transition-all duration-300 cursor-pointer relative font-semibold
                                    ${statusStyles.chip}
                                    ${isSelected(date) ? "ring-1 ring-white/60" : ""}
                                    hover:shadow-md hover:ring-2 hover:ring-primary/50
                                  `}
                                  title={`${hours}:${minutes} - ${patientName} - ${procedureName} - ${statusLabel}`}
                                >
                                  {hours}:{minutes}
                                </div>
                              );
                            })}
                            {dayAppointments.length > 2 && (
                              <div className={`text-[8px] ${isSelected(date) ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                                +{dayAppointments.length - 2}
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="p-6 glass-dashboard hover:shadow-[var(--shadow-medium)] transition-all duration-300 animate-fade-in-up border-l-4 border-l-primary" style={{ animationDelay: "0.1s" }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-6 bg-gradient-to-b from-primary to-secondary rounded-full" />
                <h3 className="text-lg font-semibold">Quick Stats</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                  <span className="text-muted-foreground font-medium">Today's Appointments</span>
                  <Badge variant="secondary" className="bg-secondary/80">
                    {reservations.filter((res) => {
                      const resDate = new Date(res.slotStart);
                      return resDate.toDateString() === today.toDateString();
                    }).length}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                  <span className="text-muted-foreground font-medium">Total Patients</span>
                  <Badge variant="secondary" className="bg-primary/80">{uniquePatientsCount}</Badge>
                </div>
              </div>
            </Card>

            <Card className="p-6 glass-dashboard hover:shadow-[var(--shadow-medium)] transition-all duration-300 animate-fade-in-up border-l-4 border-l-secondary" style={{ animationDelay: "0.2s" }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-6 bg-gradient-to-b from-secondary to-primary rounded-full" />
                <h3 className="text-lg font-semibold">Upcoming Appointments</h3>
              </div>
              <div className="space-y-3">
                {confirmedReservations
                  .filter(res => {
                    const resDate = new Date(res.slotStart);
                    return resDate >= today;
                  })
                  .sort((a, b) => new Date(a.slotStart).getTime() - new Date(b.slotStart).getTime())
                  .slice(0, 3)
                  .map((res) => {
                    const resDate = new Date(res.slotStart);
                    const hours = String(resDate.getHours()).padStart(2, '0');
                    const minutes = String(resDate.getMinutes()).padStart(2, '0');
                    const patientName = res.patient 
                      ? `${res.patient.firstName} ${res.patient.lastName}`
                      : 'Unknown Patient';
                    const procedureName = res.procedure?.name || 'Unknown Procedure';
                    
                    return (
                      <Card key={res.id} className="p-3 border-2 border-border/60 hover:border-primary/50 transition-all duration-200 hover:shadow-sm bg-card">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm font-medium">
                                <User className="w-4 h-4 text-primary" />
                                {patientName}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <CalendarIcon className="w-3 h-3" />
                                {resDate.toLocaleDateString("en-US", { 
                                  month: "short", 
                                  day: "numeric",
                                  year: "numeric" 
                                })}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                {hours}:{minutes}
                              </div>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {procedureName}
                            </Badge>
                          </div>
                          <div className="flex gap-1 pt-2 border-t">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="flex-1 h-8 text-xs"
                              onClick={() => handleMessagePatient(patientName)}
                            >
                              <MessageSquare className="w-3 h-3 mr-1" />
                              Message
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive" 
                              className="h-8 px-2"
                              onClick={() => handleCancelAppointment(res.id)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
              </div>
            </Card>
          </div>
        </div>
          </TabsContent>

          <TabsContent value="cards" className="space-y-6">
            <PatientCards doctorId={doctorId} refreshKey={cardsRefreshKey} />
          </TabsContent>

          <TabsContent value="records">
            <PatientRecords doctorId={doctorId} refreshKey={recordsRefreshKey} />
          </TabsContent>

          <TabsContent value="requests" className="space-y-4">
            {loadingReservations ? (
              <Card className="p-6 text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                <p className="text-muted-foreground">Loading requests...</p>
              </Card>
            ) : pendingReservations.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No pending appointment requests</p>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pendingReservations.map((res) => {
                  const slotStart = new Date(res.slotStart);
                  const hours = String(slotStart.getHours()).padStart(2, '0');
                  const minutes = String(slotStart.getMinutes()).padStart(2, '0');
                  const patientName = res.patient 
                    ? `${res.patient.firstName} ${res.patient.lastName}`
                    : 'Unknown Patient';
                  const procedureName = res.procedure?.name || 'Unknown Procedure';
                  const isCancellationRequest = res.status === "cancellation_requested";
                  const isRescheduleRequest = res.status === "reschedule_requested";
                  const isUpdateRequest = res.status === "update_requested";
                  
                  // Get requested reschedule/update time if available
                  let requestedTimeDisplay = null;
                  if ((isRescheduleRequest || isUpdateRequest) && res.requestedSlotStart) {
                    const requestedDate = new Date(res.requestedSlotStart);
                    const reqHours = String(requestedDate.getHours()).padStart(2, '0');
                    const reqMinutes = String(requestedDate.getMinutes()).padStart(2, '0');
                    requestedTimeDisplay = {
                      date: requestedDate.toLocaleDateString("en-US", { 
                        month: "short", 
                        day: "numeric",
                        year: "numeric" 
                      }),
                      time: `${reqHours}:${reqMinutes}`,
                    };
                  }
                  
                  return (
                    <Card key={res.id} className={`p-4 ${isCancellationRequest ? 'border-2 border-destructive/50' : isRescheduleRequest || isUpdateRequest ? 'border-2 border-primary/50' : ''}`}>
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 font-semibold">
                              <User className="w-4 h-4 text-primary" />
                              {patientName}
                            </div>
                            {res.patient?.email && (
                              <p className="text-xs text-muted-foreground">{res.patient.email}</p>
                            )}
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <CalendarIcon className="w-3 h-3" />
                              <span>Current: {slotStart.toLocaleDateString("en-US", { 
                                month: "short", 
                                day: "numeric",
                                year: "numeric" 
                              })}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              <span>Current: {hours}:{minutes}</span>
                            </div>
                            {isUpdateRequest && res.updateRequestMessage && (
                              <div className="p-2 rounded bg-primary/10 border border-primary/20">
                                <p className="text-xs font-semibold text-primary mb-1">Update Request:</p>
                                {requestedTimeDisplay && (
                                  <>
                                    <p className="text-xs text-muted-foreground mb-1">
                                      <strong>New Date:</strong> {requestedTimeDisplay.date}
                                    </p>
                                    <p className="text-xs text-muted-foreground mb-1">
                                      <strong>New Time:</strong> {requestedTimeDisplay.time}
                                    </p>
                                  </>
                                )}
                                {res.requestedDoctorId && (
                                  <p className="text-xs text-muted-foreground mb-1">
                                    <strong>New Doctor:</strong> Requested change
                                  </p>
                                )}
                                {res.requestedProcedureId && (
                                  <p className="text-xs text-muted-foreground mb-1">
                                    <strong>New Procedure:</strong> Requested change
                                  </p>
                                )}
                                <p className="text-xs text-muted-foreground mt-1 italic">
                                  "{res.updateRequestMessage}"
                                </p>
                              </div>
                            )}
                            {isRescheduleRequest && requestedTimeDisplay && (
                              <div className="p-2 rounded bg-primary/10 border border-primary/20">
                                <p className="text-xs font-semibold text-primary mb-1">Reschedule Request:</p>
                                <p className="text-xs text-muted-foreground mb-1">
                                  <strong>New Date:</strong> {requestedTimeDisplay.date}
                                </p>
                                <p className="text-xs text-muted-foreground mb-1">
                                  <strong>New Time:</strong> {requestedTimeDisplay.time}
                                </p>
                                {res.rescheduleRequestMessage && (
                                  <p className="text-xs text-muted-foreground mt-1 italic">
                                    "{res.rescheduleRequestMessage}"
                                  </p>
                                )}
                              </div>
                            )}
                            {isCancellationRequest && res.cancellationRequestMessage && (
                              <div className="p-2 rounded bg-destructive/10 border border-destructive/20">
                                <p className="text-xs font-semibold text-destructive mb-1">Cancellation Request:</p>
                                <p className="text-xs text-muted-foreground">{res.cancellationRequestMessage}</p>
                              </div>
                            )}
                            {res.note && !isCancellationRequest && !isRescheduleRequest && !isUpdateRequest && (
                              <p className="text-xs text-muted-foreground italic">Note: {res.note}</p>
                            )}
                          </div>
                          <Badge variant={
                            isCancellationRequest ? "destructive" : 
                            isRescheduleRequest || isUpdateRequest ? "default" :
                            "secondary"
                          }>
                            {isCancellationRequest ? "Cancellation Requested" : 
                             isRescheduleRequest ? "Reschedule Requested" :
                             isUpdateRequest ? "Update Requested" :
                             procedureName}
                          </Badge>
                        </div>
                        
                        <div className="flex gap-2 pt-2 border-t">
                          {isCancellationRequest ? (
                            <>
                              <Button 
                                size="sm" 
                                className="flex-1"
                                onClick={async () => {
                                  try {
                                    await acceptCancellation(res.id, doctorId);
                                    toast({
                                      title: "Cancellation Accepted",
                                      description: "The appointment has been cancelled.",
                                    });
                                    loadReservations();
                                  } catch (error: any) {
                                    toast({
                                      title: "Error",
                                      description: error.message || "Failed to accept cancellation",
                                      variant: "destructive",
                                    });
                                  }
                                }}
                              >
                                <Check className="w-3 h-3 mr-1" />
                                Accept Cancellation
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  setSelectedReservation(res);
                                  setConfirmMessage("");
                                  setConfirmDialogOpen(true);
                                }}
                              >
                                <XCircle className="w-3 h-3" />
                                Decline
                              </Button>
                            </>
                          ) : isRescheduleRequest ? (
                            <>
                              <Button 
                                size="sm" 
                                className="flex-1"
                                onClick={async () => {
                                  try {
                                    await acceptReschedule(res.id, doctorId);
                                    toast({
                                      title: "Reschedule Accepted",
                                      description: "The appointment has been rescheduled.",
                                    });
                                    loadReservations();
                                  } catch (error: any) {
                                    toast({
                                      title: "Error",
                                      description: error.message || "Failed to accept reschedule",
                                      variant: "destructive",
                                    });
                                  }
                                }}
                              >
                                <Check className="w-3 h-3 mr-1" />
                                Accept Reschedule
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  setSelectedReservation(res);
                                  setConfirmMessage("");
                                  setConfirmDialogOpen(true);
                                }}
                              >
                                <XCircle className="w-3 h-3" />
                                Decline
                              </Button>
                            </>
                          ) : isUpdateRequest ? (
                            <>
                              <Button 
                                size="sm" 
                                className="flex-1"
                                onClick={async () => {
                                  try {
                                    await acceptUpdate(res.id, doctorId);
                                    toast({
                                      title: "Update Accepted",
                                      description: "The appointment has been updated.",
                                    });
                                    loadReservations();
                                  } catch (error: any) {
                                    toast({
                                      title: "Error",
                                      description: error.message || "Failed to accept update",
                                      variant: "destructive",
                                    });
                                  }
                                }}
                              >
                                <Check className="w-3 h-3 mr-1" />
                                Accept Update
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  setSelectedReservation(res);
                                  setConfirmMessage("");
                                  setConfirmDialogOpen(true);
                                }}
                              >
                                <XCircle className="w-3 h-3" />
                                Decline
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button 
                                size="sm" 
                                className="flex-1"
                                onClick={() => handleConfirmClick(res)}
                              >
                                <Check className="w-3 h-3 mr-1" />
                                Confirm
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => {
                                  setSelectedReservation(res);
                                  setConfirmMessage("");
                                  setConfirmDialogOpen(true);
                                }}
                              >
                                <XCircle className="w-3 h-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="schedule" className="space-y-6">
            <AvailableHoursConfig doctorId={doctorId} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Day Details Dialog */}
      <Dialog open={isDayDetailsOpen} onOpenChange={setIsDayDetailsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedDate?.toLocaleDateString("en-US", { 
                weekday: "long", 
                year: "numeric", 
                month: "long", 
                day: "numeric" 
              })}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {getAppointmentsForDate(selectedDate).length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm font-medium">Appointments:</p>
                {getAppointmentsForDate(selectedDate).map((res) => {
                  const resDate = new Date(res.slotStart);
                  const hours = String(resDate.getHours()).padStart(2, '0');
                  const minutes = String(resDate.getMinutes()).padStart(2, '0');
                  const patientName = res.patient 
                    ? `${res.patient.firstName} ${res.patient.lastName}`
                    : 'Unknown Patient';
                  const procedureName = res.procedure?.name || 'Unknown Procedure';
                  const statusStyles = getReservationStatusStyles(res.status);
                  const statusLabel = getReservationStatusLabel(res.status);
                  
                  return (
                    <Card key={res.id} className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <p className="font-semibold">{patientName}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>{hours}:{minutes}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{procedureName}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <Badge variant="outline" className={statusStyles.badge}>
                              {statusLabel}
                            </Badge>
                            <Badge variant="outline">{procedureName}</Badge>
                          </div>
                        </div>
                        <div className="flex gap-2 pt-2 border-t">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => handleMessagePatient(patientName)}
                          >
                            <MessageSquare className="h-3 w-3 mr-1" />
                            Message
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleCancelAppointment(res.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No appointments on this date</p>
              </div>
            )}
            
          </div>
        </DialogContent>
      </Dialog>


      <MessagingSystem
        open={messagingOpen}
        onOpenChange={setMessagingOpen}
        userType="doctor"
        userId={doctorId}
      />

      {/* Confirm/Decline Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedReservation ? (
                selectedReservation.patient 
                  ? `Confirm/Decline Appointment with ${selectedReservation.patient.firstName} ${selectedReservation.patient.lastName}`
                  : "Confirm/Decline Appointment"
              ) : "Confirm/Decline Appointment"}
            </DialogTitle>
            <DialogDescription>
              {selectedReservation && (
                <>
                  <p className="mb-2">
                    <strong>Date:</strong> {new Date(selectedReservation.slotStart).toLocaleDateString()} at{" "}
                    {String(new Date(selectedReservation.slotStart).getHours()).padStart(2, '0')}:
                    {String(new Date(selectedReservation.slotStart).getMinutes()).padStart(2, '0')}
                  </p>
                  <p>
                    <strong>Procedure:</strong> {selectedReservation.procedure?.name || "Unknown"}
                  </p>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="message">Message (Optional)</Label>
              <Textarea
                id="message"
                value={confirmMessage}
                onChange={(e) => setConfirmMessage(e.target.value)}
                placeholder="Add a message to the patient..."
                rows={4}
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setConfirmDialogOpen(false);
                setSelectedReservation(null);
                setConfirmMessage("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleConfirmReservation('cancelled')}
              disabled={processing}
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Decline
                </>
              )}
            </Button>
            <Button
              onClick={() => handleConfirmReservation('confirmed')}
              disabled={processing}
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Confirm
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DoctorDashboard;
