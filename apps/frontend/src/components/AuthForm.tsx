import { useState } from "react";
import { ArrowLeft, Mail, Lock, User, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { registerPatient, loginPatient, registerDoctor, loginDoctor, type Patient, type Doctor } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

type UserRole = "patient" | "doctor" | "clinic";

interface AuthFormProps {
  role: UserRole;
  onBack: () => void;
  onLogin: (role: UserRole, doctorInfo?: { id: string; firstName: string; lastName: string; email?: string }) => void;
}

const roleLabels = {
  patient: "Patient",
  doctor: "Doctor",
  clinic: "Clinic",
};

const AuthForm = ({ role, onBack, onLogin }: AuthFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent, isSignUp: boolean) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(e.target as HTMLFormElement);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      if (isSignUp && role === "patient") {
        // Registration
        const name = formData.get("name") as string;
        const nameParts = name.split(" ");
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";

        if (!firstName || !lastName) {
          setError("Please enter your full name");
          setIsLoading(false);
          return;
        }

        const patient = await registerPatient({
          firstName,
          lastName,
          email,
          password,
        });

        login(patient);
        toast({
          title: "Account created",
          description: "Your account has been successfully created!",
        });
        onLogin(role);
      } else if (!isSignUp && role === "patient") {
        // Login
        const patient = await loginPatient({ email, password });
        login(patient);
        toast({
          title: "Welcome back!",
          description: `Welcome back, ${patient.firstName}!`,
        });
        onLogin(role);
      } else if (isSignUp && role === "doctor") {
        // Doctor registration
        const name = formData.get("name") as string;
        const nameParts = name.split(" ");
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";

        if (!firstName || !lastName) {
          setError("Please enter your full name");
          setIsLoading(false);
          return;
        }

        const doctor = await registerDoctor({
          firstName,
          lastName,
          email,
          password,
        });

        // Store full doctor info including email
        localStorage.setItem('doctor_user', JSON.stringify(doctor));
        toast({
          title: "Account created",
          description: "Your doctor account has been successfully created!",
        });
        onLogin(role, { id: doctor.id, firstName: doctor.firstName, lastName: doctor.lastName, email: doctor.email });
      } else if (!isSignUp && role === "doctor") {
        // Doctor login
        const doctor = await loginDoctor({ email, password });
        // Store full doctor info including email
        localStorage.setItem('doctor_user', JSON.stringify(doctor));
        toast({
          title: "Welcome back!",
          description: `Welcome back, Dr. ${doctor.firstName}!`,
        });
        onLogin(role, { id: doctor.id, firstName: doctor.firstName, lastName: doctor.lastName, email: doctor.email });
      } else {
        // For clinic, keep the old behavior for now
        if (email === "john@example.com" && password === "admin123") {
          onLogin(role);
        } else {
          setError("Invalid credentials. Use: john@example.com / admin123");
        }
      }
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
      toast({
        title: "Error",
        description: err.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 animate-fade-in-up">
      <Button
        variant="ghost"
        onClick={onBack}
        className="mb-6 -ml-2 hover-lift"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to role selection
      </Button>

      <Card className="glass-strong border-border/50 shadow-[var(--shadow-medium)] hover:shadow-[var(--shadow-glow)] transition-all duration-300">
        <div className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2 text-shimmer">
              {roleLabels[role]} Portal
            </h2>
            <p className="text-muted-foreground">
              Sign in or create your account
            </p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4">
                {error && (
                  <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                    {error}
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-email"
                      name="email"
                      type="email"
                      placeholder="john@example.com"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-password"
                      name="password"
                      type="password"
                      placeholder="admin123"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                  size="lg"
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>

                <div className="text-center">
                  <Button variant="link" className="text-sm">
                    Forgot password?
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={(e) => handleSubmit(e, true)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">
                    {role === "clinic" ? "Clinic Name" : "Full Name"}
                  </Label>
                  <div className="relative">
                    {role === "clinic" ? (
                      <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    ) : (
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    )}
                    <Input
                      id="signup-name"
                      name="name"
                      type="text"
                      placeholder={role === "clinic" ? "Clinic name" : "John Doe"}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      placeholder="your@email.com"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                  size="lg"
                >
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  By signing up, you agree to our Terms of Service and Privacy
                  Policy
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </Card>
    </div>
  );
};

export default AuthForm;
