import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Heart, Users, Award, Shield, Clock } from "lucide-react";
import medicalHero from "@/assets/medical-hero.jpg";

const About = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Clock,
      title: "24/7 Availability",
      description: "Book appointments anytime, anywhere with our round-the-clock service."
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your health data is protected with industry-leading security measures."
    },
    {
      icon: Users,
      title: "Expert Doctors",
      description: "Access to a network of qualified and experienced healthcare professionals."
    },
    {
      icon: Award,
      title: "Quality Care",
      description: "Committed to providing the highest standard of medical care."
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

        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header with Hero Image */}
          <div className="text-center space-y-6 animate-fade-in-down">
            <div className="relative w-full h-64 md:h-80 rounded-2xl overflow-hidden shadow-xl group">
              <img 
                src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=1200&h=600&fit=crop&q=80" 
                alt="Modern healthcare facility"
                className="w-full h-full object-cover image-hover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/50 to-transparent" />
              <div className="absolute bottom-6 left-0 right-0">
                <div className="flex justify-center mb-4">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg ring-4 ring-background/50">
                    <Heart className="w-10 h-10 text-primary-foreground" fill="currentColor" />
                  </div>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-shimmer">About MediCare</h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto mt-2">
                  Your trusted partner in healthcare management and appointment scheduling
                </p>
              </div>
            </div>
          </div>

          {/* Mission Section with Image */}
          <div className="grid md:grid-cols-2 gap-6 items-center">
            <Card className="p-8 glass-dashboard animate-fade-in-up">
              <h2 className="text-2xl font-bold mb-4 text-primary">Our Mission</h2>
              <p className="text-muted-foreground leading-relaxed text-lg">
                At MediCare, we believe that healthcare should be accessible, convenient, and personalized. 
                Our mission is to bridge the gap between patients and healthcare providers through innovative 
                technology that simplifies appointment scheduling, medical record management, and communication.
              </p>
              <p className="text-muted-foreground leading-relaxed text-lg mt-4">
                We are committed to improving the healthcare experience for everyone, making it easier for 
                patients to find the right care at the right time, and helping healthcare providers deliver 
                exceptional service to their patients.
              </p>
            </Card>
            <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden shadow-lg animate-fade-in-up group" style={{ animationDelay: "0.1s" }}>
              <img 
                src="https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=800&h=600&fit=crop&q=80" 
                alt="Healthcare professionals working together"
                className="w-full h-full object-cover image-hover"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20" />
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={feature.title}
                  className="p-6 glass-dashboard card-hover animate-fade-in-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Values Section with Image */}
          <div className="grid md:grid-cols-2 gap-6 items-center">
            <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden shadow-lg animate-fade-in-up order-2 md:order-1 group">
              <img 
                src="https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=600&fit=crop&q=80" 
                alt="Modern medical technology"
                className="w-full h-full object-cover image-hover"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-secondary/20 to-primary/20" />
            </div>
            <Card className="p-8 glass-dashboard animate-fade-in-up order-1 md:order-2">
              <h2 className="text-2xl font-bold mb-6 text-primary">Our Values</h2>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                  <h3 className="font-semibold mb-2">Compassion</h3>
                  <p className="text-sm text-muted-foreground">
                    We care deeply about the well-being of every patient and provider in our community.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                  <h3 className="font-semibold mb-2">Innovation</h3>
                  <p className="text-sm text-muted-foreground">
                    We continuously improve our platform to meet the evolving needs of healthcare.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                  <h3 className="font-semibold mb-2">Integrity</h3>
                  <p className="text-sm text-muted-foreground">
                    We maintain the highest standards of privacy, security, and ethical conduct.
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* CTA Section */}
          <Card className="p-8 glass-dashboard bg-gradient-to-br from-primary/10 via-accent/20 to-secondary/10 border-primary/30 animate-fade-in-up">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold">Ready to Get Started?</h2>
              <p className="text-muted-foreground">
                Join thousands of patients and healthcare providers who trust MediCare
              </p>
              <div className="flex gap-4 justify-center pt-4">
                <Button onClick={() => navigate("/")} size="lg">
                  Book an Appointment
                </Button>
                <Button onClick={() => navigate("/contact")} variant="outline" size="lg">
                  Contact Us
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default About;

