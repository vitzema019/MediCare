import { UserRound, Stethoscope, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type UserRole = "patient" | "doctor" | "clinic";

interface RoleSelectorProps {
  onRoleSelect: (role: UserRole) => void;
}

const roleOptions = [
  {
    role: "patient" as UserRole,
    icon: UserRound,
    title: "Patient",
    description: "Book appointments and manage your health records",
  },
  {
    role: "doctor" as UserRole,
    icon: Stethoscope,
    title: "Doctor",
    description: "Manage appointments and patient consultations",
  },
  {
    role: "clinic" as UserRole,
    icon: Building2,
    title: "Clinic",
    description: "Oversee your clinic operations and staff",
  },
];

const RoleSelector = ({ onRoleSelect }: RoleSelectorProps) => {
  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      <div className="text-center mb-12 animate-fade-in-up">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-shimmer leading-tight">
          Medical Reservation System
        </h1>
        <p className="text-muted-foreground text-lg md:text-xl animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
          Select your role to continue
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        {roleOptions.map((option, index) => {
          const Icon = option.icon;
          return (
            <Card
              key={option.role}
              className="group relative overflow-hidden glass card-hover border-border/50 hover:border-primary/50 cursor-pointer animate-scale-in"
              style={{ animationDelay: `${index * 150}ms` }}
              onClick={() => onRoleSelect(option.role)}
            >
              {/* Animated background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]" />
              
              {/* Shimmer effect on hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]">
                <div className="shimmer absolute inset-0" />
              </div>

              <div className="relative p-8 flex flex-col items-center text-center space-y-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:shadow-[var(--shadow-glow)]">
                  <Icon className="w-10 h-10 text-primary transition-transform duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-110" />
                </div>
                <h3 className="text-2xl font-semibold group-hover:text-primary transition-colors duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]">{option.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {option.description}
                </p>
                <Button variant="hero" size="lg" className="w-full mt-4 ripple group-hover:shadow-[var(--shadow-glow)]">
                  Continue as {option.title}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default RoleSelector;
