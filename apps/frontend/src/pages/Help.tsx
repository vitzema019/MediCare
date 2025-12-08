import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, HelpCircle, BookOpen, MessageCircle, Video, FileText, ChevronRight, Calendar } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import medicalHero from "@/assets/medical-hero.jpg";

const Help = () => {
  const navigate = useNavigate();

  const faqs = [
    {
      question: "How do I book an appointment?",
      answer: "To book an appointment, select your role (Patient, Doctor, or Clinic) on the homepage, sign in or create an account, then browse available doctors and select a date and time that works for you."
    },
    {
      question: "Can I reschedule or cancel my appointment?",
      answer: "Yes! You can reschedule or cancel appointments directly from your dashboard. Simply click on the appointment and select the option to reschedule or cancel."
    },
    {
      question: "How do I access my medical records?",
      answer: "Once logged in as a patient, navigate to your dashboard where you'll find a section for medical records. You can view, download, and share your records securely."
    },
    {
      question: "Is my information secure?",
      answer: "Absolutely. We use industry-standard encryption and security measures to protect your personal and medical information. All data is stored securely and complies with healthcare privacy regulations."
    },
    {
      question: "How do I contact my doctor?",
      answer: "You can message your doctor directly through the messaging system in your dashboard. Click on the 'Messages' button to start a conversation."
    },
    {
      question: "What if I need urgent medical care?",
      answer: "For medical emergencies, please call 911 immediately or visit your nearest emergency room. Our platform is for non-emergency appointments and consultations."
    },
    {
      question: "Can I use this platform on my mobile device?",
      answer: "Yes! MediCare is fully responsive and works on all devices including smartphones and tablets. You can access all features from any device with an internet connection."
    },
    {
      question: "How do I update my profile information?",
      answer: "Go to your dashboard and click on your profile card. From there, you can edit your personal information, contact details, and preferences."
    }
  ];

  const helpCategories = [
    {
      icon: BookOpen,
      title: "Getting Started",
      description: "Learn the basics of using MediCare",
      count: "5 articles"
    },
    {
      icon: Calendar,
      title: "Appointments",
      description: "Everything about booking and managing appointments",
      count: "8 articles"
    },
    {
      icon: FileText,
      title: "Medical Records",
      description: "How to access and manage your records",
      count: "4 articles"
    },
    {
      icon: MessageCircle,
      title: "Messaging",
      description: "Communicate with your healthcare providers",
      count: "3 articles"
    },
    {
      icon: Video,
      title: "Video Consultations",
      description: "Guide to virtual appointments",
      count: "6 articles"
    },
    {
      icon: HelpCircle,
      title: "Account & Settings",
      description: "Manage your account and preferences",
      count: "7 articles"
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

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4 animate-fade-in-down">
            <h1 className="text-4xl md:text-5xl font-bold text-shimmer">Help Center</h1>
            <p className="text-xl text-muted-foreground">
              Find answers to common questions and learn how to use MediCare
            </p>
          </div>

          {/* Search */}
          <Card className="p-6 glass-dashboard animate-fade-in-up">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search for help articles..."
                className="pl-10 h-12"
              />
            </div>
          </Card>

          {/* Help Categories */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Browse by Category</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {helpCategories.map((category, index) => {
                const Icon = category.icon;
                return (
                  <Card
                    key={category.title}
                    className="p-6 glass-dashboard card-hover cursor-pointer animate-fade-in-up border-l-4 border-l-primary"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{category.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{category.description}</p>
                        <p className="text-xs text-muted-foreground">{category.count}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* FAQ Section */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
            <Card className="p-6 glass-dashboard animate-fade-in-up">
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`} className="border-b border-border/50">
                    <AccordionTrigger className="text-left font-semibold hover:no-underline">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pt-2">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </Card>
          </div>

          {/* Contact Support */}
          <Card className="p-8 glass-dashboard bg-gradient-to-br from-primary/10 via-accent/20 to-secondary/10 border-primary/30 animate-fade-in-up">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold">Still Need Help?</h2>
              <p className="text-muted-foreground">
                Can't find what you're looking for? Our support team is here to help.
              </p>
              <div className="flex gap-4 justify-center pt-4">
                <Button onClick={() => navigate("/contact")} size="lg">
                  Contact Support
                </Button>
                <Button onClick={() => navigate("/")} variant="outline" size="lg">
                  Go to Homepage
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Help;

