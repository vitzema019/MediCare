import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  UserPlus, 
  Edit, 
  Trash2, 
  Power, 
  PowerOff, 
  Building2, 
  Stethoscope, 
  LogOut,
  Loader2,
  Search,
  X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navbar from "./Navbar";
import {
  getClinicDoctors,
  getDoctorsByDepartment,
  getClinicStatistics,
  createClinicDoctor,
  updateClinicDoctor,
  toggleDoctorStatus,
  deleteClinicDoctor,
  getTeams,
  createTeam,
  updateTeam,
  deleteTeam,
  addDoctorsToTeam,
  removeDoctorsFromTeam,
  type ClinicDoctor,
  type ClinicStatistics,
  type Team,
} from "@/lib/api";
import medicalHero from "@/assets/medical-hero.jpg";

interface ClinicDashboardProps {
  onLogout: () => void;
}

export const ClinicDashboard = ({ onLogout }: ClinicDashboardProps) => {
  const { toast } = useToast();
  const [doctors, setDoctors] = useState<ClinicDoctor[]>([]);
  const [doctorsByDepartment, setDoctorsByDepartment] = useState<Record<string, ClinicDoctor[]>>({});
  const [statistics, setStatistics] = useState<ClinicStatistics | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<ClinicDoctor | null>(null);
  const [createTeamDialogOpen, setCreateTeamDialogOpen] = useState(false);
  const [editTeamDialogOpen, setEditTeamDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamName, setTeamName] = useState("");
  const [teamDescription, setTeamDescription] = useState("");
  const [teamDepartment, setTeamDepartment] = useState("");
  const [teamScope, setTeamScope] = useState("");
  const [teamColor, setTeamColor] = useState("#3b82f6");
  const [selectedDoctorIds, setSelectedDoctorIds] = useState<string[]>([]);

  // Form states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [department, setDepartment] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [doctorsData, departmentData, stats, teamsData] = await Promise.all([
        getClinicDoctors(),
        getDoctorsByDepartment(),
        getClinicStatistics(),
        getTeams(),
      ]);

      setDoctors(doctorsData);
      setDoctorsByDepartment(departmentData);
      setStatistics(stats);
      setTeams(teamsData);
      
      // Debug: Log team structure to see doctor data
      if (teamsData.length > 0) {
        console.log('Teams data:', teamsData);
        if (teamsData[0].doctors && teamsData[0].doctors.length > 0) {
          console.log('First team doctors:', teamsData[0].doctors);
          console.log('First doctor structure:', teamsData[0].doctors[0]);
          console.log('First doctor keys:', Object.keys(teamsData[0].doctors[0] || {}));
        }
      }
    } catch (error: any) {
      console.error("Failed to load clinic data:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load clinic data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDoctor = async () => {
    if (!firstName || !lastName || !email || !password) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      await createClinicDoctor({
        firstName,
        lastName,
        email,
        password,
        specialty: specialty || undefined,
        department: department || undefined,
      });
      toast({
        title: "Success",
        description: "Doctor created successfully",
      });
      setCreateDialogOpen(false);
      resetForm();
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create doctor",
        variant: "destructive",
      });
    }
  };

  const handleEditDoctor = (doctor: ClinicDoctor) => {
    setSelectedDoctor(doctor);
    setFirstName(doctor.firstName);
    setLastName(doctor.lastName);
    setEmail(doctor.email);
    setSpecialty(doctor.specialty || "");
    setDepartment(doctor.department || "");
    setPhoneNumber(doctor.phoneNumber || "");
    setLicenseNumber(doctor.licenseNumber || "");
    setEditDialogOpen(true);
  };

  const handleUpdateDoctor = async () => {
    if (!selectedDoctor) return;

    try {
      await updateClinicDoctor(selectedDoctor._id || selectedDoctor.id, {
        firstName,
        lastName,
        email,
        specialty: specialty || undefined,
        department: department || undefined,
        phoneNumber: phoneNumber || undefined,
        licenseNumber: licenseNumber || undefined,
      });
      toast({
        title: "Success",
        description: "Doctor updated successfully",
      });
      setEditDialogOpen(false);
      resetForm();
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update doctor",
        variant: "destructive",
      });
    }
  };

  const handleToggleStatus = async (doctor: ClinicDoctor) => {
    try {
      await toggleDoctorStatus(doctor._id || doctor.id);
      toast({
        title: "Success",
        description: `Doctor ${doctor.active ? "deactivated" : "activated"} successfully`,
      });
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to toggle doctor status",
        variant: "destructive",
      });
    }
  };

  const handleDeleteDoctor = async (doctor: ClinicDoctor) => {
    if (!confirm(`Are you sure you want to delete ${doctor.firstName} ${doctor.lastName}?`)) {
      return;
    }

    try {
      await deleteClinicDoctor(doctor._id || doctor.id);
      toast({
        title: "Success",
        description: "Doctor deleted successfully",
      });
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete doctor",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPassword("");
    setSpecialty("");
    setDepartment("");
    setPhoneNumber("");
    setLicenseNumber("");
    setSelectedDoctor(null);
  };

  const filteredDoctors = doctors.filter((doctor) =>
    `${doctor.firstName} ${doctor.lastName} ${doctor.email} ${doctor.specialty || ""} ${doctor.department || ""}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundImage: `url(${medicalHero})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="bg-background/95 backdrop-blur-sm p-8 rounded-lg">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundImage: `url(${medicalHero})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="absolute inset-0 bg-background/95 backdrop-blur-sm" />
      <div className="relative z-10">
        <Navbar />
        
        <div className="container mx-auto px-4 py-8 pt-24">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Building2 className="w-8 h-8 text-primary" />
                Clinic Management
              </h1>
              <p className="text-muted-foreground mt-1">Manage your team, specialties, and departments</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setCreateDialogOpen(true)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Add Doctor
              </Button>
              <Button variant="outline" onClick={onLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="teams">Teams</TabsTrigger>
              <TabsTrigger value="all-doctors">All Doctors</TabsTrigger>
              <TabsTrigger value="by-department">By Department</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {statistics && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <Card className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Doctors</p>
                        <p className="text-2xl font-bold">{statistics.totalDoctors}</p>
                      </div>
                      <Users className="w-8 h-8 text-primary" />
                    </div>
                  </Card>
                  <Card className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Active Doctors</p>
                        <p className="text-2xl font-bold text-green-600">{statistics.activeDoctors}</p>
                      </div>
                      <Power className="w-8 h-8 text-green-600" />
                    </div>
                  </Card>
                  <Card className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Specialties</p>
                        <p className="text-2xl font-bold">{statistics.totalSpecialties}</p>
                      </div>
                      <Stethoscope className="w-8 h-8 text-primary" />
                    </div>
                  </Card>
                  <Card className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Departments</p>
                        <p className="text-2xl font-bold">{statistics.totalDepartments}</p>
                      </div>
                      <Building2 className="w-8 h-8 text-primary" />
                    </div>
                  </Card>
                  <Card className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Teams</p>
                        <p className="text-2xl font-bold">{statistics.totalTeams || 0}</p>
                      </div>
                      <Users className="w-8 h-8 text-primary" />
                    </div>
                  </Card>
                </div>
              )}

              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Specialties</h2>
                <div className="flex flex-wrap gap-2">
                  {statistics?.specialties.map((spec) => (
                    <Badge key={spec} variant="secondary" className="text-sm">
                      {spec}
                    </Badge>
                  ))}
                </div>
              </Card>

              {/* Teams Overview */}
              {teams.length > 0 && (
                <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Teams</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {teams.map((team) => (
                      <Card key={team.id || team._id} className="p-4" style={{ borderLeft: `4px solid ${team.color || '#3b82f6'}` }}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                              <div 
                                className="w-4 h-4 rounded-full" 
                                style={{ backgroundColor: team.color || '#3b82f6' }}
                              />
                              {team.name}
                            </h3>
                            {team.department && (
                              <p className="text-sm text-muted-foreground mt-1">Department: {team.department}</p>
                            )}
                            {team.scope && (
                              <p className="text-sm text-muted-foreground">Scope: {team.scope}</p>
                            )}
                            {team.description && (
                              <p className="text-sm text-muted-foreground mt-1">{team.description}</p>
                            )}
                            <Badge variant="secondary" className="mt-2">
                              {team.doctors?.length || 0} doctors
                            </Badge>
                          </div>
                        </div>
                        {team.doctors && team.doctors.length > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-xs font-semibold text-muted-foreground mb-2">Members:</p>
                            <div className="space-y-1.5">
                              {team.doctors.map((doctor, index) => {
                                const doctorId = doctor?._id || doctor?.id || doctor?.toString() || `doctor-${index}`;
                                
                                // Try multiple ways to access doctor name
                                let doctorName = 'Unknown Doctor';
                                if (doctor) {
                                  if (typeof doctor === 'object') {
                                    // Try direct properties
                                    if (doctor.firstName && doctor.lastName) {
                                      doctorName = `${doctor.firstName} ${doctor.lastName}`;
                                    } else if (doctor.firstName) {
                                      doctorName = doctor.firstName;
                                    } else if (doctor.lastName) {
                                      doctorName = doctor.lastName;
                                    } else if (doctor.name) {
                                      doctorName = doctor.name;
                                    }
                                  } else if (typeof doctor === 'string') {
                                    // If it's just an ID string, we can't get the name
                                    doctorName = `Doctor ID: ${doctor}`;
                                  }
                                }
                                
                                return (
                                  <div key={doctorId} className="flex items-center gap-2 text-sm">
                                    <span className="text-muted-foreground">•</span>
                                    <span className="font-medium">{doctorName}</span>
                                    {doctor?.specialty && (
                                      <Badge variant="outline" className="text-xs ml-1">
                                        {doctor.specialty}
                                      </Badge>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="teams" className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Teams</h2>
                <Button onClick={() => {
                  setTeamName("");
                  setTeamDescription("");
                  setTeamDepartment("");
                  setTeamScope("");
                  setTeamColor("#3b82f6");
                  setSelectedDoctorIds([]);
                  setCreateTeamDialogOpen(true);
                }}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Create Team
                </Button>
              </div>

              {teams.length === 0 ? (
                <Card className="p-8 text-center">
                  <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No teams created yet. Create your first team to organize doctors.</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {teams.map((team) => (
                    <Card key={team.id || team._id} className="p-4 relative" style={{ borderLeft: `4px solid ${team.color || '#3b82f6'}` }}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 pr-2">
                          <h3 className="font-semibold text-lg flex items-center gap-2">
                            <div 
                              className="w-4 h-4 rounded-full flex-shrink-0" 
                              style={{ backgroundColor: team.color || '#3b82f6' }}
                            />
                            {team.name}
                          </h3>
                          {team.department && (
                            <p className="text-sm text-muted-foreground mt-1">Department: {team.department}</p>
                          )}
                          {team.scope && (
                            <p className="text-sm text-muted-foreground">Scope: {team.scope}</p>
                          )}
                          {team.description && (
                            <p className="text-sm text-muted-foreground mt-1">{team.description}</p>
                          )}
                          <Badge variant="secondary" className="mt-2">
                            {team.doctors?.length || 0} doctors
                          </Badge>
                        </div>
                        <div className="flex gap-2 flex-shrink-0 ml-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-9 w-9 p-0 border-2 hover:bg-primary hover:text-primary-foreground"
                            title="Edit team"
                            onClick={() => {
                              setSelectedTeam(team);
                              setTeamName(team.name);
                              setTeamDescription(team.description || "");
                              setTeamDepartment(team.department || "");
                              setTeamScope(team.scope || "");
                              setTeamColor(team.color || "#3b82f6");
                              // Extract doctor IDs - handle both populated objects and ObjectId strings
                              const doctorIds = team.doctors?.map(d => {
                                if (typeof d === 'string') {
                                  return d;
                                }
                                return d?._id?.toString() || d?.id?.toString() || d?.toString();
                              }).filter(Boolean) || [];
                              setSelectedDoctorIds(doctorIds);
                              setEditTeamDialogOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-9 w-9 p-0 border-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                            title="Delete team"
                            onClick={async () => {
                              if (confirm(`Are you sure you want to delete ${team.name}?`)) {
                                try {
                                  await deleteTeam(team.id || team._id);
                                  toast({
                                    title: "Success",
                                    description: "Team deleted successfully",
                                  });
                                  loadData();
                                } catch (error: any) {
                                  toast({
                                    title: "Error",
                                    description: error.message || "Failed to delete team",
                                    variant: "destructive",
                                  });
                                }
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs font-semibold text-muted-foreground mb-2">Members:</p>
                        {team.doctors && team.doctors.length > 0 ? (
                          <div className="space-y-1.5">
                            {team.doctors.map((doctor, index) => {
                              // Debug: Log doctor structure
                              if (index === 0) {
                                console.log('Rendering doctor:', doctor);
                                console.log('Doctor type:', typeof doctor);
                                console.log('Doctor keys:', Object.keys(doctor || {}));
                              }
                              
                              const doctorId = doctor?._id || doctor?.id || doctor?.toString() || `doctor-${index}`;
                              
                              // Try multiple ways to access doctor name
                              let doctorName = 'Unknown Doctor';
                              if (doctor) {
                                if (typeof doctor === 'object') {
                                  // Try direct properties
                                  if (doctor.firstName && doctor.lastName) {
                                    doctorName = `${doctor.firstName} ${doctor.lastName}`;
                                  } else if (doctor.firstName) {
                                    doctorName = doctor.firstName;
                                  } else if (doctor.lastName) {
                                    doctorName = doctor.lastName;
                                  } else if (doctor.name) {
                                    doctorName = doctor.name;
                                  }
                                } else if (typeof doctor === 'string') {
                                  // If it's just an ID string, we can't get the name
                                  doctorName = `Doctor ID: ${doctor}`;
                                }
                              }
                              
                              return (
                                <div key={doctorId} className="flex items-center gap-2 text-sm">
                                  <span className="text-muted-foreground">•</span>
                                  <span className="font-medium">{doctorName}</span>
                                  {doctor?.specialty && (
                                    <Badge variant="outline" className="text-xs ml-1">
                                      {doctor.specialty}
                                    </Badge>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-2">No doctors assigned</p>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="all-doctors" className="space-y-4">
              <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search doctors..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                  {searchTerm && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2"
                      onClick={() => setSearchTerm("")}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDoctors.map((doctor) => (
                  <Card key={doctor._id || doctor.id} className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">
                          {doctor.firstName} {doctor.lastName}
                        </h3>
                        <p className="text-sm text-muted-foreground">{doctor.email}</p>
                        {doctor.specialty && (
                          <Badge variant="secondary" className="mt-2">
                            {doctor.specialty}
                          </Badge>
                        )}
                        {doctor.department && (
                          <Badge variant="outline" className="mt-2 ml-2">
                            {doctor.department}
                          </Badge>
                        )}
                      </div>
                      <Badge variant={doctor.active ? "default" : "destructive"}>
                        {doctor.active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditDoctor(doctor)}
                        className="flex-1"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleStatus(doctor)}
                      >
                        {doctor.active ? <PowerOff className="w-3 h-3" /> : <Power className="w-3 h-3" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteDoctor(doctor)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="by-department" className="space-y-4">
              {Object.entries(doctorsByDepartment).map(([deptName, deptDoctors]) => (
                <Card key={deptName} className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-primary" />
                      {deptName}
                    </h3>
                    <Badge>{deptDoctors.length} doctors</Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {deptDoctors.map((doctor) => (
                      <div key={doctor._id || doctor.id} className="p-3 bg-muted/50 rounded-lg">
                        <p className="font-medium">{doctor.firstName} {doctor.lastName}</p>
                        <p className="text-sm text-muted-foreground">{doctor.email}</p>
                        {doctor.specialty && (
                          <Badge variant="secondary" className="mt-2 text-xs">
                            {doctor.specialty}
                          </Badge>
                        )}
                        <div className="flex gap-2 mt-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditDoctor(doctor)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Create Doctor Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Doctor</DialogTitle>
            <DialogDescription>Create a new doctor account for your clinic</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john.doe@clinic.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="specialty">Specialty</Label>
              <Input
                id="specialty"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                placeholder="e.g., Cardiology"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g., Emergency"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateDialogOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleCreateDoctor}>Create Doctor</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Doctor Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Doctor</DialogTitle>
            <DialogDescription>Update doctor information</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="editFirstName">First Name</Label>
                <Input
                  id="editFirstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="editLastName">Last Name</Label>
                <Input
                  id="editLastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="editEmail">Email</Label>
              <Input
                id="editEmail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="editSpecialty">Specialty</Label>
              <Input
                id="editSpecialty"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                placeholder="e.g., Cardiology"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="editDepartment">Department</Label>
              <Input
                id="editDepartment"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g., Emergency"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="editPhone">Phone Number</Label>
              <Input
                id="editPhone"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1234567890"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="editLicense">License Number</Label>
              <Input
                id="editLicense"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                placeholder="License number"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditDialogOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleUpdateDoctor}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Team Dialog */}
      <Dialog open={createTeamDialogOpen} onOpenChange={setCreateTeamDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Team</DialogTitle>
            <DialogDescription>Organize doctors into teams for better management</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="teamName">Team Name *</Label>
              <Input
                id="teamName"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="e.g., Emergency Team"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="teamDescription">Description</Label>
              <Input
                id="teamDescription"
                value={teamDescription}
                onChange={(e) => setTeamDescription(e.target.value)}
                placeholder="Team description..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="teamDepartment">Department</Label>
              <Input
                id="teamDepartment"
                value={teamDepartment}
                onChange={(e) => setTeamDepartment(e.target.value)}
                placeholder="e.g., Department of North"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="teamScope">Scope</Label>
              <Input
                id="teamScope"
                value={teamScope}
                onChange={(e) => setTeamScope(e.target.value)}
                placeholder="e.g., Emergency, Surgery, Outpatient"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="teamColor">Team Color</Label>
              <div className="flex gap-2">
                <Input
                  id="teamColor"
                  type="color"
                  value={teamColor}
                  onChange={(e) => setTeamColor(e.target.value)}
                  className="w-20 h-10"
                />
                <Input
                  value={teamColor}
                  onChange={(e) => setTeamColor(e.target.value)}
                  placeholder="#3b82f6"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Select Doctors</Label>
              <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
                {doctors.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No doctors available</p>
                ) : (
                  <div className="space-y-2">
                    {doctors.map((doctor) => (
                      <div key={doctor._id || doctor.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`doctor-${doctor._id || doctor.id}`}
                          checked={selectedDoctorIds.includes(doctor._id || doctor.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedDoctorIds([...selectedDoctorIds, doctor._id || doctor.id]);
                            } else {
                              setSelectedDoctorIds(selectedDoctorIds.filter(id => id !== (doctor._id || doctor.id)));
                            }
                          }}
                          className="rounded"
                        />
                        <label htmlFor={`doctor-${doctor._id || doctor.id}`} className="flex-1 cursor-pointer">
                          <p className="font-medium">{doctor.firstName} {doctor.lastName}</p>
                          <p className="text-sm text-muted-foreground">{doctor.email}</p>
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setCreateTeamDialogOpen(false);
                setTeamName("");
                setTeamDescription("");
                setTeamDepartment("");
                setTeamScope("");
                setTeamColor("#3b82f6");
                setSelectedDoctorIds([]);
              }}>
              Cancel
            </Button>
            <Button onClick={async () => {
              if (!teamName) {
                toast({
                  title: "Validation Error",
                  description: "Team name is required",
                  variant: "destructive",
                });
                return;
              }
              try {
                // Filter out any empty or invalid doctor IDs
                const validDoctorIds = selectedDoctorIds.filter(id => id && id.trim() !== '');
                console.log('Creating team with doctor IDs:', validDoctorIds);
                await createTeam({
                  name: teamName,
                  description: teamDescription || undefined,
                  department: teamDepartment || undefined,
                  scope: teamScope || undefined,
                  doctorIds: validDoctorIds,
                  color: teamColor,
                });
                toast({
                  title: "Success",
                  description: "Team created successfully",
                });
                setCreateTeamDialogOpen(false);
                setTeamName("");
                setTeamDescription("");
                setTeamDepartment("");
                setTeamScope("");
                setTeamColor("#3b82f6");
                setSelectedDoctorIds([]);
                await loadData();
              } catch (error: any) {
                console.error('Failed to create team:', error);
                toast({
                  title: "Error",
                  description: error.message || "Failed to create team",
                  variant: "destructive",
                });
              }
            }}>
              Create Team
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Team Dialog */}
      <Dialog open={editTeamDialogOpen} onOpenChange={setEditTeamDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Team</DialogTitle>
            <DialogDescription>Update team information and members</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="editTeamName">Team Name *</Label>
              <Input
                id="editTeamName"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="editTeamDescription">Description</Label>
              <Input
                id="editTeamDescription"
                value={teamDescription}
                onChange={(e) => setTeamDescription(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="editTeamDepartment">Department</Label>
              <Input
                id="editTeamDepartment"
                value={teamDepartment}
                onChange={(e) => setTeamDepartment(e.target.value)}
                placeholder="e.g., Department of North"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="editTeamScope">Scope</Label>
              <Input
                id="editTeamScope"
                value={teamScope}
                onChange={(e) => setTeamScope(e.target.value)}
                placeholder="e.g., Emergency, Surgery, Outpatient"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="editTeamColor">Team Color</Label>
              <div className="flex gap-2">
                <Input
                  id="editTeamColor"
                  type="color"
                  value={teamColor}
                  onChange={(e) => setTeamColor(e.target.value)}
                  className="w-20 h-10"
                />
                <Input
                  value={teamColor}
                  onChange={(e) => setTeamColor(e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Select Doctors</Label>
              <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
                {doctors.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No doctors available</p>
                ) : (
                  <div className="space-y-2">
                    {doctors.map((doctor) => (
                      <div key={doctor._id || doctor.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`edit-doctor-${doctor._id || doctor.id}`}
                          checked={selectedDoctorIds.includes(doctor._id || doctor.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedDoctorIds([...selectedDoctorIds, doctor._id || doctor.id]);
                            } else {
                              setSelectedDoctorIds(selectedDoctorIds.filter(id => id !== (doctor._id || doctor.id)));
                            }
                          }}
                          className="rounded"
                        />
                        <label htmlFor={`edit-doctor-${doctor._id || doctor.id}`} className="flex-1 cursor-pointer">
                          <p className="font-medium">{doctor.firstName} {doctor.lastName}</p>
                          <p className="text-sm text-muted-foreground">{doctor.email}</p>
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setEditTeamDialogOpen(false);
              setSelectedTeam(null);
              setTeamName("");
              setTeamDescription("");
              setTeamDepartment("");
              setTeamScope("");
              setTeamColor("#3b82f6");
              setSelectedDoctorIds([]);
            }}>
              Cancel
            </Button>
            <Button onClick={async () => {
              if (!selectedTeam || !teamName) {
                toast({
                  title: "Validation Error",
                  description: "Team name is required",
                  variant: "destructive",
                });
                return;
              }
              try {
                // Filter out any empty or invalid doctor IDs
                const validDoctorIds = selectedDoctorIds.filter(id => id && id.trim() !== '');
                console.log('Updating team with doctor IDs:', validDoctorIds);
                await updateTeam(selectedTeam.id || selectedTeam._id, {
                  name: teamName,
                  description: teamDescription || undefined,
                  department: teamDepartment || undefined,
                  scope: teamScope || undefined,
                  doctorIds: validDoctorIds,
                  color: teamColor,
                });
                toast({
                  title: "Success",
                  description: "Team updated successfully",
                });
                setEditTeamDialogOpen(false);
                setSelectedTeam(null);
                setTeamName("");
                setTeamDescription("");
                setTeamDepartment("");
                setTeamScope("");
                setTeamColor("#3b82f6");
                setSelectedDoctorIds([]);
                // Reload data to get updated team with populated doctors
                await loadData();
              } catch (error: any) {
                console.error('Failed to update team:', error);
                toast({
                  title: "Error",
                  description: error.message || "Failed to update team",
                  variant: "destructive",
                });
              }
            }}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
