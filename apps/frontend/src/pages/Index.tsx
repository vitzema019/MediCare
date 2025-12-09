import { useState, useEffect } from "react";
import RoleSelector from "@/components/RoleSelector";
import AuthForm from "@/components/AuthForm";
import Navbar from "@/components/Navbar";
import PatientDashboard from "@/components/PatientDashboard";
import DoctorDashboard from "@/components/DoctorDashboard";
import { ClinicDashboard } from "@/components/ClinicDashboard";
import { useAuth } from "@/contexts/AuthContext";
import medicalHero from "@/assets/medical-hero.jpg";

type UserRole = "patient" | "doctor" | "clinic" | null;

const Index = () => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(null);
  const { isAuthenticated, logout } = useAuth();
  const [doctorLoggedIn, setDoctorLoggedIn] = useState(false);
  const [currentDoctor, setCurrentDoctor] = useState<{ id: string; firstName: string; lastName: string; email?: string } | null>(null);

  // Auto-redirect to dashboard if already logged in
  useEffect(() => {
    if (isAuthenticated && !selectedRole) {
      setSelectedRole("patient");
    }
  }, [isAuthenticated, selectedRole]);

  const handleLogin = (role: UserRole, doctorInfo?: { id: string; firstName: string; lastName: string; email?: string }) => {
    if (role === "patient") {
      // Patient login is handled by AuthContext
      setSelectedRole(role);
    } else {
      // Doctor/clinic login
      setDoctorLoggedIn(true);
      setSelectedRole(role);
      if (doctorInfo) {
        setCurrentDoctor(doctorInfo);
        localStorage.setItem('currentDoctor', JSON.stringify(doctorInfo));
      }
    }
  };

  const handleLogout = () => {
    if (selectedRole === "patient") {
      logout();
    } else {
      setDoctorLoggedIn(false);
      setCurrentDoctor(null);
      localStorage.removeItem('currentDoctor');
    }
    setSelectedRole(null);
  };

  // Load doctor from localStorage on mount
  useEffect(() => {
    const storedDoctor = localStorage.getItem('currentDoctor');
    if (storedDoctor) {
      try {
        const doctor = JSON.parse(storedDoctor);
        setCurrentDoctor(doctor);
        setDoctorLoggedIn(true);
        setSelectedRole("doctor");
      } catch (error) {
        console.error("Failed to parse doctor from localStorage", error);
        localStorage.removeItem('currentDoctor');
      }
    }
  }, []);

  if ((isAuthenticated || doctorLoggedIn) && selectedRole === "patient") {
    return <PatientDashboard onLogout={handleLogout} />;
  }

  if (doctorLoggedIn && selectedRole === "doctor") {
    return <DoctorDashboard onLogout={handleLogout} doctorId={currentDoctor?.id || ""} />;
  }

  if (doctorLoggedIn && selectedRole === "clinic") {
    return <ClinicDashboard onLogout={handleLogout} />;
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <div className="relative min-h-screen flex items-center justify-center pt-16">
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

        {/* Content */}
        <div className="relative z-10 w-full py-12">
          {selectedRole ? (
            <AuthForm role={selectedRole} onBack={() => setSelectedRole(null)} onLogin={handleLogin} />
          ) : (
            <RoleSelector onRoleSelect={setSelectedRole} />
          )}
        </div>

        {/* Enhanced Decorative Elements */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 via-secondary/50 to-transparent opacity-60" />
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent opacity-30" />
      </div>
    </div>
  );
};

export default Index;
