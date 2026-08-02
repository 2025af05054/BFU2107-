const PrivacyPolicyPage = () => {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: August 2, 2026</p>

      <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">1. Introduction</h2>
          <p>
            BUY FOR US (BFU) ("we", "us", "our") respects your privacy and is committed to protecting the personal
            and business information you share with us. This Privacy Policy explains what data we collect, how we
            use it, and the choices you have.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">2. Information We Collect</h2>
          <p>When you register or use our platform, we collect:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Account details: full name, business email address, password (stored securely, hashed)</li>
            <li>Business details: company name, GST number (for Suppliers), business or delivery address</li>
            <li>Contact details: mobile number</li>
            <li>Transactional data: RFQs, quotes, orders, and messages exchanged on the platform</li>
            <li>Usage data: pages visited, device/browser information, and log data</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">3. How We Use Your Information</h2>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>To create and verify your account (including OTP-based email verification)</li>
            <li>To connect Buyers and Suppliers and facilitate RFQs, quotes, and orders</li>
            <li>To send order updates, verification codes, and important account notifications</li>
            <li>To improve our platform, prevent fraud, and ensure security</li>
            <li>To comply with legal and regulatory obligations (e.g. GST-related recordkeeping)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">4. Sharing of Information</h2>
          <p>
            We share your business name, relevant contact information, and RFQ/order details with the counterparty
            Buyer or Supplier necessary to fulfill a transaction. We do not sell your personal information to third
            parties. We may share data with service providers (e.g. our authentication and hosting provider,
            Supabase) strictly to operate the platform, and with authorities where required by law.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">5. Data Security</h2>
          <p>
            We use industry-standard measures, including encrypted password storage and secure authentication
            (email/password with OTP verification), to protect your information. No method of transmission or
            storage is 100% secure, but we work to safeguard your data against unauthorized access.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">6. Data Retention</h2>
          <p>
            We retain your account and transaction data for as long as your account is active or as needed to
            comply with legal, tax, and accounting obligations.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">7. Your Rights &amp; Choices</h2>
          <p>
            You may request access to, correction of, or deletion of your personal information by contacting us.
            You may also update your account details at any time from your dashboard.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">8. Cookies</h2>
          <p>
            We use essential cookies/local storage to keep you signed in and to remember your preferences. We do
            not use these for third-party advertising.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">9. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy periodically. Material changes will be communicated by updating the
            "Last updated" date above.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">10. Contact Us</h2>
          <p>
            For privacy-related questions or requests, contact us at{" "}
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

export default PrivacyPolicyPage;
