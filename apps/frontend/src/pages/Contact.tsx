import { useNavigate } from "react-router-dom";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Phone, Mail, MapPin, Clock, Send, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import medicalHero from "@/assets/medical-hero.jpg";

const Contact = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false);
      toast({
        title: "Message sent!",
        description: "We'll get back to you within 24 hours.",
      });
      setFormData({ name: "", email: "", subject: "", message: "" });
    }, 1000);
  };

  const contactInfo = [
    {
      icon: Phone,
      title: "Phone",
      content: "+1 (555) 123-4567",
      subtitle: "Mon-Fri 9am-6pm EST"
    },
    {
      icon: Mail,
      title: "Email",
      content: "support@medicare.com",
      subtitle: "We reply within 24 hours"
    },
    {
      icon: MapPin,
      title: "Address",
      content: "123 Healthcare Ave",
      subtitle: "Medical District, NY 10001"
    },
    {
      icon: Clock,
      title: "Business Hours",
      content: "Monday - Friday",
      subtitle: "9:00 AM - 6:00 PM EST"
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
          {/* Header with Image */}
          <div className="text-center space-y-4 animate-fade-in-down">
            <div className="relative w-full h-48 md:h-64 rounded-2xl overflow-hidden shadow-xl mb-6 group">
              <img 
                src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1200&h=600&fit=crop&q=80" 
                alt="Contact our healthcare team"
                className="w-full h-full object-cover image-hover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/70 to-transparent" />
              <div className="absolute bottom-6 left-0 right-0">
                <h1 className="text-4xl md:text-5xl font-bold text-shimmer">Contact Us</h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto mt-2">
                  Have questions? We're here to help. Get in touch with our team.
                </p>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Contact Form */}
            <Card className="p-8 glass-dashboard animate-fade-in-up">
              <h2 className="text-2xl font-bold mb-6">Send us a Message</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="How can we help?"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Tell us more about your inquiry..."
                    rows={6}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                  {isSubmitting ? (
                    "Sending..."
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            </Card>

            {/* Contact Information */}
            <div className="space-y-6">
              <Card className="p-8 glass-dashboard animate-fade-in-up">
                <h2 className="text-2xl font-bold mb-6">Get in Touch</h2>
                <div className="space-y-6">
                  {contactInfo.map((info, index) => {
                    const Icon = info.icon;
                    return (
                      <div key={info.title} className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-1">{info.title}</h3>
                          <p className="text-foreground">{info.content}</p>
                          <p className="text-sm text-muted-foreground mt-1">{info.subtitle}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Office Location Image */}
              <Card className="p-0 glass-dashboard overflow-hidden animate-fade-in-up group" style={{ animationDelay: "0.1s" }}>
                <div className="relative h-48 w-full">
                  <img 
                    src="https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=800&h=600&fit=crop&q=80" 
                    alt="MediCare office location"
                    className="w-full h-full object-cover image-hover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex items-center gap-2 text-foreground">
                      <MapPin className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-semibold">123 Healthcare Ave</p>
                        <p className="text-sm text-muted-foreground">Medical District, NY 10001</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6 glass-dashboard bg-gradient-to-br from-primary/10 via-accent/20 to-secondary/10 border-primary/30">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Emergency Support</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      For urgent medical emergencies, please call 911 or visit your nearest emergency room.
                    </p>
                    <Button variant="outline" size="sm" onClick={() => navigate("/emergency")}>
                      Emergency Resources
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;

