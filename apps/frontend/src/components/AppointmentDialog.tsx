import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, User, Stethoscope, Sparkles, Loader2, Building } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  getAvailableTimeSlots, 
  createReservation, 
  updateReservation,
  requestUpdate,
  formatDateForTimeSlot,
  formatDateForQuery,
  getDoctors,
  getDepartments,
  getProcedures,
  type Doctor,
  type Department,
  type Procedure
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export interface Appointment {
  id: string;
  date: Date;
  time: string;
  doctorName: string;
  type: string;
  status: "pending" | "confirmed" | "cancelled" | "cancellation_requested" | "reschedule_requested" | "update_requested";
  patientName?: string;
}

interface AppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment | null;
  selectedDate: Date | null;
  onSelectedDateChange?: (date: Date) => void;
  onSave: (appointment: Appointment) => void;
  userType?: "patient" | "doctor";
}

// All data will be fetched from API

export const AppointmentDialog = ({
  open,
  onOpenChange,
  appointment,
  selectedDate,
  onSelectedDateChange,
  onSave,
  userType = "patient"
}: AppointmentDialogProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [time, setTime] = useState("09:00");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [selectedProcedure, setSelectedProcedure] = useState<Procedure | null>(null);
  const [availableSlots, setAvailableSlots] = useState<Array<{from: string, to: string}>>([]);
  const [slotsLoaded, setSlotsLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingProcedures, setLoadingProcedures] = useState(false);
  const [note, setNote] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  // Fetch departments, doctors, and procedures when dialog opens
  useEffect(() => {
    if (open) {
      loadDepartments();
      loadProcedures();
      // Reset selections
      setSelectedDepartment(null);
      setSelectedDoctor(null);
      setSelectedProcedure(null);
      setAvailableSlots([]);
      setSlotsLoaded(false);
    }
  }, [open]);

  // Fetch doctors when department is selected
  useEffect(() => {
    if (selectedDepartment) {
      loadDoctors();
    } else {
      setDoctors([]);
      setSelectedDoctor(null);
    }
  }, [selectedDepartment]);

  useEffect(() => {
    if (appointment) {
      setTime(appointment.time);
      // For editing, try to find existing selections
      // Note: This is simplified - in production, you'd store IDs
      // Set email from user if available, otherwise keep existing or empty
      if (user?.email && !contactEmail) {
        setContactEmail(user.email);
      }
    } else {
      setTime("09:00");
      setNote("");
      // Set email from user if available
      if (user?.email) {
        setContactEmail(user.email);
      } else {
        setContactEmail("");
      }
    }
  }, [appointment, open, user]);

  const loadDepartments = async () => {
    setLoadingDepartments(true);
    try {
      const departmentsList = await getDepartments();
      setDepartments(departmentsList);
      if (departmentsList.length > 0 && !selectedDepartment) {
        setSelectedDepartment(departmentsList[0]);
      }
    } catch (error: any) {
      console.error("Failed to load departments:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load departments",
        variant: "destructive",
      });
    } finally {
      setLoadingDepartments(false);
    }
  };

  const loadProcedures = async () => {
    setLoadingProcedures(true);
    try {
      const proceduresList = await getProcedures();
      setProcedures(proceduresList);
      if (proceduresList.length > 0 && !selectedProcedure) {
        setSelectedProcedure(proceduresList[0]);
      }
    } catch (error: any) {
      console.error("Failed to load procedures:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load procedures",
        variant: "destructive",
      });
    } finally {
      setLoadingProcedures(false);
    }
  };

  const loadDoctors = async () => {
    setLoadingDoctors(true);
    try {
      const doctorsList = await getDoctors();
      if (doctorsList.length > 0) {
        setDoctors(doctorsList);
        if (!selectedDoctor) {
          setSelectedDoctor(doctorsList[0]);
        }
      } else {
        setDoctors([]);
        toast({
          title: "No doctors found",
          description: "No doctors available in the selected department.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Failed to load doctors:", error);
      setDoctors([]);
      toast({
        title: "Error",
        description: error.message || "Failed to load doctors",
        variant: "destructive",
      });
    } finally {
      setLoadingDoctors(false);
    }
  };

  const handleShowAvailableSlots = async () => {
    if (!selectedDate || !selectedDoctor || !selectedProcedure) {
      toast({
        title: "Validation Error",
        description: "Please select a date, doctor, and procedure first",
        variant: "destructive",
      });
      return;
    }
    
    setLoadingSlots(true);
    setSlotsLoaded(false);
    try {
      const fromDate = formatDateForQuery(selectedDate);
      const toDate = formatDateForQuery(new Date(selectedDate.getTime() + 7 * 24 * 60 * 60 * 1000)); // Next 7 days
      
      const slots = await getAvailableTimeSlots(selectedDoctor.id, { from: fromDate, to: toDate });
      console.log('[AppointmentDialog] Received slots from backend:', slots.length);
      console.log('[AppointmentDialog] Sample slots:', slots.slice(0, 3));
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
  };

  // Generate time slots from available slots for the selected date
  const getTimeSlotsForDate = () => {
    if (!selectedDate) return [];
    
    // Get the date string in YYYY-MM-DD format using local date components
    // This ensures we match the date the user actually selected, not affected by timezone
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    console.log('[AppointmentDialog] Selected date object:', selectedDate);
    console.log('[AppointmentDialog] Filtering slots for date (local):', dateStr);
    console.log('[AppointmentDialog] Available slots count:', availableSlots.length);
    if (availableSlots.length > 0) {
      console.log('[AppointmentDialog] Sample slot:', availableSlots[0]);
    }
    
    const slotsForDate = availableSlots.filter(slot => {
      // Backend returns ISO format like "2025-12-11T09:00" or "2025-12-11T09:00:00.000Z"
      // Extract just the date part (YYYY-MM-DD)
      const slotDate = slot.from.split('T')[0];
      const matches = slotDate === dateStr;
      if (matches) {
        console.log('[AppointmentDialog] Found matching slot:', slot);
      }
      return matches;
    });
    
    console.log('[AppointmentDialog] Slots for selected date:', slotsForDate.length);
    if (slotsForDate.length > 0) {
      console.log('[AppointmentDialog] First few matching slots:', slotsForDate.slice(0, 3));
    }
    
    // Convert to HH:mm format for display
    return slotsForDate.map(slot => {
      // Handle both "2025-12-11T09:00:00.000Z" and "2025-12-11T09:00" formats
      const timePart = slot.from.split('T')[1] || slot.from.split(' ')[1];
      return timePart ? timePart.substring(0, 5) : ''; // HH:mm
    }).filter(time => time).sort();
  };

  const handleSave = async () => {
    if (!selectedDate || !contactEmail || !selectedDoctor || !selectedDepartment || !selectedProcedure) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (department, doctor, procedure, date, email)",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Calculate slot start and end times
      const [hours, minutes] = time.split(':').map(Number);
      const slotStart = new Date(selectedDate);
      slotStart.setHours(hours, minutes, 0, 0);
      const slotEnd = new Date(slotStart);
      slotEnd.setMinutes(slotEnd.getMinutes() + (selectedProcedure?.duration || 30));

      if (appointment) {
        // Request update instead of direct update
        const updateMessage = `Request to update appointment: ${selectedDepartment.name}, ${selectedDoctor.name}, ${selectedProcedure.name}, ${slotStart.toLocaleDateString()} at ${time}`;
        
        await requestUpdate(
          appointment.id,
          updateMessage,
          slotStart.toISOString(),
          slotEnd.toISOString(),
          selectedDoctor.id,
          selectedProcedure.id,
          selectedDepartment.id
        );

        toast({
          title: "Update Requested",
          description: "Your update request has been sent to the doctor for approval.",
        });
        onOpenChange(false); // Close dialog after update request
      } else {
        // Create new reservation
        if (!user?.id) {
          toast({
            title: "Error",
            description: "You must be logged in to create an appointment",
            variant: "destructive",
          });
          return;
        }
        
              const result = await createReservation({
                patientId: user.id, // Use logged-in patient's ID
                departmentId: selectedDepartment.id,
                doctorId: selectedDoctor.id,
                procedureId: selectedProcedure.id,
                slotStart: slotStart.toISOString(),
                slotEnd: slotEnd.toISOString(),
                contactEmail: contactEmail,
                note: note || undefined,
                gdprConsent: true,
                medicalDataConsent: true,
              });

              // Convert backend response to frontend Appointment format
              const newAppointment: Appointment = {
                id: result.reservation.id,
                date: new Date(result.reservation.slotStart),
                time: time,
                doctorName: selectedDoctor.name,
                type: selectedProcedure?.name || "Appointment",
                status: result.reservation.status as "pending" | "confirmed" | "cancelled",
              };

        onSave(newAppointment);
        toast({
          title: "Success",
          description: "Appointment created successfully",
        });
      }

      onOpenChange(false);
    } catch (error: any) {
      console.error("Failed to save appointment:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save appointment",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col animate-fade-in-scale">
        <DialogHeader className="space-y-3 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <DialogTitle className="text-2xl">
              {appointment ? "Edit Appointment" : userType === "patient" ? "Request Appointment" : "New Appointment"}
            </DialogTitle>
          </div>
          <DialogDescription>
            {appointment ? "Update your appointment details" : "Fill in the details to schedule your appointment"}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4 overflow-y-auto flex-1 min-h-0">
          {/* Date Selection */}
          <div className="grid gap-3">
            <Label htmlFor="appointment-date" className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Selected Date <span className="text-destructive">*</span>
            </Label>
            <Input
              id="appointment-date"
              type="date"
              value={selectedDate ? selectedDate.toISOString().split('T')[0] : ''}
              onChange={(e) => {
                const newDate = e.target.value ? new Date(e.target.value) : null;
                if (newDate && onSelectedDateChange) {
                  onSelectedDateChange(newDate);
                }
              }}
              min={new Date().toISOString().split('T')[0]}
              className="p-3 rounded-lg bg-primary/10 border-2 border-primary/30 text-primary font-semibold"
              required
            />
            {selectedDate && (
              <p className="text-sm text-muted-foreground">
                {selectedDate.toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric"
                })}
              </p>
            )}
          </div>

          {/* Department Selection - Step 1 */}
          <div className="grid gap-3">
            <Label htmlFor="department" className="flex items-center gap-2">
              <Building className="w-4 h-4 text-primary" />
              Select Clinic/Department <span className="text-destructive">*</span>
              {loadingDepartments && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
            </Label>
            {loadingDepartments ? (
              <div className="text-sm text-muted-foreground py-4 text-center">
                Loading departments...
              </div>
            ) : departments.length === 0 ? (
              <div className="text-sm text-destructive py-4 text-center">
                No departments available
              </div>
            ) : (
              <Select 
                value={selectedDepartment?.id || ""} 
                onValueChange={(value) => {
                  const dept = departments.find(d => d.id === value);
                  if (dept) {
                    setSelectedDepartment(dept);
                    setSelectedDoctor(null); // Reset doctor when department changes
                    setAvailableSlots([]);
                    setSlotsLoaded(false);
                  }
                }}
              >
                <SelectTrigger id="department" className="h-12">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-muted-foreground" />
                    <SelectValue placeholder="Select a department" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id} className="py-3">
                      <div>
                        <div className="font-medium">{dept.name}</div>
                        <div className="text-xs text-muted-foreground">{dept.address}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Doctor Selection - Step 2 */}
          <div className="grid gap-3">
            <Label htmlFor="doctor" className="flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-primary" />
              Select Doctor <span className="text-destructive">*</span>
              {loadingDoctors && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
            </Label>
            {!selectedDepartment ? (
              <div className="text-sm text-muted-foreground py-4 text-center">
                Please select a department first
              </div>
            ) : loadingDoctors ? (
              <div className="text-sm text-muted-foreground py-4 text-center">
                Loading doctors...
              </div>
            ) : doctors.length === 0 ? (
              <div className="text-sm text-destructive py-4 text-center">
                No doctors available in this department
              </div>
            ) : (
              <Select 
                value={selectedDoctor?.id || ""} 
                onValueChange={(value) => {
                  const doctor = doctors.find(d => d.id === value);
                  if (doctor) {
                    setSelectedDoctor(doctor);
                    setAvailableSlots([]);
                    setSlotsLoaded(false);
                  }
                }}
              >
                <SelectTrigger id="doctor" className="h-12">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <SelectValue placeholder="Select a doctor" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {doctors.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id} className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        {doctor.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Contact Email */}
          <div className="grid gap-3">
            <Label htmlFor="email">
              Contact Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="your.email@example.com"
              required
            />
          </div>

          {/* Note */}
          <div className="grid gap-3">
            <Label htmlFor="note">Note (Optional)</Label>
            <Input
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Additional information..."
            />
          </div>

          {/* Procedure Selection - Step 3 */}
          <div className="grid gap-3">
            <Label htmlFor="procedure" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Select Medical Procedure <span className="text-destructive">*</span>
              {loadingProcedures && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
            </Label>
            {loadingProcedures ? (
              <div className="text-sm text-muted-foreground py-4 text-center">
                Loading procedures...
              </div>
            ) : procedures.length === 0 ? (
              <div className="text-sm text-destructive py-4 text-center">
                No procedures available
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {procedures.map((proc) => (
                  <button
                    key={proc.id}
                    type="button"
                    onClick={() => {
                      setSelectedProcedure(proc);
                      setAvailableSlots([]);
                      setSlotsLoaded(false);
                    }}
                    className={`
                      p-3 rounded-lg border-2 text-sm font-medium
                      transition-all duration-300 text-left
                      ${
                        selectedProcedure?.id === proc.id
                          ? "bg-primary text-primary-foreground border-primary shadow-lg scale-105"
                          : "bg-card border-border/70 hover:border-primary/50 hover:bg-accent/50 hover:scale-105 active:scale-95"
                      }
                    `}
                  >
                    {proc.name}
                    <span className="block text-xs opacity-75 mt-1">{proc.duration} min - {proc.price} CZK</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Show Available Slots Button - Step 4 */}
          {selectedDepartment && selectedDoctor && selectedProcedure && selectedDate && (
            <div className="grid gap-3">
              <Button
                type="button"
                onClick={handleShowAvailableSlots}
                disabled={loadingSlots}
                className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
              >
                {loadingSlots ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading slots...
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4 mr-2" />
                    Show Available Slots
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Time Selection with Visual Slots - Step 5 (only shown after clicking button) */}
          {slotsLoaded && (
            <div className="grid gap-3">
              <Label htmlFor="time" className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Select Time Slot <span className="text-destructive">*</span>
              </Label>
              <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                {getTimeSlotsForDate().length > 0 ? (
                  getTimeSlotsForDate().map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setTime(slot)}
                      className={`
                        p-3 rounded-lg border-2 text-sm font-medium
                        transition-all duration-300
                        ${
                          time === slot
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
                    No available time slots for this date. Please try another date.
                  </div>
                )}
              </div>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="mt-2"
              />
            </div>
          )}

          {/* Preview Badge */}
          {appointment && (
            <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Current Status:</span>
                <Badge variant={appointment.status === "confirmed" ? "default" : appointment.status === "pending" ? "secondary" : "destructive"}>
                  {appointment.status}
                </Badge>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter className="gap-2 flex-shrink-0 pt-4 border-t border-border/50">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={loading || loadingSlots || !slotsLoaded || getTimeSlotsForDate().length === 0}
            className="flex-1 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {appointment ? "Updating..." : "Creating..."}
              </>
            ) : (
              appointment ? "Update Appointment" : userType === "patient" ? "Request Appointment" : "Create Appointment"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
