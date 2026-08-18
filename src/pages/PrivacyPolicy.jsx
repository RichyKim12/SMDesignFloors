
import { useEffect } from 'react';
import './PrivacyPolicy.css';

export default function PrivacyPolicy() {
  useEffect(() => {
    document.title = 'Privacy Policy | SM Design Floors';
  }, []);

  return (
    <div className="privacy-container">
      <div className="privacy-card">
        <p className="privacy-eyebrow">SM Design Floors</p>
        <h1 className="privacy-title">Privacy Policy</h1>
        <p className="privacy-updated">Effective Date: August 18, 2026</p>

        <section className="privacy-section">
          <h2>1. Information We Collect</h2>
          <p>
            When you use our website, submit a contact or estimate request,
            register for a contractor or professional account through{' '}
            <strong>ProServices</strong>, or access an authenticated dashboard,
            we may collect information that you provide directly to us.
          </p>

          <ul>
            <li>
              <strong>Contact &amp; Estimate Information:</strong> Full name,
              email address, phone number, ZIP code or service location, and
              information included in your project or inquiry message.
            </li>

            <li>
              <strong>Professional &amp; Business Information:</strong>{' '}
              Business or company name, years of experience, profession, trade
              specialties, areas of focus, availability, service area,
              website URL, and other professional information submitted as part
              of an application.
            </li>

            <li>
              <strong>Professional Documents:</strong> Resume, portfolio,
              licenses, certifications, insurance information, and other files
              that you voluntarily upload as part of a professional or
              contractor application.
            </li>

            <li>
              <strong>Account Information:</strong> Information necessary to
              create and administer your account. Authentication is handled
              through Supabase Auth. We do not intentionally store users'
              raw passwords in our application database.
            </li>

            <li>
              <strong>Technical Information:</strong> Information that may be
              automatically processed when you access our website, such as IP
              address, browser type, device information, operating system,
              timestamps, referring URLs, and application or server logs.
            </li>
          </ul>
        </section>

        <section className="privacy-section">
          <h2>2. How We Use Your Information</h2>
          <p>
            We use the information we collect to operate, maintain, secure,
            and improve our services, including to:
          </p>

          <ul>
            <li>
              Respond to contact requests, estimate requests, and other
              inquiries.
            </li>

            <li>
              Match contractors and trade partners with relevant flooring,
              remodeling, or related project opportunities.
            </li>

            <li>
              Process and review contractor, professional, and trade account
              applications.
            </li>

            <li>
              Review and verify professional information voluntarily submitted
              through an application.
            </li>

            <li>
              Authenticate users and administer access to contractor and
              administrative dashboards.
            </li>

            <li>
              Store and manage professional documents submitted through the
              website.
            </li>

            <li>
              Send administrative communications, account verification
              messages, and service-related updates.
            </li>

            <li>
              Protect our website and users against unauthorized access,
              fraud, abuse, and security threats.
            </li>

            <li>
              Comply with applicable laws, regulations, legal processes, and
              lawful governmental requests.
            </li>

            <li>
              Establish, exercise, or defend legal claims.
            </li>
          </ul>
        </section>

        <section className="privacy-section">
          <h2>3. Cookies, Authentication &amp; Technical Information</h2>
          <p>
            Our website uses technologies necessary to operate the website and
            authenticated services.
          </p>

          <p>
            When you sign in, authentication-related information may be stored
            in your browser or otherwise processed to maintain your
            authenticated session and keep you signed in.
          </p>

          <p>
            Our website and infrastructure may also use browser storage,
            cookies, server logs, or similar technologies necessary for website
            functionality, authentication, security, troubleshooting, and
            abuse prevention.
          </p>

          <p>
            We do not intentionally use third-party advertising cookies or
            sell personal information for advertising purposes.
          </p>

          <p>
            If we introduce analytics, advertising, or other tracking
            technologies in the future, we may update this Privacy Policy to
            describe those technologies and their purposes.
          </p>
        </section>

        <section className="privacy-section">
          <h2>4. Data Storage &amp; Security</h2>
          <p>
            We use reasonable administrative, technical, and organizational
            safeguards designed to protect personal information against
            unauthorized access, alteration, disclosure, or destruction.
          </p>

          <p>
            Our website uses HTTPS for information transmitted between your
            browser and our services. Account authentication and certain
            application data are provided through Supabase.
          </p>

          <p>
            We use access controls and database security policies designed to
            restrict access to personal information to authorized users and
            processes.
          </p>

          <p>
            Uploaded professional documents are stored using application
            infrastructure configured to restrict access according to
            applicable account and authorization rules.
          </p>

          <p>
            Our website is hosted using Vercel, and certain application and
            infrastructure services are provided through third-party
            providers. However, no method of transmitting or storing
            information over the internet is completely secure, and we cannot
            guarantee absolute security.
          </p>
        </section>

        <section className="privacy-section">
          <h2>5. Information Sharing &amp; Third Parties</h2>
          <p>
            <strong>
              We do not sell your personal information for monetary
              consideration.
            </strong>
          </p>

          <p>
            We may share information with service providers that process
            information on our behalf and are reasonably necessary to operate
            our website and services. These providers may include:
          </p>

          <ul>
            <li>
              <strong>Supabase</strong>, for authentication, database
              infrastructure, and related application services.
            </li>

            <li>
              <strong>Vercel</strong>, for website hosting and application
              infrastructure.
            </li>

            <li>
              Email or communications providers used to deliver transactional
              or service-related communications.
            </li>

            <li>
              Other technology, security, or infrastructure providers
              reasonably necessary to operate and maintain our services.
            </li>
          </ul>

          <p>
            We may also disclose information when reasonably necessary to:
          </p>

          <ul>
            <li>
              Comply with applicable laws, regulations, court orders,
              subpoenas, or other legal processes.
            </li>

            <li>
              Respond to lawful requests from governmental authorities.
            </li>

            <li>
              Protect the rights, property, or safety of SM Design Floors, our
              users, or others.
            </li>

            <li>
              Detect, investigate, or prevent fraud, abuse, security
              incidents, or other unlawful activity.
            </li>

            <li>
              Establish, exercise, or defend legal claims.
            </li>

            <li>
              Facilitate a merger, acquisition, sale, reorganization,
              financing, or other transfer involving all or part of our
              business or assets, subject to applicable law.
            </li>
          </ul>
        </section>

        <section className="privacy-section">
          <h2>6. Data Retention</h2>
          <p>
            We retain personal information for as long as reasonably necessary
            to provide our services, maintain and administer accounts, process
            applications and requests, fulfill the purposes described in this
            Privacy Policy, resolve disputes, enforce agreements, prevent
            fraud or abuse, comply with legal obligations, and protect our
            legitimate business interests.
          </p>

          <p>
            When information is no longer reasonably necessary for these
            purposes, we may delete, anonymize, or securely dispose of it,
            subject to applicable legal, operational, backup, and security
            requirements.
          </p>
        </section>

        <section className="privacy-section">
          <h2>7. Your Rights &amp; Data Control</h2>
          <p>
            Depending on applicable law, you may have rights concerning your
            personal information, including the right to request access to,
            correction of, or deletion of certain personal information.
          </p>

          <p>
            You may submit a privacy-related request by contacting us directly
            at{' '}
            <a href="mailto:lastpioneer@hotmail.com">
              lastpioneer@hotmail.com
            </a>.
          </p>

          <p>
            We may need to verify your identity before completing certain
            requests. We may deny or limit a request when permitted or required
            by applicable law.
          </p>

          <p>
            Certain information may need to be retained for legal compliance,
            security, fraud prevention, dispute resolution, legitimate
            business purposes, or other purposes permitted by law.
          </p>
        </section>

        <section className="privacy-section">
          <h2>8. Children's Privacy</h2>
          <p>
            Our services are not directed to children under 13, and we do not
            knowingly collect personal information from children under 13
            through our services.
          </p>

          <p>
            If we learn that we have collected personal information from a
            child under 13 without appropriate consent, we will take reasonable
            steps to delete that information.
          </p>
        </section>

        <section className="privacy-section">
          <h2>9. Third-Party Services &amp; Links</h2>
          <p>
            Our website may use or link to third-party websites, services, or
            applications. Third parties may collect or process information
            according to their own privacy policies and terms.
          </p>

          <p>
            We do not control the privacy practices of third-party websites or
            services that we do not own or operate. We encourage you to review
            the privacy policies of third-party services before providing them
            with personal information.
          </p>
        </section>

        <section className="privacy-section">
          <h2>10. Data Security Incidents</h2>
          <p>
            We take reasonable measures designed to protect personal
            information, but no security system can be guaranteed to prevent
            every security incident.
          </p>

          <p>
            If we determine that a security incident requires notification
            under applicable federal, state, or other applicable law, we will
            provide notification as required by that law.
          </p>
        </section>

        <section className="privacy-section">
          <h2>11. Changes to This Privacy Policy</h2>
          <p>
            We may update this Privacy Policy from time to time to reflect
            changes in our services, technology, business practices, or
            applicable legal requirements.
          </p>

          <p>
            When we make changes, we will update the Effective Date displayed
            at the beginning of this Privacy Policy.
          </p>

          <p>
            If we make material changes, we may provide additional notice where
            appropriate or required by applicable law.
          </p>
        </section>

        <section className="privacy-section">
          <h2>12. Contact Us</h2>
          <p>
            If you have questions regarding this Privacy Policy, our privacy
            practices, or wish to submit a privacy-related request, please
            contact us at:
          </p>

          <p>
            <strong>SM Design Floors</strong>
            <br />
            Email:{' '}
            <a href="mailto:lastpioneer@hotmail.com">
              lastpioneer@hotmail.com
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}