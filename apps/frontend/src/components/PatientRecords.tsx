import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Search, FileText, Calendar, Pill, Activity, Loader2, UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  createPatientCard,
  getPatientCards,
  getPatients,
  updatePatientCard,
  type Patient,
  type PatientCard,
} from "@/lib/api";

interface PatientRecord {
  patientId: string;
  cardId?: string;
  hasCard: boolean;
  name: string;
  email: string;
  phoneNumber?: string;
  address?: string;
  bloodType?: string;
  lastVisit?: Date;
  conditions: string[];
  medications: string[];
  allergies: string[];
  notes?: string;
  visitHistory: Array<{
    date: string;
    procedure: string;
    notes?: string;
    reservationId: string;
  }>;
}

function splitList(value?: string): string[] {
  if (!value) return [];
  return value
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getLastVisit(card?: PatientCard): Date | undefined {
  if (!card) return undefined;
  const visits = card.visitHistory || [];
  if (visits.length > 0) {
    const latest = visits.reduce((acc, visit) => {
      const date = new Date(visit.date);
      return date > acc ? date : acc;
    }, new Date(visits[0].date));
    return latest;
  }

  if (card.updatedAt) return new Date(card.updatedAt);
  if (card.createdAt) return new Date(card.createdAt);
  return undefined;
}

function mapPatientRecord(patient: Patient, card?: PatientCard): PatientRecord {
  return {
    patientId: patient.id,
    cardId: card?.id,
    hasCard: Boolean(card),
    name: `${patient.firstName} ${patient.lastName}`.trim(),
    email: patient.email,
    phoneNumber: patient.phoneNumber,
    address: patient.address,
    bloodType: card?.bloodType,
    lastVisit: getLastVisit(card),
    conditions: splitList(card?.medicalHistory),
    medications: splitList(card?.currentMedications),
    allergies: splitList(card?.allergies),
    notes: card?.notes,
    visitHistory: card?.visitHistory || [],
  };
}

interface PatientRecordsProps {
  doctorId: string;
}

type FilterMode = "all" | "with-card";

export const PatientRecords = ({ doctorId }: PatientRecordsProps) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [creatingPatientId, setCreatingPatientId] = useState<string | null>(null);

  const loadPatientRecords = async () => {
    if (!doctorId) return;
    setLoading(true);
    try {
      const [patientsData, cardsData] = await Promise.all([
        getPatients(),
        getPatientCards(doctorId),
      ]);

      const cardsByPatient = new Map<string, PatientCard>();
      cardsData.forEach((card) => {
        if (card.patient.id) {
          cardsByPatient.set(card.patient.id, card);
        }
      });

      const records = patientsData.map((patient) =>
        mapPatientRecord(patient, cardsByPatient.get(patient.id))
      );
      setPatients(records);
    } catch (error: any) {
      console.error("Failed to load patient records:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load patient records",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatientRecords();
  }, [doctorId]);

  useEffect(() => {
    setNotes(selectedPatient?.notes || "");
  }, [selectedPatient]);

  const filteredPatients = useMemo(() => {
    const t = searchTerm.toLowerCase().trim();
    let list = patients;

    if (filterMode === "with-card") {
      list = list.filter((p) => p.hasCard);
    }

    if (!t) return list;
    return list.filter((p) =>
      p.name.toLowerCase().includes(t) || p.email.toLowerCase().includes(t)
    );
  }, [patients, searchTerm, filterMode]);

  const handleViewDetails = (patient: PatientRecord) => {
    setSelectedPatient(patient);
    setDetailsOpen(true);
  };

  const handleCreateCard = async (patientId: string) => {
    if (!doctorId) return;
    setCreatingPatientId(patientId);
    try {
      await createPatientCard({ doctorId, patientId });
      toast({
        title: "Success",
        description: "Patient card created",
      });
      await loadPatientRecords();
    } catch (error: any) {
      console.error("Failed to create patient card:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create patient card",
        variant: "destructive",
      });
    } finally {
      setCreatingPatientId(null);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedPatient?.cardId) {
      toast({
        title: "No patient card",
        description: "Create a patient card before adding notes.",
        variant: "destructive",
      });
      return;
    }

    setSavingNotes(true);
    try {
      await updatePatientCard(selectedPatient.cardId, { notes });
      setPatients((prev) =>
        prev.map((patient) =>
          patient.cardId === selectedPatient.cardId
            ? { ...patient, notes }
            : patient
        )
      );
      setSelectedPatient((prev) => (prev ? { ...prev, notes } : prev));
      toast({
        title: "Success",
        description: "Notes updated successfully",
      });
    } catch (error: any) {
      console.error("Failed to update notes:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update notes",
        variant: "destructive",
      });
    } finally {
      setSavingNotes(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search patients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={filterMode === "all" ? "default" : "outline"}
            onClick={() => setFilterMode("all")}
          >
            All patients
          </Button>
          <Button
            variant={filterMode === "with-card" ? "default" : "outline"}
            onClick={() => setFilterMode("with-card")}
          >
            With card
          </Button>
        </div>
      </div>

      {filteredPatients.length === 0 ? (
        <Card className="p-8 text-center">
          <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            {filterMode === "with-card"
              ? "No patients with cards yet."
              : "No patients found."}
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPatients.map((patient) => (
            <Card key={patient.patientId} className="p-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{patient.name}</h3>
                    <p className="text-sm text-muted-foreground">{patient.email}</p>
                    {patient.bloodType && (
                      <p className="text-sm text-muted-foreground">
                        Blood type: {patient.bloodType}
                      </p>
                    )}
                  </div>
                  {patient.hasCard ? (
                    <Badge variant="outline">
                      {patient.conditions.length} conditions
                    </Badge>
                  ) : (
                    <Badge variant="secondary">No card</Badge>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Last visit:{" "}
                    {patient.lastVisit
                      ? patient.lastVisit.toLocaleDateString()
                      : "No visits"}
                  </div>

                  {patient.conditions.length > 0 && (
                    <div className="flex items-start gap-2">
                      <Activity className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-muted-foreground mb-1">Conditions:</p>
                        <div className="flex flex-wrap gap-1">
                          {patient.conditions.map((condition, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {condition}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {patient.hasCard ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleViewDetails(patient)}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    View Full Record
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <Button
                      className="w-full"
                      onClick={() => handleCreateCard(patient.patientId)}
                      disabled={creatingPatientId === patient.patientId}
                    >
                      {creatingPatientId === patient.patientId ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Create card
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => handleViewDetails(patient)}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {selectedPatient?.name}
              {selectedPatient?.hasCard ? "'s Medical Record" : " Details"}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="medications">Medications</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {!selectedPatient?.hasCard && (
                <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                  This patient does not have a card yet. Create one to start tracking medical data.
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Email</Label>
                  <p className="text-lg break-all">{selectedPatient?.email}</p>
                </div>
                <div>
                  <Label>Blood Type</Label>
                  <p className="text-lg">{selectedPatient?.bloodType || "Not set"}</p>
                </div>
                {selectedPatient?.phoneNumber && (
                  <div>
                    <Label>Phone</Label>
                    <p className="text-lg">{selectedPatient.phoneNumber}</p>
                  </div>
                )}
                {selectedPatient?.address && (
                  <div>
                    <Label>Address</Label>
                    <p className="text-lg">{selectedPatient.address}</p>
                  </div>
                )}
              </div>

              <div>
                <Label>Current Conditions</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedPatient?.conditions.length ? (
                    selectedPatient.conditions.map((condition, i) => (
                      <Badge key={i} variant="secondary">{condition}</Badge>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No recorded conditions</p>
                  )}
                </div>
              </div>

              <div>
                <Label>Allergies</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedPatient?.allergies.length ? (
                    selectedPatient.allergies.map((allergy, i) => (
                      <Badge key={i} variant="destructive">{allergy}</Badge>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No known allergies</p>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="medications" className="space-y-4">
              <div>
                <Label>Current Medications</Label>
                <div className="space-y-2 mt-2">
                  {selectedPatient?.medications.length ? (
                    selectedPatient.medications.map((med, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                        <Pill className="h-4 w-4 text-muted-foreground" />
                        <span>{med}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No medications recorded</p>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <ScrollArea className="h-[300px]">
                <div className="space-y-4">
                  {selectedPatient?.visitHistory.length ? (
                    selectedPatient.visitHistory.map((visit) => (
                      <div key={visit.reservationId} className="p-4 border rounded-lg">
                        <p className="font-semibold">{visit.procedure}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(visit.date).toLocaleDateString()}
                        </p>
                        {visit.notes && (
                          <p className="text-sm mt-2">{visit.notes}</p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No visit history available.</p>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="notes" className="space-y-4">
              <div>
                <Label>Doctor's Notes</Label>
                <Textarea
                  placeholder="Add notes about this patient..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[200px] mt-2"
                  disabled={!selectedPatient?.hasCard}
                />
              </div>
              <Button
                onClick={handleSaveNotes}
                disabled={savingNotes || !selectedPatient?.hasCard}
              >
                {savingNotes ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Notes"
                )}
              </Button>
              {!selectedPatient?.hasCard && selectedPatient?.patientId && (
                <Button
                  variant="outline"
                  onClick={() => handleCreateCard(selectedPatient.patientId)}
                  disabled={creatingPatientId === selectedPatient.patientId}
                >
                  {creatingPatientId === selectedPatient.patientId ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create patient card"
                  )}
                </Button>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
};
