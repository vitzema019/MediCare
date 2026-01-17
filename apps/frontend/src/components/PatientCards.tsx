import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { User, Edit, Save, Loader2, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getPatientCards, updatePatient, updatePatientCard, type PatientCard, type UpdatePatientCardDto, type UpdatePatientDto } from "@/lib/api";

interface PatientCardsProps {
  doctorId: string;
  refreshKey?: number;
}

export const PatientCards = ({ doctorId, refreshKey }: PatientCardsProps) => {
  const { toast } = useToast();
  const [patientCards, setPatientCards] = useState<PatientCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState<PatientCard | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [patientFirstName, setPatientFirstName] = useState("");
  const [patientLastName, setPatientLastName] = useState("");
  const [patientEmail, setPatientEmail] = useState("");
  const [patientPhoneNumber, setPatientPhoneNumber] = useState("");
  const [patientAddress, setPatientAddress] = useState("");
  const [medicalHistory, setMedicalHistory] = useState("");
  const [allergies, setAllergies] = useState("");
  const [currentMedications, setCurrentMedications] = useState("");
  const [notes, setNotes] = useState("");
  const [bloodType, setBloodType] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [emergencyContactRelationship, setEmergencyContactRelationship] = useState("");

  useEffect(() => {
    loadPatientCards();
  }, [doctorId, refreshKey]);

  const loadPatientCards = async () => {
    setLoading(true);
    try {
      const cards = await getPatientCards(doctorId);
      setPatientCards(cards);
    } catch (error: any) {
      console.error("Failed to load patient cards:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load patient cards",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (card: PatientCard) => {
    setSelectedCard(card);
    setPatientFirstName(card.patient.firstName || "");
    setPatientLastName(card.patient.lastName || "");
    setPatientEmail(card.patient.email || "");
    setPatientPhoneNumber(card.patient.phoneNumber || "");
    setPatientAddress(card.patient.address || "");
    setMedicalHistory(card.medicalHistory || "");
    setAllergies(card.allergies || "");
    setCurrentMedications(card.currentMedications || "");
    setNotes(card.notes || "");
    setBloodType(card.bloodType || "");
    setHeight(card.height?.toString() || "");
    setWeight(card.weight?.toString() || "");
    setEmergencyContactName(card.emergencyContact?.name || "");
    setEmergencyContactPhone(card.emergencyContact?.phone || "");
    setEmergencyContactRelationship(card.emergencyContact?.relationship || "");
    setEditDialogOpen(true);
  };

  const handleSave = async () => {
    if (!selectedCard) return;

    const trimmedFirstName = patientFirstName.trim();
    const trimmedLastName = patientLastName.trim();
    const trimmedEmail = patientEmail.trim();

    if (!trimmedFirstName || !trimmedLastName || !trimmedEmail) {
      toast({
        title: "Missing required fields",
        description: "First name, last name, and email are required.",
        variant: "destructive",
      });
      return;
    }

    const patientId = selectedCard.patient.id || selectedCard.patient._id;
    if (!patientId) {
      toast({
        title: "Error",
        description: "Patient ID is missing.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const patientUpdate: UpdatePatientDto = {
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
        email: trimmedEmail,
        phoneNumber: patientPhoneNumber.trim(),
        address: patientAddress.trim(),
      };

      const updateData: UpdatePatientCardDto = {
        medicalHistory: medicalHistory || undefined,
        allergies: allergies || undefined,
        currentMedications: currentMedications || undefined,
        notes: notes || undefined,
        bloodType: bloodType || undefined,
        height: height ? parseFloat(height) : undefined,
        weight: weight ? parseFloat(weight) : undefined,
        emergencyContact: emergencyContactName || emergencyContactPhone || emergencyContactRelationship
          ? {
              name: emergencyContactName,
              phone: emergencyContactPhone,
              relationship: emergencyContactRelationship,
            }
          : undefined,
      };

      await updatePatient(patientId, patientUpdate);
      await updatePatientCard(selectedCard.id, updateData);
      toast({
        title: "Success",
        description: "Patient card updated successfully",
      });
      setEditDialogOpen(false);
      loadPatientCards();
    } catch (error: any) {
      console.error("Failed to update patient card:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update patient card",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (patientCards.length === 0) {
    return (
      <Card className="p-8 text-center">
        <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">No patient cards yet. Patient cards will be created automatically when you confirm appointments.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {patientCards.map((card) => (
        <Card key={card.id} className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">
                  {card.patient.firstName} {card.patient.lastName}
                </h3>
                <p className="text-sm text-muted-foreground">{card.patient.email}</p>
                {card.patient.phoneNumber && (
                  <p className="text-sm text-muted-foreground">{card.patient.phoneNumber}</p>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEditClick(card)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {card.bloodType && (
              <div>
                <Label className="text-xs text-muted-foreground">Blood Type</Label>
                <p className="font-medium">{card.bloodType}</p>
              </div>
            )}
            {card.height && (
              <div>
                <Label className="text-xs text-muted-foreground">Height</Label>
                <p className="font-medium">{card.height} cm</p>
              </div>
            )}
            {card.weight && (
              <div>
                <Label className="text-xs text-muted-foreground">Weight</Label>
                <p className="font-medium">{card.weight} kg</p>
              </div>
            )}
            {card.allergies && (
              <div className="md:col-span-2">
                <Label className="text-xs text-muted-foreground">Allergies</Label>
                <p className="font-medium">{card.allergies}</p>
              </div>
            )}
            {card.currentMedications && (
              <div className="md:col-span-2">
                <Label className="text-xs text-muted-foreground">Current Medications</Label>
                <p className="font-medium">{card.currentMedications}</p>
              </div>
            )}
            {card.medicalHistory && (
              <div className="md:col-span-2">
                <Label className="text-xs text-muted-foreground">Medical History</Label>
                <p className="font-medium whitespace-pre-wrap">{card.medicalHistory}</p>
              </div>
            )}
            {card.notes && (
              <div className="md:col-span-2">
                <Label className="text-xs text-muted-foreground">Notes</Label>
                <p className="font-medium whitespace-pre-wrap">{card.notes}</p>
              </div>
            )}
            {card.emergencyContact && (
              <div className="md:col-span-2">
                <Label className="text-xs text-muted-foreground">Emergency Contact</Label>
                <p className="font-medium">
                  {card.emergencyContact.name} ({card.emergencyContact.relationship}) - {card.emergencyContact.phone}
                </p>
              </div>
            )}
          </div>

          {card.visitHistory && card.visitHistory.length > 0 && (
            <div className="mt-6 pt-4 border-t">
              <Label className="text-sm font-semibold mb-3 block">Visit History</Label>
              <div className="space-y-2">
                {card.visitHistory.map((visit, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 bg-muted/50 rounded">
                    <Calendar className="w-4 h-4 text-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {new Date(visit.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">{visit.procedure}</p>
                      {visit.notes && (
                        <p className="text-xs text-muted-foreground mt-1">{visit.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      ))}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-primary" />
              Edit Patient Card
            </DialogTitle>
            <DialogDescription>
              Update patient information for {selectedCard?.patient.firstName} {selectedCard?.patient.lastName}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            <div className="grid gap-3">
              <Label className="text-sm font-semibold">Patient Details</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="patientFirstName" className="text-xs">First Name</Label>
                  <Input
                    id="patientFirstName"
                    value={patientFirstName}
                    onChange={(e) => setPatientFirstName(e.target.value)}
                    placeholder="First name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="patientLastName" className="text-xs">Last Name</Label>
                  <Input
                    id="patientLastName"
                    value={patientLastName}
                    onChange={(e) => setPatientLastName(e.target.value)}
                    placeholder="Last name"
                  />
                </div>
                <div className="grid gap-2 col-span-2">
                  <Label htmlFor="patientEmail" className="text-xs">Email</Label>
                  <Input
                    id="patientEmail"
                    type="email"
                    value={patientEmail}
                    onChange={(e) => setPatientEmail(e.target.value)}
                    placeholder="Email"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="patientPhone" className="text-xs">Phone</Label>
                  <Input
                    id="patientPhone"
                    value={patientPhoneNumber}
                    onChange={(e) => setPatientPhoneNumber(e.target.value)}
                    placeholder="Phone"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="patientAddress" className="text-xs">Address</Label>
                  <Input
                    id="patientAddress"
                    value={patientAddress}
                    onChange={(e) => setPatientAddress(e.target.value)}
                    placeholder="Address"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-3">
              <Label htmlFor="medicalHistory">Medical History</Label>
              <Textarea
                id="medicalHistory"
                value={medicalHistory}
                onChange={(e) => setMedicalHistory(e.target.value)}
                placeholder="Enter medical history..."
                rows={4}
              />
            </div>

            <div className="grid gap-3">
              <Label htmlFor="allergies">Allergies</Label>
              <Input
                id="allergies"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                placeholder="Enter allergies..."
              />
            </div>

            <div className="grid gap-3">
              <Label htmlFor="currentMedications">Current Medications</Label>
              <Textarea
                id="currentMedications"
                value={currentMedications}
                onChange={(e) => setCurrentMedications(e.target.value)}
                placeholder="Enter current medications..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="grid gap-3">
                <Label htmlFor="bloodType">Blood Type</Label>
                <Input
                  id="bloodType"
                  value={bloodType}
                  onChange={(e) => setBloodType(e.target.value)}
                  placeholder="e.g., O+"
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="height">Height (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="170"
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="70"
                />
              </div>
            </div>

            <div className="grid gap-3">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes..."
                rows={3}
              />
            </div>

            <div className="grid gap-3 pt-4 border-t">
              <Label className="text-sm font-semibold">Emergency Contact</Label>
              <div className="grid grid-cols-3 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="emergencyName" className="text-xs">Name</Label>
                  <Input
                    id="emergencyName"
                    value={emergencyContactName}
                    onChange={(e) => setEmergencyContactName(e.target.value)}
                    placeholder="Name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="emergencyPhone" className="text-xs">Phone</Label>
                  <Input
                    id="emergencyPhone"
                    value={emergencyContactPhone}
                    onChange={(e) => setEmergencyContactPhone(e.target.value)}
                    placeholder="Phone"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="emergencyRelationship" className="text-xs">Relationship</Label>
                  <Input
                    id="emergencyRelationship"
                    value={emergencyContactRelationship}
                    onChange={(e) => setEmergencyContactRelationship(e.target.value)}
                    placeholder="Relationship"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
