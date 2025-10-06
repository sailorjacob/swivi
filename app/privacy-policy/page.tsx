import { Header } from "@/components/layout/header"
// Force this page to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'
import { Footer } from "@/components/layout/footer"

export default function PrivacyPolicyPage() {
  return (
    <>
      <Header />
      <main className="flex min-h-screen flex-col pt-16">
        <div className="max-width-wrapper section-padding py-20">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-light mb-8">Privacy Policy</h1>
            <div className="prose prose-invert max-w-none">
              <p className="text-lg text-muted-foreground mb-8">
                Last updated: {new Date().toLocaleDateString()}
              </p>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
                <p className="mb-4">
                  Swivi ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, 
                  use, disclose, and safeguard your information when you use our platform and services.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
                
                <h3 className="text-xl font-medium mb-3">Personal Information</h3>
                <p className="mb-4">We may collect the following personal information:</p>
                <ul className="list-disc pl-6 mb-4">
                  <li>Name and email address (from OAuth providers)</li>
                  <li>Profile information from Discord or Google</li>
                  <li>Payment information for earnings distribution</li>
                  <li>Social media account information when connected</li>
                </ul>

                <h3 className="text-xl font-medium mb-3">Usage Information</h3>
                <ul className="list-disc pl-6 mb-4">
                  <li>Content submissions and performance metrics</li>
                  <li>Platform usage and interaction data</li>
                  <li>Device information and IP addresses</li>
                  <li>Cookies and similar tracking technologies</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
                <p className="mb-4">We use your information to:</p>
                <ul className="list-disc pl-6 mb-4">
                  <li>Provide and maintain our services</li>
                  <li>Process campaign submissions and payments</li>
                  <li>Communicate with you about your account and campaigns</li>
                  <li>Improve our platform and user experience</li>
                  <li>Ensure compliance with our terms and policies</li>
                  <li>Prevent fraud and maintain security</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">4. Information Sharing</h2>
                <p className="mb-4">We may share your information with:</p>
                
                <h3 className="text-xl font-medium mb-3">Campaign Partners</h3>
                <p className="mb-4">
                  When you submit content to campaigns, relevant information may be shared with campaign managers 
                  for evaluation and payment processing.
                </p>

                <h3 className="text-xl font-medium mb-3">Service Providers</h3>
                <p className="mb-4">
                  We work with third-party service providers for payment processing, analytics, and platform infrastructure.
                </p>

                <h3 className="text-xl font-medium mb-3">Legal Requirements</h3>
                <p className="mb-4">
                  We may disclose information when required by law or to protect our rights and safety.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">5. OAuth Authentication</h2>
                <p className="mb-4">
                  We use OAuth authentication through Discord and Google to provide secure login. When you authenticate:
                </p>
                <ul className="list-disc pl-6 mb-4">
                  <li>We receive basic profile information (name, email, profile picture)</li>
                  <li>We do not store your OAuth provider passwords</li>
                  <li>You can revoke access through your OAuth provider settings</li>
                  <li>We only request necessary permissions for platform functionality</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">6. Data Security</h2>
                <p className="mb-4">
                  We implement appropriate security measures to protect your information:
                </p>
                <ul className="list-disc pl-6 mb-4">
                  <li>Encrypted data transmission (HTTPS)</li>
                  <li>Secure database storage</li>
                  <li>Access controls and authentication</li>
                  <li>Regular security assessments</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">7. Data Retention</h2>
                <p className="mb-4">
                  We retain your information for as long as necessary to provide our services and comply with legal obligations. 
                  You may request deletion of your account and associated data at any time.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">8. Your Rights</h2>
                <p className="mb-4">You have the right to:</p>
                <ul className="list-disc pl-6 mb-4">
                  <li>Access and review your personal information</li>
                  <li>Correct inaccurate or incomplete information</li>
                  <li>Request deletion of your account and data</li>
                  <li>Opt-out of certain communications</li>
                  <li>Export your data in a portable format</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">9. Cookies and Tracking</h2>
                <p className="mb-4">
                  We use cookies and similar technologies to enhance your experience, analyze usage, and provide personalized content. 
                  You can manage cookie preferences through your browser settings.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">10. Third-Party Services</h2>
                <p className="mb-4">
                  Our platform integrates with third-party services including:
                </p>
                <ul className="list-disc pl-6 mb-4">
                  <li>Discord and Google for authentication</li>
                  <li>Payment processors for earnings distribution</li>
                  <li>Analytics services for platform improvement</li>
                  <li>Social media platforms for content distribution</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">11. International Data Transfers</h2>
                <p className="mb-4">
                  Your information may be transferred to and processed in countries other than your own. 
                  We ensure appropriate safeguards are in place to protect your data during such transfers.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">12. Children's Privacy</h2>
                <p className="mb-4">
                  Our services are not intended for children under 13. We do not knowingly collect personal information 
                  from children under 13. If we become aware of such collection, we will take steps to delete the information.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">13. Changes to This Policy</h2>
                <p className="mb-4">
                  We may update this Privacy Policy from time to time. We will notify you of any changes by posting 
                  the new Privacy Policy on this page and updating the "Last updated" date.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">14. Contact Us</h2>
                <p className="mb-4">
                  If you have any questions about this Privacy Policy or our data practices, please contact us at:
                </p>
                <p className="mb-4">
                  Email: privacy@swivimedia.com<br />
                  Support: support@swivimedia.com<br />
                  Website: https://www.swivimedia.com
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">15. Compliance</h2>
                <p className="mb-4">
                  This Privacy Policy is designed to comply with applicable privacy laws including GDPR, CCPA, 
                  and other relevant regulations. We are committed to protecting your privacy rights under these laws.
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
