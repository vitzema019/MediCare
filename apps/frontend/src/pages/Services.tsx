import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Stethoscope, Calendar, FileText, MessageSquare, Clock, User, Building } from "lucide-react";
import medicalHero from "@/assets/medical-hero.jpg";

const Services = () => {
  const navigate = useNavigate();

  const services = [
    {
      icon: Calendar,
      title: "Appointment Scheduling",
      description: "Book, reschedule, or cancel appointments with ease. Get instant confirmations and reminders.",
      features: ["Real-time availability", "Automated reminders", "Easy rescheduling", "Multi-doctor support"]
    },
    {
      icon: FileText,
      title: "Medical Records",
      description: "Access and manage your medical history securely. View prescriptions, test results, and more.",
      features: ["Secure storage", "Easy access", "Complete history", "Downloadable reports"]
    },
    {
      icon: MessageSquare,
      title: "Direct Messaging",
      description: "Communicate directly with your healthcare providers. Get answers to your questions quickly.",
      features: ["Secure messaging", "Quick responses", "File sharing", "Message history"]
    },
    {
      icon: Stethoscope,
      title: "Doctor Directory",
      description: "Browse and find the right healthcare provider for your needs. Read reviews and specialties.",
      features: ["Comprehensive profiles", "Specialty search", "Ratings & reviews", "Availability check"]
    },
    {
      icon: Clock,
      title: "Virtual Consultations",
      description: "Connect with doctors remotely through secure video consultations from the comfort of your home.",
      features: ["HD video calls", "Secure platform", "Screen sharing", "Recording option"]
    },
    {
      icon: Building,
      title: "Clinic Management",
      description: "For healthcare providers - manage your practice, staff, and patient flow efficiently.",
      features: ["Staff management", "Schedule optimization", "Patient analytics", "Billing integration"]
    }
  ];

  const plans = [
    {
      name: "Patient",
      icon: User,
      description: "Perfect for individuals seeking healthcare services",
      features: ["Unlimited appointments", "Medical records access", "Direct messaging", "24/7 support"],
      price: "Free"
    },
    {
      name: "Doctor",
      icon: Stethoscope,
      description: "For healthcare providers managing their practice",
      features: ["Patient management", "Schedule optimization", "Analytics dashboard", "Priority support"],
      price: "Custom"
    },
    {
      name: "Clinic",
      icon: Building,
      description: "Complete solution for clinics and medical facilities",
      features: ["Multi-provider support", "Advanced analytics", "Custom integrations", "Dedicated support"],
      price: "Custom"
    }
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

        <div className="max-w-6xl mx-auto space-y-12">
          {/* Header */}
          <div className="text-center space-y-4 animate-fade-in-down">
            <h1 className="text-4xl md:text-5xl font-bold text-shimmer">Our Services</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive healthcare management solutions for patients, doctors, and clinics
            </p>
          </div>

          {/* Services Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => {
              const Icon = service.icon;
              return (
                <Card
                  key={service.title}
                  className="p-6 glass-dashboard card-hover animate-fade-in-up border-l-4 border-l-primary"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">{service.title}</h3>
                      <p className="text-muted-foreground text-sm mb-4">{service.description}</p>
                    </div>
                    <ul className="space-y-2">
                      {service.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Plans Section */}
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-2">Choose Your Plan</h2>
              <p className="text-muted-foreground">Select the plan that best fits your needs</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {plans.map((plan, index) => {
                const Icon = plan.icon;
                return (
                  <Card
                    key={plan.name}
                    className="p-6 glass-dashboard card-hover animate-fade-in-up"
                    style={{ animationDelay: `${index * 150}ms` }}
                  >
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold">{plan.name}</h3>
                          <p className="text-2xl font-bold text-primary mt-1">{plan.price}</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{plan.description}</p>
                      <ul className="space-y-2 pt-4 border-t border-border/50">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-center gap-2 text-sm">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <Button className="w-full mt-4" variant={index === 1 ? "default" : "outline"}>
                        Get Started
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* CTA Section */}
          <Card className="p-8 glass-dashboard bg-gradient-to-br from-primary/10 via-accent/20 to-secondary/10 border-primary/30 animate-fade-in-up">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold">Have Questions?</h2>
              <p className="text-muted-foreground">
                Our team is here to help you find the perfect solution
              </p>
              <div className="flex gap-4 justify-center pt-4">
                <Button onClick={() => navigate("/contact")} size="lg">
                  Contact Us
                </Button>
                <Button onClick={() => navigate("/help")} variant="outline" size="lg">
                  Get Help
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Services;

