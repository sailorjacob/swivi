import { Header } from "@/components/layout/header"
// Force this page to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'
import { Footer } from "@/components/layout/footer"

export default function TermsOfServicePage() {
  return (
    <>
      <Header />
      <main className="flex min-h-screen flex-col pt-16">
        <div className="max-width-wrapper section-padding py-20">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-light mb-8">Terms of Service</h1>
            <div className="prose prose-invert max-w-none">
              <p className="text-lg text-muted-foreground mb-8">
                Last updated: {new Date().toLocaleDateString()}
              </p>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
                <p className="mb-4">
                  By accessing and using Swivi ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. 
                  If you do not agree to abide by the above, please do not use this service.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
                <p className="mb-4">
                  Swivi is a platform that connects content creators ("Creators") with opportunities to create viral video clips 
                  for campaigns. The Service allows users to:
                </p>
                <ul className="list-disc pl-6 mb-4">
                  <li>Browse and join available campaigns</li>
                  <li>Submit video clips for review</li>
                  <li>Earn payments for approved content</li>
                  <li>Track performance and analytics</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
                <p className="mb-4">
                  To access certain features of the Service, you must register for an account. You agree to:
                </p>
                <ul className="list-disc pl-6 mb-4">
                  <li>Provide accurate, current, and complete information</li>
                  <li>Maintain and update your account information</li>
                  <li>Keep your account credentials secure</li>
                  <li>Be responsible for all activities under your account</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">4. Content Guidelines</h2>
                <p className="mb-4">
                  Users must ensure all submitted content:
                </p>
                <ul className="list-disc pl-6 mb-4">
                  <li>Complies with campaign requirements</li>
                  <li>Does not infringe on third-party rights</li>
                  <li>Meets platform quality standards</li>
                  <li>Follows community guidelines</li>
                  <li>Is original or properly licensed</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">5. Payments and Earnings</h2>
                <p className="mb-4">
                  Payments for approved content are subject to:
                </p>
                <ul className="list-disc pl-6 mb-4">
                  <li>Campaign-specific payout rates</li>
                  <li>Content approval by campaign managers</li>
                  <li>Compliance with submission requirements</li>
                  <li>Processing times of 24-48 hours after approval</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">6. Prohibited Activities</h2>
                <p className="mb-4">
                  Users may not:
                </p>
                <ul className="list-disc pl-6 mb-4">
                  <li>Submit copyrighted content without permission</li>
                  <li>Create fake accounts or manipulate metrics</li>
                  <li>Violate platform or campaign guidelines</li>
                  <li>Engage in fraudulent or deceptive practices</li>
                  <li>Interfere with the Service's operation</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">7. Intellectual Property</h2>
                <p className="mb-4">
                  The Service and its original content, features, and functionality are owned by Swivi and are protected by 
                  international copyright, trademark, patent, trade secret, and other intellectual property laws.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">8. Privacy Policy</h2>
                <p className="mb-4">
                  Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the Service, 
                  to understand our practices.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">9. Termination</h2>
                <p className="mb-4">
                  We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, 
                  under our sole discretion, for any reason whatsoever including breach of the Terms.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">10. Disclaimer</h2>
                <p className="mb-4">
                  The information on this Service is provided on an "as is" basis. To the fullest extent permitted by law, 
                  this Company excludes all representations, warranties, conditions and terms.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">11. Limitation of Liability</h2>
                <p className="mb-4">
                  In no event shall Swivi, nor its directors, employees, partners, agents, suppliers, or affiliates, 
                  be liable for any indirect, incidental, special, consequential, or punitive damages.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">12. Changes to Terms</h2>
                <p className="mb-4">
                  We reserve the right to modify or replace these Terms at any time. If a revision is material, 
                  we will provide at least 30 days notice prior to any new terms taking effect.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">13. Contact Information</h2>
                <p className="mb-4">
                  If you have any questions about these Terms of Service, please contact us at:
                </p>
                <p className="mb-4">
                  Email: support@swivimedia.com<br />
                  Website: https://www.swivimedia.com
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
