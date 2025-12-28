import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Search, FileText, Calendar, Pill, Activity, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface PatientRecord {
  id: string;
  name: string;
  age: number;
  bloodType: string;
  lastVisit: Date;
  conditions: string[];
  medications: string[];
  allergies: string[];
}

function makeId() {
  // Works in modern browsers; fallback for older envs
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c: any = globalThis as any;
  return typeof c.crypto?.randomUUID === "function"
      ? c.crypto.randomUUID()
      : String(Date.now());
}

function parseCommaList(value: string) {
  return value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
}

export const PatientRecords = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const [patients, setPatients] = useState<PatientRecord[]>([
    {
      id: "1",
      name: "John Doe",
      age: 45,
      bloodType: "A+",
      lastVisit: new Date(2025, 0, 20),
      conditions: ["Hypertension", "Type 2 Diabetes"],
      medications: ["Metformin", "Lisinopril"],
      allergies: ["Penicillin"]
    },
    {
      id: "2",
      name: "Jane Smith",
      age: 32,
      bloodType: "O-",
      lastVisit: new Date(2025, 0, 25),
      conditions: ["Asthma"],
      medications: ["Albuterol"],
      allergies: []
    },
    {
      id: "3",
      name: "Bob Johnson",
      age: 58,
      bloodType: "B+",
      lastVisit: new Date(2025, 0, 15),
      conditions: ["Arthritis"],
      medications: ["Ibuprofen"],
      allergies: ["Aspirin"]
    }
  ]);

  const [notes, setNotes] = useState("");

  const [addOpen, setAddOpen] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [newPatient, setNewPatient] = useState({
    name: "",
    age: "",
    bloodType: "",
    conditions: "",
    medications: "",
    allergies: "",
  });

  const filteredPatients = useMemo(() => {
    const t = searchTerm.toLowerCase().trim();
    if (!t) return patients;
    return patients.filter((p) => p.name.toLowerCase().includes(t));
  }, [patients, searchTerm]);

  const handleViewDetails = (patient: PatientRecord) => {
    setSelectedPatient(patient);
    setDetailsOpen(true);
  };

  const resetAddForm = () => {
    setAddError(null);
    setNewPatient({
      name: "",
      age: "",
      bloodType: "",
      conditions: "",
      medications: "",
      allergies: "",
    });
  };

  const handleCreatePatient = () => {
    setAddError(null);

    const name = newPatient.name.trim();
    const ageNum = Number(newPatient.age);

    if (!name) {
      setAddError("Name is required.");
      return;
    }
    if (!Number.isFinite(ageNum) || ageNum <= 0) {
      setAddError("Age must be a positive number.");
      return;
    }
    if (!newPatient.bloodType.trim()) {
      setAddError("Blood type is required.");
      return;
    }

    const record: PatientRecord = {
      id: makeId(),
      name,
      age: ageNum,
      bloodType: newPatient.bloodType.trim(),
      lastVisit: new Date(), // default to today
      conditions: parseCommaList(newPatient.conditions),
      medications: parseCommaList(newPatient.medications),
      allergies: parseCommaList(newPatient.allergies),
    };

    setPatients((prev) => [record, ...prev]); // add to top
    setAddOpen(false);
    resetAddForm();
    setSearchTerm(""); // optional: clear search so they see it
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search patients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
          <Button onClick={() => { resetAddForm(); setAddOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add New Patient
          </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredPatients.map((patient) => (
          <Card key={patient.id} className="p-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{patient.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {patient.age} years • {patient.bloodType}
                  </p>
                </div>
                <Badge variant="outline">
                  {patient.conditions.length} conditions
                </Badge>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Last visit: {patient.lastVisit.toLocaleDateString()}
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

              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleViewDetails(patient)}
              >
                <FileText className="h-4 w-4 mr-2" />
                View Full Record
              </Button>
            </div>
          </Card>
        ))}
      </div>

        <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>Add New Patient</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {addError && (
                        <div className="text-sm text-destructive border border-destructive/30 bg-destructive/10 rounded-md p-3">
                            {addError}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full name</Label>
                            <Input
                                id="name"
                                value={newPatient.name}
                                onChange={(e) => setNewPatient((p) => ({ ...p, name: e.target.value }))}
                                placeholder="e.g. Maria Novak"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="age">Age</Label>
                            <Input
                                id="age"
                                type="number"
                                min={0}
                                value={newPatient.age}
                                onChange={(e) => setNewPatient((p) => ({ ...p, age: e.target.value }))}
                                placeholder="e.g. 34"
                            />
                        </div>

                        <div className="space-y-2 col-span-2">
                            <Label htmlFor="bloodType">Blood type</Label>
                            <Input
                                id="bloodType"
                                value={newPatient.bloodType}
                                onChange={(e) => setNewPatient((p) => ({ ...p, bloodType: e.target.value }))}
                                placeholder="e.g. A+, O-, B+"
                            />
                        </div>

                        <div className="space-y-2 col-span-2">
                            <Label htmlFor="conditions">Conditions (comma-separated)</Label>
                            <Input
                                id="conditions"
                                value={newPatient.conditions}
                                onChange={(e) => setNewPatient((p) => ({ ...p, conditions: e.target.value }))}
                                placeholder="e.g. Asthma, Hypertension"
                            />
                        </div>

                        <div className="space-y-2 col-span-2">
                            <Label htmlFor="medications">Medications (comma-separated)</Label>
                            <Input
                                id="medications"
                                value={newPatient.medications}
                                onChange={(e) => setNewPatient((p) => ({ ...p, medications: e.target.value }))}
                                placeholder="e.g. Metformin, Lisinopril"
                            />
                        </div>

                        <div className="space-y-2 col-span-2">
                            <Label htmlFor="allergies">Allergies (comma-separated)</Label>
                            <Input
                                id="allergies"
                                value={newPatient.allergies}
                                onChange={(e) => setNewPatient((p) => ({ ...p, allergies: e.target.value }))}
                                placeholder="e.g. Penicillin"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setAddOpen(false);
                                resetAddForm();
                            }}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleCreatePatient}>Create Patient</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedPatient?.name}'s Medical Record</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="medications">Medications</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Age</Label>
                  <p className="text-lg">{selectedPatient?.age} years</p>
                </div>
                <div>
                  <Label>Blood Type</Label>
                  <p className="text-lg">{selectedPatient?.bloodType}</p>
                </div>
              </div>

              <div>
                <Label>Current Conditions</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedPatient?.conditions.map((condition, i) => (
                    <Badge key={i} variant="secondary">{condition}</Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label>Allergies</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedPatient?.allergies.length === 0 ? (
                    <p className="text-muted-foreground">No known allergies</p>
                  ) : (
                    selectedPatient?.allergies.map((allergy, i) => (
                      <Badge key={i} variant="destructive">{allergy}</Badge>
                    ))
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="medications" className="space-y-4">
              <div>
                <Label>Current Medications</Label>
                <div className="space-y-2 mt-2">
                  {selectedPatient?.medications.map((med, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                      <Pill className="h-4 w-4 text-muted-foreground" />
                      <span>{med}</span>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <ScrollArea className="h-[300px]">
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <p className="font-semibold">Regular Checkup</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedPatient?.lastVisit.toLocaleDateString()}
                    </p>
                    <p className="text-sm mt-2">Patient reported feeling well. Vital signs normal.</p>
                  </div>
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
                />
              </div>
              <Button>Save Notes</Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
};
