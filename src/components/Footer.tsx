import { MapPin, Phone, Mail, Briefcase, Newspaper, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Footer = () => {
  const { user } = useAuth();
  const navigationLinks = [
    { name: "Home", path: "/" },
    { name: "RFQ", path: "/rfq" },
    { name: "Category", path: "/categories" },
    { name: "Supplier", path: "/suppliers" },
    { name: "About Us", path: "/about" },
    { name: "Support", path: "/support" },
    { name: "Policy", path: "/policy" },
    { name: "Terms & Conditions", path: "/terms" },
  ];

  return (
    <footer className="bg-card border-t border-card-border mt-20">
      <div className="container mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 rounded-lg flex items-center justify-center shadow-glow border-2 border-amber-300/50 sparkle-gold">
                <span className="text-black font-bold text-lg drop-shadow-sm">BFU</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">BUY FOR US</h3>
                <p className="text-xs text-muted-foreground">Smart Sourcing Solutions</p>
              </div>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Making sourcing smarter, faster, and more cost-effective for businesses 
              while supporting small manufacturers and shopkeepers in India.
            </p>
          </div>

          {/* Quick Navigation */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {navigationLinks.slice(0, 4).map((link) => (
                <li key={link.name}>
                  <Link 
                    to={link.path}
                    className="text-muted-foreground hover:text-primary transition-smooth text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support & Legal */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Support & Legal</h4>
            <ul className="space-y-2">
              {navigationLinks.slice(4).map((link) => (
                <li key={link.name}>
                  <Link 
                    to={link.path}
                    className="text-muted-foreground hover:text-primary transition-smooth text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Get in Touch</h4>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    LIG-G Tower 1304, Baroda Height<br />
                    Vadodara, Gujarat 390015
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-primary flex-shrink-0" />
                <p className="text-sm text-muted-foreground">+91 9653987673</p>
              </div>
              
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-primary flex-shrink-0" />
                <p className="text-sm text-muted-foreground">Govindsingh21072000@gmail.com</p>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Links */}
        <div className="border-t border-card-border pt-8 mb-8">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-3">
              <Briefcase className="w-5 h-5 text-primary" />
              <Link 
                to="/careers" 
                className="text-muted-foreground hover:text-primary transition-smooth"
              >
                Careers - Join Our Team
              </Link>
            </div>
            
            <div className="flex items-center space-x-3">
              <Newspaper className="w-5 h-5 text-primary" />
              <Link 
                to="/updates" 
                className="text-muted-foreground hover:text-primary transition-smooth"
              >
                Latest Updates & News
              </Link>
            </div>
            
            <div className="flex items-center space-x-3">
              <Users className="w-5 h-5 text-primary" />
              <Link 
                to="/press" 
                className="text-muted-foreground hover:text-primary transition-smooth"
              >
                Press & Media
              </Link>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="border-t border-card-border pt-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h4 className="font-semibold text-foreground mb-2">Ready to Get Started?</h4>
              <p className="text-muted-foreground text-sm">
                Join thousands of businesses already using our platform
              </p>
            </div>
            
            {!user && (
              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="supplier" size="default" asChild>
                  <Link to="/auth">Become a Supplier</Link>
                </Button>
                <Button variant="hero" size="default" asChild>
                  <Link to="/auth">Become a Buyer</Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-card-border pt-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <p className="text-muted-foreground text-sm">
              © 2025 BUY FOR US (BFU). All rights reserved.
            </p>
            <p className="text-muted-foreground text-sm">
              Democratizing Sourcing Since 2025
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;