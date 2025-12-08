import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Calendar, Clock, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AppointmentDialog, Appointment } from "./AppointmentDialog";
import { useToast } from "@/hooks/use-toast";
import { getDoctors, type Doctor as ApiDoctor } from "@/lib/api";

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  reviews: number;
  location: string;
  availability: string;
  experience: string;
  bio: string;
  reviewsList: { author: string; rating: number; comment: string; date: string }[];
}

// Helper function to convert API doctor to display format
const convertApiDoctorToDisplay = (apiDoctor: ApiDoctor, index: number): Doctor => {
  // Use placeholder data for fields not in the backend
  const specialties = ["General Practitioner", "Internal Medicine", "Family Medicine", "Cardiologist", "Dermatologist"];
  const locations = ["Main Medical Center", "City Clinic", "Health Center", "Medical Plaza"];
  
  return {
    id: apiDoctor.id,
    name: apiDoctor.name,
    specialty: specialties[index % specialties.length] || "General Practitioner",
    rating: 4.5 + (index % 3) * 0.1, // Vary ratings between 4.5-4.7
    reviews: 50 + index * 25, // Vary review counts
    location: locations[index % locations.length] || "Medical Center",
    availability: "Mon-Fri, 9:00 AM - 5:00 PM",
    experience: `${5 + index * 2} years`,
    bio: `Experienced ${apiDoctor.name} providing quality healthcare services.`,
    reviewsList: [
      { author: "Patient A.", rating: 5, comment: "Professional and caring doctor.", date: "2024-03-15" },
      { author: "Patient B.", rating: 4, comment: "Good experience overall.", date: "2024-03-10" },
    ],
  };
};

export const DoctorBrowse = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [showAppointmentDialog, setShowAppointmentDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { toast } = useToast();

  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    setLoading(true);
    try {
      const apiDoctors = await getDoctors();
      const displayDoctors = apiDoctors.map((apiDoctor, index) => 
        convertApiDoctorToDisplay(apiDoctor, index)
      );
      setDoctors(displayDoctors);
    } catch (error: any) {
      console.error("Failed to load doctors:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load doctors",
        variant: "destructive",
      });
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBookAppointment = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setShowAppointmentDialog(true);
  };

  // Create a mock appointment with the selected doctor to pre-select them in the dialog
  const appointmentForSelectedDoctor: Appointment | null = selectedDoctor ? {
    id: "",
    date: selectedDate,
    time: "09:00",
    doctorName: selectedDoctor.name,
    type: "General Consultation",
    status: "pending",
  } : null;

  const handleCloseDetails = () => {
    setSelectedDoctor(null);
  };

  const handleSaveAppointment = (appointment: Appointment) => {
    toast({
      title: "Appointment booked",
      description: `Your appointment with ${selectedDoctor?.name} has been scheduled.`,
    });
    setShowAppointmentDialog(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Browse Doctors & Clinics</h2>
        <p className="text-muted-foreground">Find the right healthcare professional for your needs</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading doctors...</span>
        </div>
      ) : doctors.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No doctors available at the moment.</p>
          <p className="text-sm text-muted-foreground mt-2">Please check back later or contact support.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doctor) => (
          <Card key={doctor.id} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-start justify-between">
                <span>{doctor.name}</span>
                <Badge variant="secondary">{doctor.specialty}</Badge>
              </CardTitle>
              <CardDescription className="space-y-2">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{doctor.rating}</span>
                  <span className="text-muted-foreground">({doctor.reviews} reviews)</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4" />
                  <span>{doctor.location}</span>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-2 text-sm">
                <Clock className="w-4 h-4 mt-0.5 text-muted-foreground" />
                <span className="text-muted-foreground">{doctor.availability}</span>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setSelectedDoctor(doctor)} variant="outline" className="flex-1">
                  View Details
                </Button>
                <Button onClick={() => handleBookAppointment(doctor)} className="flex-1">
                  <Calendar className="w-4 h-4 mr-2" />
                  Book
                </Button>
              </div>
            </CardContent>
          </Card>
          ))}
        </div>
      )}

      {/* Doctor Details Dialog */}
      <Dialog open={!!selectedDoctor && !showAppointmentDialog} onOpenChange={handleCloseDetails}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedDoctor && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedDoctor.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-lg px-4 py-1">
                    {selectedDoctor.specialty}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium text-lg">{selectedDoctor.rating}</span>
                    <span className="text-muted-foreground">({selectedDoctor.reviews} reviews)</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-muted-foreground" />
                    <span>{selectedDoctor.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                    <span>{selectedDoctor.availability}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Experience:</span>
                    <span>{selectedDoctor.experience}</span>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">About</h3>
                  <p className="text-muted-foreground">{selectedDoctor.bio}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-4">Patient Reviews</h3>
                  <div className="space-y-4">
                    {selectedDoctor.reviewsList.map((review, index) => (
                      <Card key={index}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between mb-2">
                            <span className="font-medium">{review.author}</span>
                            <div className="flex items-center gap-1">
                              {Array.from({ length: review.rating }).map((_, i) => (
                                <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{review.comment}</p>
                          <span className="text-xs text-muted-foreground">{review.date}</span>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <Button onClick={() => handleBookAppointment(selectedDoctor)} className="w-full" size="lg">
                  <Calendar className="w-4 h-4 mr-2" />
                  Book Appointment
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Appointment Dialog */}
      <AppointmentDialog
        open={showAppointmentDialog}
        onOpenChange={(open) => {
          setShowAppointmentDialog(open);
          if (!open) {
            // Reset selected date when dialog closes
            setSelectedDate(new Date());
          }
        }}
        appointment={appointmentForSelectedDoctor}
        selectedDate={selectedDate}
        onSelectedDateChange={setSelectedDate}
        onSave={handleSaveAppointment}
        userType="patient"
      />
    </div>
  );
};
