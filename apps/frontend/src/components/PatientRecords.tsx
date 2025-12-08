import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Search, FileText, Calendar, Pill, Activity } from "lucide-react";
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

export const PatientRecords = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  
  const [patients] = useState<PatientRecord[]>([
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

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewDetails = (patient: PatientRecord) => {
    setSelectedPatient(patient);
    setDetailsOpen(true);
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
        <Button>Add New Patient</Button>
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
