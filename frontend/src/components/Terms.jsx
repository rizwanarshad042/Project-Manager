import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

const Terms = () => {
  return (
    <div className="bg-light min-vh-100 p-5 vh-100 w-100 position-absolute top-50 start-50 translate-middle">
      <div className="container bg-white shadow-lg rounded p-4 mt-5">
        <h1 className="text-center mb-4 p-4">Terms and Conditions</h1>

        <div>
          <p>
            Welcome to <strong>Infotech</strong>!
          </p>
          <p>
            These terms and conditions outline the rules and regulations for the use of{' '}
            <strong>Infotech</strong>'s Website.
          </p>
          <p>
            By accessing this website, we assume you accept these terms. Do not continue to use this
            site if you do not agree with all of the terms and conditions.
          </p>
        </div>

        <div>
          <h2 className="mb-4 pb-2">1. Cookies</h2>
          <p>
            We use cookies to enhance user experience. By accessing the website, you agree to the use
            of cookies in accordance with our privacy policy.
          </p>
        </div>

        <div>
          <h2 className="mb-4 pb-2">2. Intellectual Property</h2>
          <p>
            Unless otherwise stated, Company Name and/or its licensors own the intellectual property
            rights for all material. All rights are reserved. You may:
          </p>
          <ul>
            <li>Not republish material from the website</li>
            <li>Not sell, rent, or sub-license material</li>
            <li>Not reproduce, duplicate, or copy material</li>
            <li>Not redistribute content</li>
          </ul>
        </div>

        <div>
          <h2 className="mb-4 pb-2">3. User Comments</h2>
          <p>
            Comments do not reflect our views and we are not liable for any damages caused by them.
            We reserve the right to remove any comment deemed inappropriate or offensive.
          </p>
          <p>
            By posting comments, you warrant that you have the necessary rights and that your comments
            do not violate intellectual property or contain unlawful material.
          </p>
        </div>

        <div>
          <h2 className="mb-4 pb-2">4. Hyperlinking</h2>
          <p>
            Certain organizations (e.g., government agencies, news orgs, search engines) may link to
            our site without approval. Others may request permission. All links must:
          </p>
          <ul>
            <li>Not be misleading</li>
            <li>Not falsely imply sponsorship or endorsement</li>
            <li>Fit within the context of the linking site</li>
          </ul>
        </div>

        <div>
          <h2 className="mb-4 pb-2">5. iFrames</h2>
          <p>
            Without prior approval, you may not create frames around our webpages that alter their
            visual appearance or layout.
          </p>
        </div>

        <div>
          <h2 className="mb-4 pb-2">6. Content Liability</h2>
          <p>
            We shall not be held responsible for any content that appears on your website. You agree
            to protect and defend us against all claims arising from content on your site.
          </p>
        </div>

        <div>
          <h2 className="mb-4 pb-2">7. Reservation of Rights</h2>
          <p>
            We reserve the right to request removal of any links to our site and to update these terms
            at any time. By continuing to link to our website, you agree to these linking terms.
          </p>
        </div>

        <div>
          <h2 className="mb-4 pb-2">8. Disclaimer</h2>
          <p>
            To the maximum extent permitted by law, we exclude all representations and warranties
            related to our website. This disclaimer does not:
          </p>
          <ul>
            <li>Limit liability for death or personal injury</li>
            <li>Limit liability for fraud or fraudulent misrepresentation</li>
            <li>Limit liability in any way not permitted under law</li>
          </ul>
          <p>
            As long as the site is free, we are not liable for any loss or damage of any nature.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Terms;
