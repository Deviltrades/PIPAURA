import { PipAuraLogo } from "@/components/PipAuraLogo";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function MembershipAgreement() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950/30 to-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-between">
          <PipAuraLogo />
          <Link href="/">
            <Button 
              variant="ghost" 
              className="text-slate-400 hover:text-white hover:bg-slate-800"
              data-testid="button-back"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-8 backdrop-blur-sm">
          {/* Title */}
          <h1 className="text-4xl font-bold text-cyan-400 mb-2" data-testid="text-title">
            PIPAURA MEMBERSHIP AGREEMENT
          </h1>
          <p className="text-slate-400 mb-8">Last Updated: October 2025</p>

          {/* Content Sections */}
          <div className="space-y-8 text-slate-300">
            {/* 1. Introduction */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">1. Introduction</h2>
              <div className="space-y-4">
                <p>
                  This Membership Agreement ("Agreement") governs your access to and use of the Pipaura Traders Hub, including all related products, tools, data systems, and services provided by Pipaura ("we", "us", or "our").
                </p>
                <p>
                  By purchasing, subscribing to, or accessing the Pipaura Journal — whether on a monthly or yearly plan — you acknowledge and agree to be bound by the terms and conditions of this Agreement.
                </p>
                <p>
                  This Agreement applies to all subscription tiers including Lite, Core, and Elite, as well as any future plans introduced by Pipaura.
                </p>
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                  <p className="text-yellow-400 font-medium">
                    ⚠️ These terms are subject to change. Pipaura reserves the right to update, amend, or modify this Agreement at any time, with or without prior notice. Any continued use of the platform after changes take effect constitutes your acceptance of the revised terms.
                  </p>
                </div>
                <p>
                  If you do not agree to these terms, you must not purchase, access, or use the Pipaura platform.
                </p>
              </div>
            </section>

            {/* 2. Membership Plans */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">2. Membership Plans</h2>
              <div className="space-y-4">
                <p>Pipaura offers multiple subscription options to meet different trader needs:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong className="text-white">Lite Plan</strong> — Core journal functionality with limited storage and analytics.</li>
                  <li><strong className="text-white">Core Plan</strong> — Full access to all tools, analytics, and ongoing feature updates.</li>
                  <li><strong className="text-white">Elite Plan</strong> — Premium access including future AI modules, deeper analytics, and mentor integration.</li>
                  <li><strong className="text-white">Monthly Subscription</strong> — Renews automatically each month.</li>
                  <li><strong className="text-white">Yearly Subscription</strong> — Billed annually at a discounted rate, renews automatically each year.</li>
                </ul>
                <p>
                  Each plan determines your available features, upload limits, and access to analytics modules.
                  A detailed feature breakdown is available on our Pricing Page.
                </p>
              </div>
            </section>

            {/* 3. Agreement to Terms */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">3. Agreement to Terms</h2>
              <div className="space-y-4">
                <p>By completing your purchase or renewal of any Pipaura subscription, you confirm that you:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Have read, understood, and accepted this Membership Agreement in full.</li>
                  <li>Acknowledge that these terms are subject to change at any time.</li>
                  <li>Agree that your subscription will renew automatically unless cancelled before the renewal date.</li>
                  <li>Authorize recurring payments according to your selected billing cycle.</li>
                  <li>Understand that partial refunds are not issued for unused time once access has been granted.</li>
                  <li>Accept that any breach of this Agreement may result in suspension or termination of access.</li>
                </ul>
              </div>
            </section>

            {/* 4. Account & Access */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">4. Account & Access</h2>
              <div className="space-y-4">
                <p>
                  Each membership is registered to an individual user and may not be shared, transferred, or resold.
                </p>
                <p>
                  You are responsible for maintaining accurate account information and safeguarding your login credentials.
                  Any activity performed through your account will be treated as your own.
                </p>
              </div>
            </section>

            {/* 5. Payment & Renewal */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">5. Payment & Renewal</h2>
              <div className="space-y-4">
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>All payments are processed securely through our payment provider (e.g., Stripe).</li>
                  <li>Monthly plans renew automatically each month on the same date of purchase.</li>
                  <li>Yearly plans renew annually unless cancelled prior to renewal.</li>
                  <li>Prices are displayed in GBP (£) and may include applicable taxes.</li>
                  <li>Pipaura reserves the right to adjust pricing with notice via email or website.</li>
                  <li>If a payment fails or a renewal is declined, access to the platform may be suspended until the issue is resolved.</li>
                </ul>
              </div>
            </section>

            {/* 6. Data Ownership & Privacy */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">6. Data Ownership & Privacy</h2>
              <div className="space-y-4">
                <p>
                  You retain full ownership of your uploaded trade data, journal entries, and attachments.
                  Pipaura does not sell, disclose, or share user data with third parties without consent.
                </p>
                <p>
                  By using the platform, you grant Pipaura permission to process and analyze your data solely for improving your journal experience and providing analytics.
                  Full details are outlined in our Privacy Policy.
                </p>
              </div>
            </section>

            {/* 7. Intellectual Property */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">7. Intellectual Property</h2>
              <div className="space-y-4">
                <p>
                  All software, systems, and designs — including but not limited to Trader DNA™, Fundamental Scorecards, AI Mentor, and Analytics Dashboard — remain the exclusive intellectual property of Pipaura.
                </p>
                <p>
                  Users are granted a non-exclusive, non-transferable license to use these features during an active subscription.
                  Copying, modifying, redistributing, or reverse-engineering Pipaura's systems is strictly prohibited.
                </p>
              </div>
            </section>

            {/* 8. Cancellations & Refunds */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">8. Cancellations & Refunds</h2>
              <div className="space-y-4">
                <p>
                  You may cancel your membership at any time through your account settings.
                  Cancellation stops future billing but does not trigger a refund for any remaining subscription period.
                </p>
                <p>
                  Refunds are only issued in cases of verified technical errors or duplicate billing, and must be requested within 7 days of the charge.
                </p>
              </div>
            </section>

            {/* 9. Termination */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">9. Termination</h2>
              <div className="space-y-4">
                <p>Pipaura reserves the right to suspend or terminate access without prior notice if:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>The account is found in violation of this Agreement.</li>
                  <li>The service is used fraudulently or for unauthorized purposes.</li>
                  <li>Any attempt is made to resell or exploit the platform.</li>
                </ul>
                <p>In such cases, no refunds will be issued.</p>
              </div>
            </section>

            {/* 10. Limitation of Liability */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">10. Limitation of Liability</h2>
              <div className="space-y-4">
                <p>
                  Pipaura provides analytical tools for educational and informational purposes only.
                  We do not provide financial advice and accept no responsibility for trading losses, financial decisions, or user outcomes resulting from use of the platform.
                </p>
                <p>
                  You agree that Pipaura will not be liable for any indirect, incidental, or consequential damages arising from use or inability to use the service.
                </p>
              </div>
            </section>

            {/* 11. Updates & Modifications */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">11. Updates & Modifications</h2>
              <div className="space-y-4">
                <p>
                  Pipaura may update, revise, or replace any part of this Agreement as new features, laws, or technologies arise.
                  All changes take effect immediately upon posting to the official website.
                </p>
                <p>
                  We encourage you to review this page periodically to stay informed.
                  Continued use of the platform after updates signifies your acceptance of the modified terms.
                </p>
              </div>
            </section>

            {/* 12. Contact Information */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">12. Contact Information</h2>
              <div className="space-y-2">
                <p>For questions about your subscription, billing, or this Agreement, contact:</p>
                <p>📧 support@pipaura.com</p>
                <p>🌐 www.pipaura.com</p>
              </div>
            </section>

            {/* Acknowledgment */}
            <section className="border-t border-slate-700 pt-8 mt-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Acknowledgment</h2>
              <p>
                By purchasing or using the Pipaura Journal — whether monthly or yearly, and across any subscription tier — you acknowledge that you have read, understood, and agreed to this Membership Agreement.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
