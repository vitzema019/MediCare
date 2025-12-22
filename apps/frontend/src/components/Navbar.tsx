import { Heart, Phone, Mail, User, LogOut, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface DoctorInfo {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
}

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [doctorInfo, setDoctorInfo] = useState<DoctorInfo | null>(null);
  const navigate = useNavigate();

  // Check for doctor info in localStorage
  useEffect(() => {
    const checkDoctor = () => {
      const storedDoctor = localStorage.getItem('currentDoctor');
      const doctorWithEmail = localStorage.getItem('doctor_user');
      
      if (storedDoctor) {
        try {
          const doctor = JSON.parse(storedDoctor);
          // Try to get email from doctor login response if available
          if (doctorWithEmail) {
            try {
              const fullDoctor = JSON.parse(doctorWithEmail);
              setDoctorInfo({ 
                id: doctor.id,
                firstName: doctor.firstName, 
                lastName: doctor.lastName,
                email: fullDoctor.email || doctor.email 
              });
            } catch {
              setDoctorInfo(doctor);
            }
          } else {
            setDoctorInfo(doctor);
          }
        } catch (error) {
          console.error("Failed to parse doctor from localStorage", error);
          setDoctorInfo(null);
        }
      } else {
        setDoctorInfo(null);
      }
    };

    checkDoctor();
    // Listen for storage changes (when doctor logs in/out in other tabs)
    window.addEventListener('storage', checkDoctor);
    // Also check periodically in case of same-tab changes
    const interval = setInterval(checkDoctor, 500);

    return () => {
      window.removeEventListener('storage', checkDoctor);
      clearInterval(interval);
    };
  }, []);

  const handleLogout = () => {
    if (isAuthenticated) {
      logout();
    } else if (doctorInfo) {
      // Doctor logout
      localStorage.removeItem('currentDoctor');
      localStorage.removeItem('doctor_user');
      setDoctorInfo(null);
    }
    navigate("/");
  };

  const isDoctorLoggedIn = !!doctorInfo;
  const displayUser = isAuthenticated ? user : (doctorInfo ? {
    firstName: doctorInfo.firstName,
    lastName: doctorInfo.lastName,
    email: doctorInfo.email || '',
  } : null);
  const isAnyUserLoggedIn = isAuthenticated || isDoctorLoggedIn;

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-strong border-b border-border/50 shadow-[var(--shadow-medium)] transition-all duration-300">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo with enhanced effects - clickable */}
          <Link 
            to="/" 
            onClick={handleLogoClick}
            className="flex items-center gap-2 group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-glow)] transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
              <Heart className="w-6 h-6 text-primary-foreground transition-transform duration-300 group-hover:scale-110" fill="currentColor" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-shimmer">
                MediCare
              </h1>
              <p className="text-xs text-muted-foreground -mt-1">Reservation System</p>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/about">About Us</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/services">Services</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/contact">
                <Phone className="w-4 h-4 mr-2" />
                Contact
              </Link>
            </Button>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            {!isAnyUserLoggedIn ? (
              <>
                <Button variant="ghost" size="sm" className="hidden sm:flex" asChild>
                  <Link to="/help">
                    <Mail className="w-4 h-4 mr-2" />
                    Help
                  </Link>
                </Button>
                <div className="h-6 w-px bg-border hidden sm:block" />
                <Button variant="outline" size="sm" asChild>
                  <Link to="/emergency">Emergency</Link>
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" className="hidden sm:flex" asChild>
                  <Link to="/help">
                    <Mail className="w-4 h-4 mr-2" />
                    Help
                  </Link>
                </Button>
                <div className="h-6 w-px bg-border hidden sm:block" />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 hover:bg-accent">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20">
                          <User className="h-4 w-4 text-primary" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="hidden md:block text-left">
                        <p className="text-sm font-medium">
                          {isDoctorLoggedIn ? 'Dr. ' : ''}{displayUser?.firstName} {displayUser?.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">{displayUser?.email}</p>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {isDoctorLoggedIn ? 'Dr. ' : ''}{displayUser?.firstName} {displayUser?.lastName}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {displayUser?.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
