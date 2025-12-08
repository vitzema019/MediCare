import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Phone, AlertTriangle, MapPin, Clock, Heart, Shield } from "lucide-react";
import medicalHero from "@/assets/medical-hero.jpg";

const Emergency = () => {
  const navigate = useNavigate();

  const emergencyNumbers = [
    {
      number: "911",
      label: "Emergency Services",
      description: "For life-threatening emergencies",
      color: "destructive"
    },
    {
      number: "1-800-273-8255",
      label: "Suicide Prevention",
      description: "National Suicide Prevention Lifeline",
      color: "primary"
    },
    {
      number: "1-800-222-1222",
      label: "Poison Control",
      description: "24/7 Poison Help Line",
      color: "secondary"
    }
  ];

  const emergencySteps = [
    {
      step: "1",
      title: "Assess the Situation",
      description: "Determine if this is a life-threatening emergency. If someone is unconscious, not breathing, or has severe bleeding, call 911 immediately."
    },
    {
      step: "2",
      title: "Call 911",
      description: "Stay calm and provide clear information: your location, what happened, and the condition of the person(s) involved."
    },
    {
      step: "3",
      title: "Follow Instructions",
      description: "Listen carefully to the dispatcher and follow their instructions. They are trained to help you until emergency services arrive."
    },
    {
      step: "4",
      title: "Stay with the Person",
      description: "If safe to do so, stay with the person until help arrives. Do not move someone who may have a spinal injury."
    }
  ];

  const warningSigns = [
    "Chest pain or pressure",
    "Difficulty breathing or shortness of breath",
    "Severe allergic reaction",
    "Unconsciousness or unresponsiveness",
    "Severe bleeding that won't stop",
    "Signs of stroke (sudden weakness, confusion, trouble speaking)",
    "Severe burns",
    "Suspected poisoning",
    "Severe head injury",
    "Seizures that don't stop"
  ];

  return (
    <div className="relative min-h-screen overflow-hidden">
      <Navbar />
      
      {/* Background Image */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat scale-105 transition-transform duration-700 ease-out"
        style={{ backgroundImage: `url(${medicalHero})` }}
      >
        {/* Multi-layer gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/90 to-background/85" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/10 via-transparent to-secondary/10" />
        <div className="absolute inset-0 backdrop-blur-[2px]" />
      </div>

      {/* Subtle pattern overlay */}
      <div className="fixed inset-0 opacity-[0.015] pointer-events-none" style={{
        backgroundImage: `radial-gradient(circle at 2px 2px, hsl(var(--foreground)) 1px, transparent 0)`,
        backgroundSize: '40px 40px'
      }} />

      {/* Animated gradient orbs for depth */}
      <div className="fixed top-20 right-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse opacity-50 pointer-events-none" />
      <div className="fixed bottom-20 left-20 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse opacity-50 pointer-events-none" style={{ animationDelay: "1s" }} />
      
      <div className="container mx-auto px-4 py-8 pt-24 relative z-10">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6 -ml-2 hover-lift"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Critical Alert */}
          <Card className="p-6 glass-dashboard border-2 border-destructive/50 bg-destructive/10 animate-fade-in-down">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-8 h-8 text-destructive flex-shrink-0" />
              <div>
                <h2 className="text-2xl font-bold text-destructive mb-2">Medical Emergency?</h2>
                <p className="text-foreground mb-4">
                  If you or someone else is experiencing a life-threatening emergency, call <strong>911</strong> immediately.
                </p>
                <Button size="lg" variant="destructive" className="w-full sm:w-auto">
                  <Phone className="mr-2 h-5 w-5" />
                  Call 911 Now
                </Button>
              </div>
            </div>
          </Card>

          {/* Header */}
          <div className="text-center space-y-4 animate-fade-in-down">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center">
                <Heart className="w-8 h-8 text-destructive" fill="currentColor" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-shimmer">Emergency Resources</h1>
            <p className="text-xl text-muted-foreground">
              Important information and resources for medical emergencies
            </p>
          </div>

          {/* Emergency Numbers */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Emergency Contact Numbers</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {emergencyNumbers.map((item, index) => (
                <Card
                  key={item.label}
                  className="p-6 glass-dashboard card-hover animate-fade-in-up border-l-4 border-l-destructive"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="text-center space-y-3">
                    <div className="text-3xl font-bold text-primary">{item.number}</div>
                    <div>
                      <h3 className="font-semibold mb-1">{item.label}</h3>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <Button variant="outline" size="sm" className="w-full">
                      <Phone className="mr-2 h-4 w-4" />
                      Call Now
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Warning Signs */}
          <Card className="p-6 glass-dashboard animate-fade-in-up">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-destructive" />
              <h2 className="text-2xl font-bold">When to Call 911</h2>
            </div>
            <p className="text-muted-foreground mb-4">
              Call 911 immediately if you or someone else experiences any of these warning signs:
            </p>
            <div className="grid md:grid-cols-2 gap-3">
              {warningSigns.map((sign, index) => (
                <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border/50">
                  <div className="w-2 h-2 rounded-full bg-destructive" />
                  <span className="text-sm">{sign}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Emergency Steps */}
          <div>
            <h2 className="text-2xl font-bold mb-4">What to Do in an Emergency</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {emergencySteps.map((step, index) => (
                <Card
                  key={step.step}
                  className="p-6 glass-dashboard card-hover animate-fade-in-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground font-bold flex-shrink-0">
                      {step.step}
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">{step.title}</h3>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Important Notes */}
          <Card className="p-6 glass-dashboard bg-gradient-to-br from-primary/10 via-accent/20 to-secondary/10 border-primary/30 animate-fade-in-up">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-bold">Important Notes</h2>
              </div>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span>Do not drive yourself to the hospital in a medical emergency. Call 911 for an ambulance.</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span>Keep important medical information (allergies, medications, conditions) easily accessible.</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span>If you're unsure whether it's an emergency, it's better to call 911 and let professionals decide.</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span>MediCare is for non-emergency appointments. For urgent care, contact your local urgent care center or emergency room.</span>
                </li>
              </ul>
            </div>
          </Card>

          {/* CTA */}
          <Card className="p-6 glass-dashboard animate-fade-in-up">
            <div className="text-center space-y-4">
              <h2 className="text-xl font-bold">For Non-Emergency Care</h2>
              <p className="text-muted-foreground">
                Need to schedule a regular appointment? Use our platform to book with healthcare providers.
              </p>
              <Button onClick={() => navigate("/")} size="lg">
                Book an Appointment
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Emergency;

