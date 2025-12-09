import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";
import medicalHero from "@/assets/medical-hero.jpg";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

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
        <div className="max-w-2xl mx-auto">
          <Card className="p-12 glass-dashboard text-center space-y-6 animate-fade-in-up">
            <div className="text-8xl font-bold text-primary/20">404</div>
            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-bold text-shimmer">Page Not Found</h1>
              <p className="text-muted-foreground text-lg">
                Oops! The page you're looking for doesn't exist or has been moved.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button onClick={() => navigate("/")} size="lg">
                <Home className="mr-2 h-4 w-4" />
                Go to Homepage
              </Button>
              <Button onClick={() => navigate(-1)} variant="outline" size="lg">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
            </div>
            <div className="pt-8 border-t border-border/50">
              <p className="text-sm text-muted-foreground mb-4">Popular pages:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                <Button variant="ghost" size="sm" onClick={() => navigate("/about")}>
                  About
                </Button>
                <Button variant="ghost" size="sm" onClick={() => navigate("/services")}>
                  Services
                </Button>
                <Button variant="ghost" size="sm" onClick={() => navigate("/contact")}>
                  Contact
                </Button>
                <Button variant="ghost" size="sm" onClick={() => navigate("/help")}>
                  Help
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
