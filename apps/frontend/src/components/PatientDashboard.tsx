import { useState, useEffect } from "react";
import { Calendar, Clock, User, LogOut, Plus, Edit2, ChevronLeft, ChevronRight, Search, MessageSquare, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AppointmentDialog, Appointment } from "./AppointmentDialog";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { deleteReservation, updateReservation, getReservations, getDoctor, requestCancellation, requestReschedule, getAvailableTimeSlots, formatDateForQuery, type Reservation } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import Navbar from "./Navbar";
import { DoctorBrowse } from "./DoctorBrowse";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessagingSystem } from "./MessagingSystem";
import medicalHero from "@/assets/medical-hero.jpg";

interface PatientDashboardProps {
  onLogout: () => void;
}

const PatientDashboard = ({ onLogout }: PatientDashboardProps) => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [dayDetailsOpen, setDayDetailsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [messagingOpen, setMessagingOpen] = useState(false);
  const [cancellationDialogOpen, setCancellationDialogOpen] = useState(false);
  const [selectedAppointmentForCancellation, setSelectedAppointmentForCancellation] = useState<Appointment | null>(null);
  const [cancellationMessage, setCancellationMessage] = useState("");
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [selectedAppointmentForReschedule, setSelectedAppointmentForReschedule] = useState<Appointment | null>(null);
  const [rescheduleMessage, setRescheduleMessage] = useState("");
  const [rescheduleDate, setRescheduleDate] = useState<Date | null>(null);
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [availableSlots, setAvailableSlots] = useState<Array<{from: string, to: string}>>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsLoaded, setSlotsLoaded] = useState(false);
  const [doctorIdForReschedule, setDoctorIdForReschedule] = useState<string>("");
  const { toast } = useToast();
  const today = new Date();

  const userName = user ? `${user.firstName} ${user.lastName}` : "User";
  const userEmail = user?.email || "";

  // Load appointments from backend on mount
  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    if (!user?.id) {
      setLoadingAppointments(false);
      return;
    }
    
    setLoadingAppointments(true);
    try {
      const reservationsData: Reservation[] = await getReservations(user.id);
      setReservations(reservationsData);
      
      // Convert reservations to appointments format
      const appointmentsList: Appointment[] = await Promise.all(
        reservationsData.map(async (res) => {
          try {
            // Fetch doctor name
            const doctor = await getDoctor(res.doctorId);
            const slotStart = new Date(res.slotStart);
            const hours = String(slotStart.getHours()).padStart(2, '0');
            const minutes = String(slotStart.getMinutes()).padStart(2, '0');
            
            return {
              id: res.id,
              date: slotStart,
              time: `${hours}:${minutes}`,
              doctorName: doctor.name,
              type: res.note || 'Appointment', // Use note as type, or fallback
              status: res.status as "pending" | "confirmed" | "cancelled" | "cancellation_requested" | "reschedule_requested" | "update_requested",
            };
          } catch (error) {
            console.error(`Failed to load doctor for reservation ${res.id}:`, error);
            // Fallback if doctor fetch fails
            const slotStart = new Date(res.slotStart);
            const hours = String(slotStart.getHours()).padStart(2, '0');
            const minutes = String(slotStart.getMinutes()).padStart(2, '0');
            return {
              id: res.id,
              date: slotStart,
              time: `${hours}:${minutes}`,
              doctorName: 'Unknown Doctor',
              type: res.note || 'Appointment',
              status: res.status as "pending" | "confirmed" | "cancelled" | "cancellation_requested" | "reschedule_requested" | "update_requested",
            };
          }
        })
      );
      
      setAppointments(appointmentsList);
    } catch (error: any) {
      console.error("Failed to load appointments:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load appointments",
        variant: "destructive",
      });
    } finally {
      setLoadingAppointments(false);
    }
  };

  // Generate calendar days for current month
  const getDaysInMonth = () => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty slots for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add actual days
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
    return appointments.filter(apt => 
      apt.date.toDateString() === date.toDateString()
    );
  };

  const handleSaveAppointment = async (appointment: Appointment) => {
    const existing = appointments.find(a => a.id === appointment.id);
    
    try {
      if (existing) {
        // Update requests are now handled in AppointmentDialog via requestUpdate
        // Just reload appointments to show the new status
        loadAppointments();
      } else {
        // New appointment - already saved via AppointmentDialog API call
        setAppointments([...appointments, appointment]);
        toast({
          title: "Appointment created",
          description: "Your appointment has been successfully created.",
        });
        // Reload appointments to ensure we have the latest data
        loadAppointments();
      }
    } catch (error: any) {
      console.error("Failed to save appointment:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save appointment",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAppointment = async (appointmentId: string) => {
    try {
      await deleteReservation(appointmentId);
      setAppointments(appointments.filter(a => a.id !== appointmentId));
      toast({
        title: "Appointment deleted",
        description: "Your appointment has been successfully deleted.",
      });
      // Reload appointments to ensure we have the latest data
      loadAppointments();
    } catch (error: any) {
      console.error("Failed to delete appointment:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete appointment",
        variant: "destructive",
      });
    }
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setSelectedDate(appointment.date); // Set the selected date to the appointment's date
    setDialogOpen(true);
  };

  const handleNewAppointment = () => {
    if (!selectedDate) {
      toast({
        title: "Select a date",
        description: "Please select a date first to create an appointment.",
        variant: "destructive",
      });
      return;
    }
    setEditingAppointment(null);
    setDayDetailsOpen(false);
    setDialogOpen(true);
  };

  const handleDayClick = (date: Date | null) => {
    if (!date || isPastDate(date)) return;
    setSelectedDate(date);
    setDayDetailsOpen(true);
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
        {/* Header */}
        <div className="flex justify-between items-center mb-8 animate-fade-in-down">
          <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 text-shimmer">Patient Dashboard</h1>
            <p className="text-muted-foreground text-lg">Welcome back, {user?.firstName || "User"}!</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setMessagingOpen(true)}>
              <MessageSquare className="mr-2 h-4 w-4" />
              Messages
            </Button>
            <Button variant="outline" onClick={onLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-muted/50 border border-border/60">
            <TabsTrigger value="overview" className="data-[state=active]:bg-card data-[state=active]:border-b-2 data-[state=active]:border-primary">Overview</TabsTrigger>
            <TabsTrigger value="browse" className="data-[state=active]:bg-card data-[state=active]:border-b-2 data-[state=active]:border-primary">
              <Search className="w-4 h-4 mr-2" />
              Browse Doctors
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Calendar Section */}
          <Card className="lg:col-span-2 p-6 glass-dashboard hover:shadow-[var(--shadow-medium)] transition-all duration-300 animate-fade-in-up">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToPreviousMonth}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">
                    {monthNames[currentMonth]} {currentYear}
                  </h2>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToNextMonth}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <Button onClick={handleNewAppointment} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Appointment
              </Button>
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
                const hasAppointments = dayAppointments.length > 0;
                return (
                  <button
                    key={index}
                    onClick={() => handleDayClick(date)}
                    disabled={!date || isPastDate(date)}
                    className={`
                      group aspect-square p-1.5 rounded-lg text-sm font-medium
                      transition-all duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] relative flex flex-col
                      overflow-hidden
                      ${!date ? "invisible" : ""}
                      ${isPastDate(date) 
                        ? "text-muted-foreground/30 cursor-not-allowed bg-muted/20 border border-border/30" 
                        : "bg-card border border-border/70"
                      }
                      ${isToday(date) 
                        ? "ring-2 ring-primary ring-offset-2 ring-offset-card shadow-lg bg-primary/5" 
                        : ""
                      }
                      ${isSelected(date) 
                        ? "bg-primary text-primary-foreground shadow-xl border-primary scale-105 z-10" 
                        : ""
                      }
                      ${!isPastDate(date) && !isSelected(date) 
                        ? "hover:bg-accent/80 hover:border-primary/60 hover:scale-110 hover:shadow-lg hover:z-10 active:scale-100 cursor-pointer" 
                        : ""
                      }
                      ${hasAppointments && !isSelected(date) && !isPastDate(date)
                        ? "hover:ring-2 hover:ring-primary/30"
                        : ""
                      }
                    `}
                    title={date ? `${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}${hasAppointments ? ` - ${dayAppointments.length} appointment${dayAppointments.length > 1 ? 's' : ''}` : ''}` : ''}
                  >
                    {/* Hover effect background */}
                    {!isPastDate(date) && !isSelected(date) && (
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg" />
                    )}
                    
                    {date && (
                      <>
                        <div className={`text-xs font-semibold relative z-10 transition-colors duration-300 ${
                          isSelected(date) ? "text-primary-foreground" : ""
                        }`}>
                          {date.getDate()}
                        </div>
                        {hasAppointments && (
                          <div className="flex-1 flex flex-col gap-1 mt-1 w-full relative z-10">
                            {dayAppointments.slice(0, 2).map((apt) => (
                              <div
                                key={apt.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditAppointment(apt);
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
                                  text-[9px] leading-tight px-1 py-0.5 rounded-md truncate
                                  transition-all duration-300 cursor-pointer relative font-semibold
                                  ${isSelected(date) 
                                    ? "bg-primary text-white hover:bg-white hover:text-primary" 
                                    : "bg-primary text-white hover:bg-white hover:text-primary"
                                  }
                                  hover:shadow-md hover:ring-2 hover:ring-primary/50
                                `}
                                title={`${apt.time} - ${apt.doctorName} (${apt.type})`}
                              >
                                <span className="font-medium">{apt.time}</span>
                              </div>
                            ))}
                            {dayAppointments.length > 2 && (
                              <div 
                                className={`
                                  text-[9px] font-semibold px-1 py-0.5 rounded-md
                                  transition-all duration-300 cursor-pointer
                                  ${isSelected(date) 
                                    ? "text-primary-foreground/80 bg-primary-foreground/15 hover:bg-primary-foreground/25" 
                                    : "text-muted-foreground bg-muted/30 hover:bg-muted/50"
                                  }
                                  hover:scale-105
                                `}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDayClick(date);
                                }}
                                title={`View all ${dayAppointments.length} appointments`}
                              >
                                +{dayAppointments.length - 2} more
                              </div>
                            )}
                          </div>
                        )}
                        {!hasAppointments && !isPastDate(date) && (
                          <div className="flex-1 flex items-center justify-center mt-1">
                            <div className="w-1 h-1 rounded-full bg-muted-foreground/20 group-hover:bg-primary/40 group-hover:scale-150 transition-all duration-300" />
                          </div>
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </div>

            {selectedDate && (
              <div className="mt-6 p-4 bg-gradient-to-br from-primary/10 via-accent/30 to-secondary/10 rounded-lg border-2 border-primary/30 shadow-md">
                <p className="text-sm text-muted-foreground mb-2 font-medium">Selected date:</p>
                <p className="font-semibold text-lg mb-3 text-foreground">
                  {selectedDate.toLocaleDateString("en-US", { 
                    weekday: "long", 
                    year: "numeric", 
                    month: "long", 
                    day: "numeric" 
                  })}
                </p>
                {getAppointmentsForDate(selectedDate).length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Appointments:</p>
                    {getAppointmentsForDate(selectedDate).map((apt, idx) => (
                      <div 
                        key={apt.id} 
                        className="group flex items-center justify-between p-4 bg-card rounded-lg border-2 border-border/70 hover:border-primary/60 transition-all duration-500 hover:shadow-lg hover:scale-[1.02] cursor-pointer animate-fade-in-up"
                        style={{ animationDelay: `${idx * 100}ms` }}
                        onClick={() => handleEditAppointment(apt)}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                            <Clock className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-semibold group-hover:text-primary transition-colors duration-300">{apt.doctorName}</p>
                              <Badge variant={
                                apt.status === "confirmed" ? "default" : 
                                apt.status === "pending" ? "secondary" : 
                                apt.status === "cancellation_requested" ? "destructive" :
                                apt.status === "reschedule_requested" ? "secondary" :
                                apt.status === "update_requested" ? "secondary" :
                                "destructive"
                              } className="text-xs">
                                {apt.status === "cancellation_requested" ? "Cancellation Requested" : 
                                 apt.status === "reschedule_requested" ? "Reschedule Requested" :
                                 apt.status === "update_requested" ? "Update Requested" :
                                 apt.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="font-medium">{apt.time}</span>
                              <span>•</span>
                              <span>{apt.type}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {(apt.status === "confirmed" || apt.status === "pending") && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  const reservation = reservations.find(r => r.id === apt.id);
                                  if (reservation) {
                                    setDoctorIdForReschedule(reservation.doctorId);
                                    setSelectedAppointmentForReschedule(apt);
                                    setRescheduleDate(new Date(apt.date));
                                    setRescheduleTime(apt.time);
                                    setRescheduleMessage("");
                                    setAvailableSlots([]);
                                    setSlotsLoaded(false);
                                    setRescheduleDialogOpen(true);
                                  }
                                }}
                              >
                                Reschedule
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedAppointmentForCancellation(apt);
                                  setCancellationDialogOpen(true);
                                }}
                              >
                                Cancel
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditAppointment(apt);
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No appointments on this date</p>
                )}
              </div>
            )}
          </Card>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card className="p-6 glass-dashboard hover:shadow-[var(--shadow-medium)] transition-all duration-300 animate-fade-in-up border-l-4 border-l-primary" style={{ animationDelay: "0.1s" }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-6 bg-gradient-to-b from-primary to-secondary rounded-full" />
                <h3 className="text-lg font-semibold">Quick Stats</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                  <span className="text-muted-foreground font-medium">Upcoming</span>
                  <Badge className="bg-primary/90 hover:bg-primary">2 appointments</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                  <span className="text-muted-foreground font-medium"><Link to="/completed">Completed</Link></span>
                  <Badge variant="secondary" className="bg-secondary/80">8 visits</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                  <span className="text-muted-foreground font-medium">Doctors</span>
                  <Badge variant="outline" className="border-border/70">3 active</Badge>
                </div>
              </div>
            </Card>

            {/* Upcoming Appointments */}
            <Card className="p-6 glass-dashboard hover:shadow-[var(--shadow-medium)] transition-all duration-300 animate-fade-in-up border-l-4 border-l-secondary" style={{ animationDelay: "0.2s" }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-6 bg-gradient-to-b from-secondary to-primary rounded-full" />
                <h3 className="text-lg font-semibold">Upcoming Appointments</h3>
              </div>
              <div className="space-y-3">
                {appointments
                  .filter(apt => apt.date >= today)
                  .sort((a, b) => a.date.getTime() - b.date.getTime())
                  .slice(0, 3)
                  .map((apt) => (
                    <div key={apt.id} className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-r from-accent/40 to-accent/20 border border-border/60 hover:border-primary/50 transition-all duration-200 hover:shadow-sm">
                      <Clock className="h-5 w-5 text-primary mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{apt.doctorName}</p>
                          <Badge variant={
                            apt.status === "confirmed" ? "default" : 
                            apt.status === "pending" ? "secondary" : 
                            apt.status === "cancellation_requested" ? "destructive" :
                            apt.status === "reschedule_requested" ? "secondary" :
                            apt.status === "update_requested" ? "secondary" :
                            "destructive"
                          } className="text-xs">
                            {apt.status === "cancellation_requested" ? "Cancellation Requested" : 
                             apt.status === "reschedule_requested" ? "Reschedule Requested" :
                             apt.status === "update_requested" ? "Update Requested" :
                             apt.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {apt.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, {apt.time}
                        </p>
                      </div>
                      {(apt.status === "confirmed" || apt.status === "pending") && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs"
                            onClick={async () => {
                              const reservation = reservations.find(r => r.id === apt.id);
                              if (reservation) {
                                setDoctorIdForReschedule(reservation.doctorId);
                                setSelectedAppointmentForReschedule(apt);
                                setRescheduleDate(new Date(apt.date));
                                setRescheduleTime(apt.time);
                                setRescheduleMessage("");
                                setAvailableSlots([]);
                                setSlotsLoaded(false);
                                setRescheduleDialogOpen(true);
                              }
                            }}
                          >
                            Reschedule
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="text-xs"
                            onClick={() => {
                              setSelectedAppointmentForCancellation(apt);
                              setCancellationDialogOpen(true);
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </Card>

            {/* Profile Card */}
            <Card className="p-6 glass-dashboard hover:shadow-[var(--shadow-medium)] transition-all duration-300 animate-fade-in-up border-t-4 border-t-primary/50" style={{ animationDelay: "0.3s" }}>
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border/60">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg ring-2 ring-primary/20">
                  <User className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{userName}</p>
                  <p className="text-xs text-muted-foreground">{userEmail}</p>
                </div>
              </div>
              <Button variant="outline" className="w-full border-2 border-border/70 hover:border-primary/50" size="sm">
                Edit Profile
              </Button>
            </Card>
          </div>
        </div>
          </TabsContent>

          <TabsContent value="browse">
            <DoctorBrowse />
          </TabsContent>
        </Tabs>
      </div>

      <AppointmentDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            // Reload appointments when dialog closes to get updated status
            loadAppointments();
          }
        }}
        appointment={editingAppointment}
        selectedDate={selectedDate}
        onSelectedDateChange={setSelectedDate}
        onSave={handleSaveAppointment}
        userType="patient"
      />

      <MessagingSystem
        open={messagingOpen}
        onOpenChange={setMessagingOpen}
        userType="patient"
      />

      <Dialog open={dayDetailsOpen} onOpenChange={setDayDetailsOpen}>
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
                {getAppointmentsForDate(selectedDate).map((apt) => (
                  <Card key={apt.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{apt.doctorName}</p>
                          <Badge variant={apt.status === "confirmed" ? "default" : apt.status === "pending" ? "secondary" : "destructive"} className="text-xs">
                            {apt.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{apt.time}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{apt.type}</p>
                      </div>
                      <div className="flex gap-2">
                        {(apt.status === "confirmed" || apt.status === "pending") && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setSelectedAppointmentForCancellation(apt);
                              setDayDetailsOpen(false);
                              setCancellationDialogOpen(true);
                            }}
                          >
                            Cancel
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            handleEditAppointment(apt);
                          }}
                        >
                          <Edit2 className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No appointments on this date</p>
              </div>
            )}
            
            <Button 
              onClick={handleNewAppointment} 
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Request Appointment
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancellation Request Dialog */}
      <Dialog open={cancellationDialogOpen} onOpenChange={setCancellationDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Request Cancellation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedAppointmentForCancellation && (
              <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                <p className="text-sm font-semibold mb-2">Appointment Details:</p>
                <p className="text-sm text-muted-foreground">
                  <strong>Doctor:</strong> {selectedAppointmentForCancellation.doctorName}
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Date:</strong> {selectedAppointmentForCancellation.date.toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                  })}
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Time:</strong> {selectedAppointmentForCancellation.time}
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="cancellation-message">
                Reason for Cancellation <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="cancellation-message"
                placeholder="Please provide a reason for cancelling this appointment..."
                value={cancellationMessage}
                onChange={(e) => setCancellationMessage(e.target.value)}
                className="min-h-[100px]"
                required
              />
              <p className="text-xs text-muted-foreground">
                Minimum 10 characters required
              </p>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setCancellationDialogOpen(false);
                setCancellationMessage("");
                setSelectedAppointmentForCancellation(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!selectedAppointmentForCancellation || !cancellationMessage.trim() || cancellationMessage.length < 10) {
                  toast({
                    title: "Validation Error",
                    description: "Please provide a reason (minimum 10 characters)",
                    variant: "destructive",
                  });
                  return;
                }

                try {
                  await requestCancellation(selectedAppointmentForCancellation.id, cancellationMessage);
                  toast({
                    title: "Cancellation Requested",
                    description: "Your cancellation request has been sent to the doctor.",
                  });
                  setCancellationDialogOpen(false);
                  setCancellationMessage("");
                  setSelectedAppointmentForCancellation(null);
                  loadAppointments();
                } catch (error: any) {
                  toast({
                    title: "Error",
                    description: error.message || "Failed to request cancellation",
                    variant: "destructive",
                  });
                }
              }}
              disabled={!cancellationMessage.trim() || cancellationMessage.length < 10}
            >
              Request Cancellation
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reschedule Request Dialog */}
      <Dialog open={rescheduleDialogOpen} onOpenChange={setRescheduleDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Request Reschedule</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 overflow-y-auto flex-1 min-h-0">
            {selectedAppointmentForReschedule && (
              <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                <p className="text-sm font-semibold mb-2">Current Appointment:</p>
                <p className="text-sm text-muted-foreground">
                  <strong>Doctor:</strong> {selectedAppointmentForReschedule.doctorName}
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Date:</strong> {selectedAppointmentForReschedule.date.toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                  })}
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Time:</strong> {selectedAppointmentForReschedule.time}
                </p>
              </div>
            )}

            {/* Date Selection */}
            <div className="space-y-2">
              <Label htmlFor="reschedule-date">
                New Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="reschedule-date"
                type="date"
                value={rescheduleDate ? rescheduleDate.toISOString().split('T')[0] : ''}
                onChange={(e) => {
                  const newDate = e.target.value ? new Date(e.target.value) : null;
                  setRescheduleDate(newDate);
                  setAvailableSlots([]);
                  setSlotsLoaded(false);
                }}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            {/* Show Available Slots Button */}
            {rescheduleDate && doctorIdForReschedule && (
              <Button
                onClick={async () => {
                  if (!rescheduleDate || !doctorIdForReschedule) return;
                  
                  setLoadingSlots(true);
                  setAvailableSlots([]);
                  setSlotsLoaded(false);
                  
                  try {
                    const fromDate = formatDateForQuery(rescheduleDate);
                    const toDate = formatDateForQuery(new Date(rescheduleDate.getTime() + 7 * 24 * 60 * 60 * 1000));
                    
                    const slots = await getAvailableTimeSlots(doctorIdForReschedule, { from: fromDate, to: toDate });
                    setAvailableSlots(slots);
                    setSlotsLoaded(true);
                    
                    if (slots.length === 0) {
                      toast({
                        title: "No slots available",
                        description: "No available time slots found for the selected date range",
                        variant: "default",
                      });
                    }
                  } catch (error: any) {
                    console.error("Failed to load time slots:", error);
                    toast({
                      title: "Error",
                      description: error.message || "Failed to load available time slots",
                      variant: "destructive",
                    });
                    setSlotsLoaded(false);
                  } finally {
                    setLoadingSlots(false);
                  }
                }}
                disabled={!rescheduleDate || !doctorIdForReschedule || loadingSlots}
                className="w-full"
              >
                {loadingSlots ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading Slots...
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4 mr-2" />
                    Show Available Slots
                  </>
                )}
              </Button>
            )}

            {/* Time Selection */}
            {slotsLoaded && rescheduleDate && (
              <div className="space-y-2">
                <Label htmlFor="reschedule-time">
                  New Time <span className="text-destructive">*</span>
                </Label>
                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                  {(() => {
                    const year = rescheduleDate.getFullYear();
                    const month = String(rescheduleDate.getMonth() + 1).padStart(2, '0');
                    const day = String(rescheduleDate.getDate()).padStart(2, '0');
                    const dateStr = `${year}-${month}-${day}`;
                    
                    const slotsForDate = availableSlots.filter(slot => {
                      const slotDate = slot.from.split('T')[0];
                      return slotDate === dateStr;
                    }).map(slot => {
                      const timeStr = slot.from.split('T')[1] || slot.from.split(' ')[1];
                      return timeStr.substring(0, 5); // HH:mm
                    }).sort();
                    
                    return slotsForDate.length > 0 ? (
                      slotsForDate.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setRescheduleTime(slot)}
                          className={`
                            p-3 rounded-lg border-2 text-sm font-medium
                            transition-all duration-300
                            ${
                              rescheduleTime === slot
                                ? "bg-primary text-primary-foreground border-primary shadow-lg scale-105"
                                : "bg-card border-border/70 hover:border-primary/50 hover:bg-accent/50 hover:scale-105 active:scale-95"
                            }
                          `}
                        >
                          {slot}
                        </button>
                      ))
                    ) : (
                      <div className="col-span-3 text-sm text-muted-foreground py-4 text-center">
                        No available time slots for this date. Please select another date or search again.
                      </div>
                    );
                  })()}
                </div>
                <Input
                  id="reschedule-time"
                  type="time"
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="mt-2"
                />
              </div>
            )}

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="reschedule-message">
                Reason for Reschedule <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="reschedule-message"
                placeholder="Please provide a reason for rescheduling this appointment..."
                value={rescheduleMessage}
                onChange={(e) => setRescheduleMessage(e.target.value)}
                className="min-h-[100px]"
                required
              />
              <p className="text-xs text-muted-foreground">
                Minimum 10 characters required
              </p>
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setRescheduleDialogOpen(false);
                setRescheduleMessage("");
                setRescheduleDate(null);
                setRescheduleTime("");
                setSelectedAppointmentForReschedule(null);
                setAvailableSlots([]);
                setSlotsLoaded(false);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!selectedAppointmentForReschedule || !rescheduleMessage.trim() || rescheduleMessage.length < 10 || !rescheduleDate || !rescheduleTime) {
                  toast({
                    title: "Validation Error",
                    description: "Please fill in all required fields (date, time, and reason with minimum 10 characters)",
                    variant: "destructive",
                  });
                  return;
                }

                try {
                  // Calculate slot start and end times
                  const [hours, minutes] = rescheduleTime.split(':').map(Number);
                  const slotStart = new Date(rescheduleDate);
                  slotStart.setHours(hours, minutes, 0, 0);
                  
                  // Get procedure duration from reservation
                  const reservation = reservations.find(r => r.id === selectedAppointmentForReschedule.id);
                  const duration = 30; // Default, could get from procedure
                  
                  const slotEnd = new Date(slotStart);
                  slotEnd.setMinutes(slotEnd.getMinutes() + duration);

                  await requestReschedule(
                    selectedAppointmentForReschedule.id,
                    rescheduleMessage,
                    slotStart.toISOString(),
                    slotEnd.toISOString()
                  );
                  
                  toast({
                    title: "Reschedule Requested",
                    description: "Your reschedule request has been sent to the doctor.",
                  });
                  setRescheduleDialogOpen(false);
                  setRescheduleMessage("");
                  setRescheduleDate(null);
                  setRescheduleTime("");
                  setSelectedAppointmentForReschedule(null);
                  setAvailableSlots([]);
                  setSlotsLoaded(false);
                  loadAppointments();
                } catch (error: any) {
                  toast({
                    title: "Error",
                    description: error.message || "Failed to request reschedule",
                    variant: "destructive",
                  });
                }
              }}
              disabled={!rescheduleMessage.trim() || rescheduleMessage.length < 10 || !rescheduleDate || !rescheduleTime || !slotsLoaded}
            >
              Request Reschedule
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PatientDashboard;
