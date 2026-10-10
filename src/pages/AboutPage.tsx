import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Building,
  MapPin,
  Phone,
  Mail,
  Globe,
  Target,
  Heart,
  Award,
  Shield,
  Zap,
  Handshake,
  TrendingUp,
  FileCheck,
  Ship,
  ClipboardCheck,
  Factory,
  Gauge
} from "lucide-react";

const AboutPage = () => {
  const buyerSegments = [
    {
      icon: <Factory className="w-6 h-6 text-primary" />,
      title: "OEMs",
      description: "Original Equipment Manufacturers sourcing cast, forged, or machined components for their assemblies"
    },
    {
      icon: <Handshake className="w-6 h-6 text-primary" />,
      title: "Industrial Distributors",
      description: "Stocking distributors looking for a reliable, repeatable supply of standard and custom parts"
    },
    {
      icon: <Building className="w-6 h-6 text-primary" />,
      title: "Contract Manufacturers",
      description: "CMs needing qualified sub-suppliers for castings, forgings, and machined components"
    },
    {
      icon: <Gauge className="w-6 h-6 text-primary" />,
      title: "Maintenance & Repair Companies",
      description: "MRO teams sourcing spares and replacement parts to tight dimensional tolerances"
    },
    {
      icon: <Ship className="w-6 h-6 text-primary" />,
      title: "Machinery Importers",
      description: "Importers bringing Indian-made components and machinery parts into the European market"
    }
  ];

  const complianceAreas = [
    {
      icon: <FileCheck className="w-6 h-6 text-primary" />,
      title: "HS Code & Customs Duty",
      description: "We confirm the exact HS classification and the applicable tariff for your destination country before you commit to an order."
    },
    {
      icon: <Shield className="w-6 h-6 text-primary" />,
      title: "CE Marking",
      description: "We assess whether your specific product falls under CE marking requirements. CE marking applies to certain machinery and products meeting EU safety requirements — it is not a blanket requirement for every standalone metal component."
    },
    {
      icon: <ClipboardCheck className="w-6 h-6 text-primary" />,
      title: "EU Machinery Regulation 2023/1230",
      description: "Applicable from 20 January 2027. We check whether the product you are exporting falls within its scope and flag it early in the quotation process."
    },
    {
      icon: <Globe className="w-6 h-6 text-primary" />,
      title: "CBAM & Carbon Reporting",
      description: "We assess, on a product-by-product basis, whether your order is covered by the EU Carbon Border Adjustment Mechanism or related trade measures — we do not assume every metal article carries the same obligations."
    },
    {
      icon: <Award className="w-6 h-6 text-primary" />,
      title: "Quality Documentation",
      description: "Every order is supported by material certificates, dimensional inspection reports, traceability records, and the testing documentation your QA team requires."
    }
  ];

  const differentiators = [
    {
      icon: <Handshake className="w-6 h-6 text-primary" />,
      title: "Factory Network in India",
      description: "Vetted casting, forging, and CNC machining partners across India's industrial manufacturing hubs"
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-primary" />,
      title: "Competitive Trading Margin",
      description: "We earn through a transparent trading margin or disclosed sourcing fee — not hidden markups"
    },
    {
      icon: <Shield className="w-6 h-6 text-primary" />,
      title: "Supplier Risk Management",
      description: "We manage supplier reliability, production timelines, and payment terms so you carry less risk"
    },
    {
      icon: <Ship className="w-6 h-6 text-primary" />,
      title: "Export-Ready Logistics",
      description: "We coordinate shipping, documentation, and customs paperwork for delivery into Europe"
    },
    {
      icon: <ClipboardCheck className="w-6 h-6 text-primary" />,
      title: "Compliance-First Sourcing",
      description: "HS codes, CE marking scope, Machinery Regulation, and CBAM are reviewed before production starts"
    },
    {
      icon: <Zap className="w-6 h-6 text-primary" />,
      title: "Start with Samples",
      description: "Begin with samples or small trial orders before scaling to full production volumes"
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="relative bg-foreground text-background rounded-2xl mb-12 px-6 py-14 text-center overflow-hidden">
        <div className="absolute -top-16 -right-16 w-80 h-80 rounded-full bg-accent/20 blur-3xl"></div>
        <span className="inline-block text-xs font-semibold tracking-[0.2em] uppercase text-accent mb-4">
          About BUY FOR US
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold mb-4">
          Connecting European Industry with Indian Manufacturing
        </h1>
        <p className="text-base sm:text-xl text-background/70 max-w-3xl mx-auto">
          An export trading and sourcing company connecting Indian manufacturers of industrial castings,
          forged components, and custom-machined metal parts with industrial buyers across Europe.
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
                Founded in Vadodara, India, BUY FOR US (BFU) operates as an export trader and sourcing
                partner for the European market. We specialize in industrial castings, forged components,
                and custom-machined metal parts — connecting India's manufacturing base with OEMs and
                industrial buyers who need a dependable, compliant supply chain.
              </p>
              <p className="text-muted-foreground mb-4">
                We do not run our own factory. Instead, we find the right buyer, obtain a quotation from a
                qualified Indian factory, and coordinate production from first sample through final shipment —
                carrying the sourcing and coordination risk so you don't have to manage an overseas factory directly.
              </p>
              <p className="text-muted-foreground">
                This gives European buyers a lower-risk way to access Indian manufacturing: you can start
                with samples and small trial orders, qualify quality and compliance before committing to
                volume, and scale up once the supply chain has proven itself.
              </p>
            </div>
            <div className="space-y-4">
              <div className="bg-foreground text-background p-8 rounded-lg text-center border border-border">
                <h3 className="text-2xl font-bold mb-2 text-accent">Our Mission</h3>
                <p className="text-background/80 font-medium">
                  To be the trusted bridge between Indian casting, forging, and machining factories
                  and European industrial buyers — handling quality, compliance, and logistics end to end.
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
              To become Europe's most trusted sourcing partner for Indian-made industrial castings, forged
              components, and custom-machined parts — making it simple and low-risk for European companies
              to buy from Indian manufacturing.
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
              To give every European buyer — from a single-site MRO team to a multi-plant OEM — access
              to vetted Indian factories, transparent pricing, and full export compliance, without the
              overhead of managing a supplier relationship on the ground in India.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Who We Serve */}
      <Card className="shadow-card mb-12">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Who We Serve</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
            {buyerSegments.map((segment, index) => (
              <div key={index} className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="mb-3 flex justify-center">
                  {segment.icon}
                </div>
                <h3 className="font-semibold mb-2">{segment.title}</h3>
                <p className="text-sm text-muted-foreground">{segment.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* How the Trading Model Works */}
      <Card className="shadow-card mb-12">
        <CardHeader>
          <CardTitle className="text-2xl text-center">How We Work: Export Trading Model</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-muted/50 p-6 rounded-lg border border-border">
              <h3 className="text-xl font-bold mb-4 text-foreground">
                What We Do
              </h3>
              <p className="text-muted-foreground mb-4">
                We find the European buyer, get a competitive quotation from a qualified Indian factory,
                and coordinate production — from drawing review and sampling through quality inspection
                and shipment — on the buyer's behalf.
              </p>
              <p className="text-muted-foreground">
                This means a lower initial investment than setting up your own factory relationship: you can
                begin with samples and small orders, and scale once the part and the supplier are proven.
              </p>
            </div>

            <div className="bg-foreground text-background p-6 rounded-lg border border-border">
              <h3 className="text-xl font-bold mb-4 text-accent">
                What We Manage For You
              </h3>
              <p className="text-background/80 mb-4">
                Supplier reliability, production timelines, payment terms, export shipping, and customer
                complaints are all handled by us — so your team deals with one accountable partner, not
                multiple overseas factories.
              </p>
              <p className="text-background/80">
                We earn through a transparent trading margin or a disclosed sourcing fee, agreed upfront —
                no hidden costs layered into your quotation.
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

      {/* Compliance & Export Standards */}
      <Card className="shadow-card mb-12">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <ClipboardCheck className="w-6 h-6" />
            Export Compliance & Standards
          </CardTitle>
          <p className="text-muted-foreground mt-1">
            Compliance is assessed per product, per destination — we never assume one requirement applies to every part.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {complianceAreas.map((item, index) => (
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

      {/* Contact Information */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-2xl">Get In Touch</CardTitle>
          <p className="text-muted-foreground mt-1">
            Send us your drawing or specification for a casting, forged component, or machined part and
            we'll come back with a factory quotation, HS code, and compliance review for your market.
          </p>
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
                <Button className="w-full" asChild>
                  <Link to="/rfq">
                    <Mail className="w-4 h-4 mr-2" />
                    Request a Quotation
                  </Link>
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