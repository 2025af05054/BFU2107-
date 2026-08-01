import { MessageCircle, Phone, Mail, FileText, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { LiveChatDialog } from "@/components/LiveChatDialog";
import { useState } from "react";

const SupportPage = () => {
  const { toast } = useToast();
  const [chatOpen, setChatOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Support Request Submitted",
      description: "Thank you for contacting us. Our support team will respond within 2-4 hours.",
    });
  };

  const handleSupportAction = (actionType: string) => {
    switch (actionType) {
      case "Start Chat":
        setChatOpen(true);
        break;
      case "Call Now":
        window.location.href = "tel:+919653987673";
        break;
      case "Send Email":
        window.location.href = "mailto:govindsingh21072000@gmail.com";
        break;
    }
  };

  const supportOptions = [
    {
      icon: MessageCircle,
      title: "Live Chat",
      description: "Get instant help from our support team",
      availability: "24/7 Available",
      action: "Start Chat",
      variant: "hero" as const
    },
    {
      icon: Phone,
      title: "Phone Support",
      description: "Speak directly with our experts",
      availability: "Mon-Sat 9AM-7PM",
      action: "Call Now",
      variant: "default" as const
    },
    {
      icon: Mail,
      title: "Email Support",
      description: "Send us your detailed queries",
      availability: "Response within 4 hours",
      action: "Send Email",
      variant: "outline" as const
    }
  ];

  const faqs = [
    {
      question: "How does the RFQ process work?",
      answer: "Submit your requirements, our team finds suppliers, you receive competitive quotes, and place orders directly through our platform."
    },
    {
      question: "How are suppliers verified?",
      answer: "All suppliers go through our rigorous verification process including business registration, GST validation, quality checks, and reference verification."
    },
    {
      question: "What payment options are available?",
      answer: "We support various payment methods including bank transfers, UPI, and credit facilities. All transactions are processed securely."
    },
    {
      question: "How do I track my orders?",
      answer: "You can track all your orders in real-time through your dashboard. You'll receive updates via SMS, email, and push notifications."
    },
    {
      question: "Is there a minimum order quantity?",
      answer: "MOQs vary by product and supplier. Our team works to find suppliers that match your quantity requirements, whether small or large orders."
    },
    {
      question: "How quickly do I get quotes for my RFQ?",
      answer: "Most RFQs receive initial quotes within 24-48 hours. Complex or specialized products may take up to 72 hours."
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">Support Center</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Get the help you need to make the most of ConnectTrade. Our support team is here to assist you.
        </p>
      </div>

      {/* Support Options */}
      <section className="mb-16">
        <div className="grid md:grid-cols-3 gap-6">
          {supportOptions.map((option, index) => (
            <Card key={index} className="shadow-card hover:shadow-button transition-spring text-center">
              <CardHeader>
                <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <option.icon className="w-8 h-8 text-white" />
                </div>
                <CardTitle>{option.title}</CardTitle>
                <CardDescription>{option.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    {option.availability}
                  </div>
                </div>
                <Button 
                  variant={option.variant} 
                  className="w-full"
                  onClick={() => handleSupportAction(option.action)}
                >
                  {option.action}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Contact Form */}
        <div className="lg:col-span-2">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-2xl">Send us a Message</CardTitle>
              <CardDescription>
                Fill out the form below and our support team will get back to you as soon as possible.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" placeholder="Enter your full name" required />
                  </div>
                  <div>
                    <Label htmlFor="company">Company Name</Label>
                    <Input id="company" placeholder="Enter your company name" />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" placeholder="Enter your email" required />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" placeholder="Enter your phone number" />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Support Category</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rfq">RFQ Related</SelectItem>
                        <SelectItem value="orders">Order Issues</SelectItem>
                        <SelectItem value="payments">Payment Support</SelectItem>
                        <SelectItem value="supplier">Supplier Issues</SelectItem>
                        <SelectItem value="technical">Technical Support</SelectItem>
                        <SelectItem value="account">Account Management</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="priority">Priority Level</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low - General inquiry</SelectItem>
                        <SelectItem value="medium">Medium - Need help</SelectItem>
                        <SelectItem value="high">High - Urgent issue</SelectItem>
                        <SelectItem value="critical">Critical - Business impact</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" placeholder="Brief subject of your inquiry" required />
                </div>

                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Describe your issue or question in detail..."
                    rows={6}
                    required
                  />
                </div>

                <Button type="submit" variant="hero" size="lg" className="w-full">
                  Submit Support Request
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Support Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Avg Response Time:</span>
                <span className="font-medium">&lt; 2 hours</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Resolution Rate:</span>
                <span className="font-medium">98%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Customer Satisfaction:</span>
                <span className="font-medium">4.9/5</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Support Languages:</span>
                <span className="font-medium">Hindi, English</span>
              </div>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Direct Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="font-medium mb-1">Support Hotline</div>
                <a href="tel:+919653987673" className="text-primary hover:underline">
                  +91 96539 87673
                </a>
              </div>
              <div>
                <div className="font-medium mb-1">Email Support</div>
                <a href="mailto:govindsingh21072000@gmail.com" className="text-primary hover:underline">
                  govindsingh21072000@gmail.com
                </a>
              </div>
              <div>
                <div className="font-medium mb-1">Business Hours</div>
                <div className="text-muted-foreground">
                  Monday - Saturday<br />
                  9:00 AM - 7:00 PM
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card className="shadow-card border-destructive/20">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Emergency Support
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                For critical business issues that require immediate attention.
              </p>
              <Button 
                variant="destructive" 
                size="sm" 
                className="w-full"
                onClick={() => window.location.href = "tel:+919653987673"}
              >
                Call Emergency Line
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* FAQs */}
      <section className="mt-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">Frequently Asked Questions</h2>
          <p className="text-muted-foreground">
            Find quick answers to common questions about ConnectTrade
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {faqs.map((faq, index) => (
            <Card key={index} className="shadow-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-primary font-bold text-sm">?</span>
                  </div>
                  {faq.question}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="leading-relaxed">
                  {faq.answer}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-8">
          <Button variant="outline" size="lg">
            <FileText className="w-4 h-4 mr-2" />
            View All FAQs
          </Button>
        </div>
      </section>

      {/* Team Support CTA */}
      <section className="mt-16">
        <Card className="gradient-secondary text-white">
          <CardContent className="pt-6 text-center">
            <Users className="w-12 h-12 text-white mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">Need Personalized Help?</h3>
            <p className="text-white/90 mb-6 max-w-2xl mx-auto">
              Our dedicated account managers are available to provide one-on-one assistance 
              for your specific business needs and requirements.
            </p>
            <Button variant="premium" size="lg" className="bg-white text-secondary hover:bg-white/90">
              Request Account Manager
            </Button>
          </CardContent>
        </Card>
      </section>

      <LiveChatDialog open={chatOpen} onOpenChange={setChatOpen} />
    </div>
  );
};

export default SupportPage;