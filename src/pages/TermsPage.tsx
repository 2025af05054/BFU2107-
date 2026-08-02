const TermsPage = () => {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">Terms &amp; Conditions</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: August 2, 2026</p>

      <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">1. Acceptance of Terms</h2>
          <p>
            By creating an account or using the BUY FOR US (BFU) platform ("we", "us", "our"), you agree to be
            bound by these Terms &amp; Conditions. If you do not agree, please do not register for or use our
            services.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">2. Eligibility &amp; Account Registration</h2>
          <p>
            Our platform is intended for businesses and individuals engaged in B2B sourcing, buying, or selling.
            When you register as a Buyer or Supplier, you must provide accurate and current information, including
            your business email address, mobile number, company name, and delivery/business address. You are
            responsible for maintaining the confidentiality of your account credentials and for all activity that
            occurs under your account.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">3. Supplier &amp; Buyer Obligations</h2>
          <p>
            Suppliers must provide a valid GST registration number where applicable and are responsible for the
            accuracy of product listings, pricing, and quotations submitted through the platform. Buyers are
            responsible for the accuracy of Requests for Quotation (RFQs) and for honoring orders placed through
            the platform in good faith.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">4. Orders, Quotes &amp; Payments</h2>
          <p>
            RFQs, quotes, and orders exchanged on the platform constitute offers and acceptances between the
            respective Buyer and Supplier. BUY FOR US facilitates these transactions but is not a party to the
            underlying sale contract unless explicitly stated. Pricing, delivery timelines, and payment terms are
            agreed upon between the transacting parties, subject to any applicable platform fees disclosed at the
            time of transaction.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">5. Prohibited Conduct</h2>
          <p>
            You agree not to misuse the platform, including but not limited to: submitting false business
            information, listing counterfeit or illegal goods, circumventing platform fees, or attempting to
            interfere with the security or proper functioning of the service.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">6. Termination</h2>
          <p>
            We reserve the right to suspend or terminate accounts that violate these Terms, provide fraudulent
            information, or engage in conduct harmful to other users or the platform.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">7. Limitation of Liability</h2>
          <p>
            BUY FOR US is not liable for indirect, incidental, or consequential damages arising from transactions
            between Buyers and Suppliers, including disputes over product quality, delivery delays, or payment
            issues, except as required by applicable law.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">8. Changes to These Terms</h2>
          <p>
            We may update these Terms &amp; Conditions from time to time. Continued use of the platform after
            changes take effect constitutes acceptance of the revised terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">9. Contact Us</h2>
          <p>
            For questions about these Terms, contact us at{" "}
            <a href="mailto:govindsingh21072000@gmail.com" className="text-primary underline">
              govindsingh21072000@gmail.com
            </a>{" "}
            or +91 9653987673.
          </p>
        </section>
      </div>
    </div>
  );
};

export default TermsPage;
