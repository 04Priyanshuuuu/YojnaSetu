import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Mail,
  MapPin,
  PhoneCall,
  ShieldCheck,
} from 'lucide-react';

const footerLinkClass =
  'w-fit text-left text-[14px] text-white/75 transition-all duration-200 hover:text-[#B7F21B] hover:translate-x-[2px]';

export const Footer: React.FC = () => {
  const { t } = useTranslation();

  return (
    <footer className="mt-auto w-full bg-[#741321] text-white">

      {/* Main Footer */}
      <div className="mx-auto w-full max-w-[1380px] px-8 py-16 lg:px-12">

        <div className="grid grid-cols-1 gap-14 md:grid-cols-2 lg:grid-cols-4">

          {/* =========================================================
              BRAND / ABOUT
          ========================================================= */}
          <div>

            <Link
              to="/"
              className="flex w-fit items-center gap-4 text-left"
            >
              <div
                className="
                  flex h-[64px] w-[64px] shrink-0
                  items-center justify-center
                  overflow-hidden rounded-2xl
                  bg-[#071A2A]
                  ring-1 ring-white/10
                  shadow-[0_8px_25px_rgba(0,0,0,0.18)]
                "
              >
                <img
                  src="/logo.png"
                  alt="YojnaSetu Logo"
                  className="h-[58px] w-[58px] object-contain"
                />
              </div>

              <span className="text-[25px] font-bold tracking-tight text-white">
                Yojna
                <span className="text-[#B7F21B]">Setu</span>
              </span>
            </Link>

            <p
              className="
                mt-7 max-w-[310px]
                text-[14px] leading-7
                text-white/80
              "
            >
              {t('footer.aboutDesc')}
            </p>

            <div
              className="
                mt-5 flex items-center gap-2
                text-[13px] text-white/65
              "
            >
              <ShieldCheck
                className="h-4 w-4 shrink-0 text-[#B7F21B]"
              />

              <span>
                100% {t('home.gazetteVerified')}
              </span>
            </div>

          </div>


          {/* =========================================================
              QUICK LINKS
          ========================================================= */}
          <div>

            <h3 className="text-[17px] font-bold text-white">
              {t('footer.quickLinks')}
            </h3>

            <div
              className="
                mt-3 h-[2px] w-[55px]
                rounded-full bg-[#B7F21B]
              "
            />

            <div className="mt-7 flex flex-col gap-4">

              <Link
                to="/schemes"
                className={footerLinkClass}
              >
                {t('footer.allSchemes')}
              </Link>

              <Link
                to="/recommendations"
                className={footerLinkClass}
              >
                {t('footer.smartMatch')}
              </Link>

              <Link
                to="/calculator"
                className={footerLinkClass}
              >
                {t('footer.calculator')}
              </Link>

              <Link
                to="/channel-partners"
                className={footerLinkClass}
              >
                {t('footer.partnerCenters')}
              </Link>

              <Link
                to="/login"
                className={footerLinkClass}
              >
                {t('footer.adminPortal')}
              </Link>

            </div>

          </div>


          {/* =========================================================
              INFORMATION
              Replaced Governance & Trust
          ========================================================= */}
          <div>

            <h3 className="text-[17px] font-bold text-white">
              {t('footer.information', 'Information')}
            </h3>

            <div
              className="
                mt-3 h-[2px] w-[55px]
                rounded-full bg-[#B7F21B]
              "
            />

            <div className="mt-7 flex flex-col gap-4">

              <Link
                to="/contact"
                className={footerLinkClass}
              >
                {t('footer.contactUs', 'Contact Us')}
              </Link>

              <Link
                to="/privacy-policy"
                className={footerLinkClass}
              >
                {t('footer.privacyPolicy', 'Privacy Policy')}
              </Link>

              <Link
                to="/profile"
                className={footerLinkClass}
              >
                {t('footer.myProfile', 'My Profile')}
              </Link>

              <Link
                to="/login"
                className={footerLinkClass}
              >
                {t('footer.loginSignup', 'Login / Sign Up')}
              </Link>

            </div>

          </div>


          {/* =========================================================
              CONTACT INFO
          ========================================================= */}
          <div>

            <h3 className="text-[17px] font-bold text-white">
              {t('footer.contactInfo', 'Contact Info')}
            </h3>

            <div
              className="
                mt-3 h-[2px] w-[55px]
                rounded-full bg-[#B7F21B]
              "
            />

            <div className="mt-7 flex flex-col gap-5">

              {/* ---------------- Toll Free ---------------- */}
              <div className="flex items-start gap-4">

                <div
                  className="
                    flex h-10 w-10 shrink-0
                    items-center justify-center
                    rounded-full
                    bg-[#B7F21B]
                    text-[#741321]
                    shadow-[0_5px_15px_rgba(0,0,0,0.12)]
                  "
                >
                  <PhoneCall className="h-4 w-4" />
                </div>

                <div>

                  <p
                    className="
                      text-[11px] font-semibold
                      uppercase tracking-wider
                      text-white/50
                    "
                  >
                    Toll Free
                  </p>

                  <a
                    href="tel:1800112026"
                    title="Call YojnaSetu Helpline"
                    className="
                      mt-1 block
                      text-[14px] leading-6
                      text-white/85
                      transition-colors
                      hover:text-[#B7F21B]
                    "
                  >
                    {t(
                      'footer.helplineText',
                      '1800-11-2026 (Toll-Free, 9 AM - 6 PM IST)'
                    )}
                  </a>

                </div>

              </div>


              {/* ---------------- Email ---------------- */}
              <div className="flex items-start gap-4">

                <div
                  className="
                    flex h-10 w-10 shrink-0
                    items-center justify-center
                    rounded-full
                    bg-[#B7F21B]
                    text-[#741321]
                    shadow-[0_5px_15px_rgba(0,0,0,0.12)]
                  "
                >
                  <Mail className="h-4 w-4" />
                </div>

                <div>

                  <p
                    className="
                      text-[11px] font-semibold
                      uppercase tracking-wider
                      text-white/50
                    "
                  >
                    Email
                  </p>

                  <a
                    href="mailto:support@yojnasetu.gov.in"
                    title="Email YojnaSetu Support"
                    className="
                      mt-1 block break-all
                      text-[14px] leading-6
                      text-white/85
                      transition-colors
                      hover:text-[#B7F21B]
                    "
                  >
                    {t(
                      'footer.supportEmail',
                      'support@yojnasetu.gov.in'
                    )}
                  </a>

                </div>

              </div>


              {/* ---------------- Office ---------------- */}
              <div className="flex items-start gap-4">

                <div
                  className="
                    flex h-10 w-10 shrink-0
                    items-center justify-center
                    rounded-full
                    bg-[#B7F21B]
                    text-[#741321]
                    shadow-[0_5px_15px_rgba(0,0,0,0.12)]
                  "
                >
                  <MapPin className="h-4 w-4" />
                </div>

                <div>

                  <p
                    className="
                      text-[11px] font-semibold
                      uppercase tracking-wider
                      text-white/50
                    "
                  >
                    Office
                  </p>

                  <p
                    className="
                      mt-1 max-w-[230px]
                      text-[14px] leading-6
                      text-white/85
                    "
                  >
                    {t(
                      'footer.ministryAddress',
                      'Ministry of Social Justice & Empowerment, New Delhi, India'
                    )}
                  </p>

                </div>

              </div>

            </div>

          </div>

        </div>

      </div>


      {/* =========================================================
          BOTTOM COPYRIGHT BAR
      ========================================================= */}
      <div className="border-t border-white/15">

        <div
          className="
            mx-auto flex min-h-[65px]
            max-w-[1380px]
            items-center
            px-8
            text-center
            text-[12px]
            text-white/60
            lg:px-12
          "
        >

          <p className="m-0 w-full">
            {t('footer.rights')}
          </p>

        </div>

      </div>

    </footer>
  );
};