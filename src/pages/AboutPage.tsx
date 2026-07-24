import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Building, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Users, 
  Target, 
  Heart, 
  Award,
  Clock,
  Shield,
  Zap,
  Handshake,
  TrendingUp
} from "lucide-react";

const AboutPage = () => {
  const values = [
    {
      icon: <Shield className="w-8 h-8 text-primary" />,
      title: "Trust & Transparency",
      description: "Building lasting relationships through honest communication and transparent processes in every sourcing deal."
    },
    {
      icon: <Zap className="w-8 h-8 text-primary" />,
      title: "Smart Sourcing",
      description: "Leveraging our market network and negotiation expertise to deliver instant quotes and cost savings."
    },
    {
      icon: <Heart className="w-8 h-8 text-primary" />,
      title: "Supporting Local",
      description: "Empowering small manufacturers and shopkeepers to compete with multinational giants through collective bargaining."
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-primary" />,
      title: "Quality Assurance",
      description: "Every sourced product undergoes strict quality checks to ensure reliability and customer satisfaction."
    }
  ];

  const milestones = [
    {
      year: "2025",
      title: "Company Founded",
      description: "Founded in Vadodara by passionate engineers with a clear mission to revolutionize sourcing"
    },
    {
      year: "2025",
      title: "First Partnerships",
      description: "Established initial supplier network and began helping local businesses with sourcing needs"
    },
    {
      year: "2025",
      title: "Platform Development",
      description: "Launched comprehensive sourcing platform connecting businesses with verified suppliers"
    },
    {
      year: "2025",
      title: "Market Expansion",
      description: "Expanding network to support more manufacturers and international sourcing partnerships"
    }
  ];

  const differentiators = [
    {
      icon: <Handshake className="w-6 h-6 text-primary" />,
      title: "Strong Market Network",
      description: "Extensive supplier contacts across India and abroad"
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-primary" />,
      title: "Expert Negotiators", 
      description: "Hard-bargained prices ensuring customers save money"
    },
    {
      icon: <Shield className="w-6 h-6 text-primary" />,
      title: "Quality Assurance",
      description: "Every sourced product goes through strict quality checks"
    },
    {
      icon: <Globe className="w-6 h-6 text-primary" />,
      title: "Global Sourcing Partner",
      description: "Helping international buyers seamlessly access Indian manufacturing"
    },
    {
      icon: <Heart className="w-6 h-6 text-primary" />,
      title: "Empowering Local Economy",
      description: "Supporting small shopkeepers and manufacturers against monopolies"
    },
    {
      icon: <Zap className="w-6 h-6 text-primary" />,
      title: "End-to-End Solutions",
      description: "From identifying suppliers to logistics delivery, we handle everything"
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="text-center mb-12">
        <div className="flex items-center justify-center mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 rounded-lg flex items-center justify-center mr-4 shadow-glow border-2 border-amber-300/50">
            <span className="text-black font-bold text-2xl drop-shadow-sm">BFU</span>
          </div>
          <h1 className="text-5xl font-bold text-foreground">About BUY FOR US</h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-4xl mx-auto">
          Making sourcing smarter, faster, and more cost-effective for businesses while 
          supporting small manufacturers and shopkeepers in India.
        </p>
      </section>

      {/* Company Story */}
      <Card className="shadow-card mb-12">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Building className="w-6 h-6" />
            Our Story
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-muted-foreground mb-4">
                Founded in 2025 in Vadodara, India, BUY FOR US (BFU) is a young and dynamic startup 
                created by passionate engineers with one clear mission: To make sourcing smarter, 
                faster, and more cost-effective for businesses while supporting small manufacturers 
                and shopkeepers in India.
              </p>
              <p className="text-muted-foreground mb-4">
                Many engineering and manufacturing companies often need to purchase motors, spare parts, 
                or specialized hardware but do not buy them frequently. This creates challenges in 
                identifying the right suppliers, fair prices, and assured quality.
              </p>
              <p className="text-muted-foreground">
                At BFU, sourcing is our core strength. With our wide supplier network, regular market 
                interactions, and strong negotiation capabilities, we provide businesses with instant 
                estimated quotes, reduced procurement time, and guaranteed cost savings.
              </p>
            </div>
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-amber-100 to-amber-200 p-8 rounded-lg text-center border border-amber-300">
                <h3 className="text-2xl font-bold text-black mb-2">👉 Our Mission</h3>
                <p className="text-black font-medium">
                  To make sourcing smarter, faster, and more cost-effective for businesses
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vision & Mission */}
      <div className="grid md:grid-cols-2 gap-6 mb-12">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Our Vision
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              To become India's most trusted sourcing partner — bridging the gap between businesses, 
              manufacturers, and global buyers — while empowering local manufacturers and shopkeepers 
              to thrive in a competitive market.
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Our Goal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              To democratize sourcing by giving every business — big or small — equal access to 
              quality products, fair prices, and reliable supply chains. By doing so, we aim to 
              build a market ecosystem where both global enterprises and local businesses can grow together.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* What We Do - Two Main Services */}
      <Card className="shadow-card mb-12">
        <CardHeader>
          <CardTitle className="text-2xl text-center">What We Do</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-6 rounded-lg border border-amber-200">
              <h3 className="text-xl font-bold mb-4 text-black">
                🏢 Simplifying Sourcing for Businesses
              </h3>
              <p className="text-black font-medium mb-4">
                Many engineering and manufacturing companies often need to purchase motors, spare parts, 
                or specialized hardware but do not buy them frequently. This creates challenges in 
                identifying the right suppliers, fair prices, and assured quality.
              </p>
              <p className="text-black font-medium">
                At BFU, sourcing is our core strength. With our wide supplier network, regular market 
                interactions, and strong negotiation capabilities, we provide businesses with instant 
                estimated quotes, reduced procurement time, and guaranteed cost savings.
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-amber-100 to-amber-200 p-6 rounded-lg border border-amber-300">
              <h3 className="text-xl font-bold mb-4 text-black">
                🏪 Supporting Small Manufacturers & Shopkeepers
              </h3>
              <p className="text-black font-medium mb-4">
                Today, small manufacturers and local shopkeepers in India face huge challenges competing 
                with multinational giants like D-Mart, Croma, or Swiggy Instamart. These corporations 
                enjoy special benefits: bulk pricing, customized packaging, and preferential supply.
              </p>
              <p className="text-black font-medium">
                BFU steps in as their sourcing ally. We collect order requirements from multiple small 
                shopkeepers, consolidate them, and negotiate with manufacturers to secure the same pricing 
                and benefits usually reserved for big players.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* What Makes Us Different */}
      <Card className="shadow-card mb-12">
        <CardHeader>
          <CardTitle className="text-2xl">What Makes Us Different?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {differentiators.map((item, index) => (
              <div key={index} className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                <div className="flex-shrink-0">
                  {item.icon}
                </div>
                <div>
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Values */}
      <Card className="shadow-card mb-12">
        <CardHeader>
          <CardTitle className="text-2xl">Our Values</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <div key={index} className="text-center">
                <div className="mb-4 flex justify-center">
                  {value.icon}
                </div>
                <h3 className="font-semibold mb-2">{value.title}</h3>
                <p className="text-sm text-muted-foreground">{value.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card className="shadow-card mb-12">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Clock className="w-6 h-6" />
            Our Journey
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {milestones.map((milestone, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="bg-primary text-primary-foreground rounded-full px-3 py-1 text-sm font-semibold min-w-fit">
                  {milestone.year}
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{milestone.title}</h3>
                  <p className="text-muted-foreground">{milestone.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-2xl">Get In Touch</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary mt-1" />
                <div>
                  <p className="font-medium">Head Office</p>
                  <p className="text-muted-foreground">
                    BUY FOR US (BFU)<br />
                    LIG-G Tower 1304, Baroda Height<br />
                    Vadodara, Gujarat 390015<br />
                    India
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">Phone</p>
                  <p className="text-muted-foreground">+91 9653987673</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-muted-foreground">Govindsingh21072000@gmail.com</p>
                </div>
              </div>
            </div>

            <div className="bg-muted p-6 rounded-lg">
              <h3 className="font-semibold mb-4">Business Hours</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Monday - Friday</span>
                  <span>9:00 AM - 6:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Saturday</span>
                  <span>10:00 AM - 4:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Sunday</span>
                  <span>Closed</span>
                </div>
              </div>
              
              <div className="mt-6">
                <Button className="w-full">
                  <Mail className="w-4 h-4 mr-2" />
                  Contact Us
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AboutPage;