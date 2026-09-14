import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Alert } from '../components/Alert';
import { GoogleAuthButton } from '../components/GoogleAuthButton';
import { UserRole } from '../types';
import {
  UserPlus,
  Mail,
  Lock,
  Phone,
  Eye,
  EyeOff,
} from 'lucide-react';

export const Register: React.FC = () => {
  const { t } = useTranslation();
  const { register } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('BENEFICIARY');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email && !phone) {
      setErrorMsg(
        'Please provide either an email address or phone number.'
      );
      return;
    }

    if (!password || password.length < 8) {
      setErrorMsg(
        'Password must be at least 8 characters long.'
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await register({
        email: email ? email.trim() : undefined,
        phone: phone ? phone.trim() : undefined,
        password,
      });

      navigate('/dashboard');
    } catch (err: any) {
      let detail =
        'Registration failed. User with this email/phone may already exist.';

      if (!err?.response) {
        detail =
          'Unable to connect to YojnaSetu server. Please try again.';
      } else if (
        typeof err?.response?.data?.detail === 'string'
      ) {
        detail = err.response.data.detail;
      } else if (
        Array.isArray(err?.response?.data?.detail)
      ) {
        detail = err.response.data.detail
          .map((d: any) => d?.msg)
          .join(', ');
      }

      setErrorMsg(detail);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#fffaf5] flex">

      {/* =========================================================
          LEFT BRANDING SECTION
      ========================================================== */}
      <div
        className="
          hidden lg:flex
          lg:w-[48%]
          min-h-screen
          relative
          overflow-hidden
          bg-[#871525]
        "
      >
        {/* Subtle decorative shapes */}
        <div
          className="
            absolute
            -top-32
            -left-32
            w-[420px]
            h-[420px]
            rounded-full
            bg-[#9d1b2d]
            opacity-40
          "
        />

        <div
          className="
            absolute
            -bottom-48
            -right-48
            w-[520px]
            h-[520px]
            rounded-full
            bg-[#6f101e]
            opacity-50
          "
        />

        <div
          className="
            relative
            z-10
            w-full
            px-14
            xl:px-20
            py-14
            flex
            flex-col
            justify-between
          "
        >

          {/* Logo */}
          <div>
            <img
              src="/logo.png"
              alt="YojnaSetu Logo"
              className="
                w-16
                h-16
                rounded-2xl
                object-contain
                bg-[#071b2b]
                p-1.5
                border
                border-white/20
                shadow-lg
              "
            />
          </div>

          {/* Main Content */}
          <div className="my-auto py-16">

            <p
              className="
                text-[#ffd166]
                text-sm
                font-bold
                uppercase
                tracking-[0.22em]
                mb-5
              "
            >
              YojnaSetu
            </p>

            <h1
              className="
                text-white
                text-5xl
                xl:text-6xl
                font-extrabold
                leading-[1.08]
                tracking-tight
              "
            >
              Welcome to
              <br />

              <span className="text-[#ffd166]">
                YojnaSetu
              </span>

              <br />

              Create Excellence
              <br />

              With Us
            </h1>

            <p
              className="
                mt-8
                text-white/80
                text-lg
                xl:text-xl
                leading-relaxed
                max-w-[570px]
              "
            >
              Discover government schemes and financial
              assistance designed to make your financial
              journey simpler and easier.
            </p>

            {/* Decorative Arrow */}
            <div className="mt-12 flex items-center">
              <div
                className="
                  h-[48px]
                  w-[185px]
                  bg-[#ffd166]
                  flex
                  items-center
                  justify-center
                  relative
                "
              >
                <span
                  className="
                    text-[#65101d]
                    text-[10px]
                    font-extrabold
                    text-center
                    leading-tight
                  "
                >
                  Guiding Financial
                  <br />
                  Journeys
                </span>

                <div
                  className="
                    absolute
                    left-full
                    top-0
                    w-0
                    h-0
                    border-t-[24px]
                    border-t-transparent
                    border-b-[24px]
                    border-b-transparent
                    border-l-[38px]
                    border-l-[#ffd166]
                  "
                />
              </div>
            </div>
          </div>

          {/* Bottom small text */}
          <div className="text-white/50 text-xs">
            Government schemes & financial assistance
          </div>
        </div>
      </div>

      {/* =========================================================
          RIGHT REGISTER SECTION
      ========================================================== */}
      <div
        className="
          w-full
          lg:w-[52%]
          min-h-screen
          bg-[#fffaf5]
          flex
          items-center
          justify-center
          px-5
          sm:px-8
          lg:px-14
          xl:px-20
          py-10
          overflow-y-auto
        "
      >
        <div className="w-full max-w-[500px]">

          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-7">
            <img
              src="/logo.png"
              alt="YojnaSetu Logo"
              className="
                w-16
                h-16
                rounded-2xl
                object-contain
                bg-[#071b2b]
                p-1.5
                shadow-md
              "
            />
          </div>

          {/* Heading */}
          <div className="mb-8">

            <div
              className="
                text-[#8b1727]
                text-sm
                font-bold
                uppercase
                tracking-[0.2em]
                mb-3
              "
            >
              Get Started
            </div>

            <h2
              className="
                text-[#071b2b]
                text-4xl
                sm:text-5xl
                font-extrabold
                tracking-tight
                leading-tight
              "
            >
              Create Your Account
            </h2>

            <p
              className="
                mt-3
                text-[#667789]
                text-base
                sm:text-lg
                leading-relaxed
              "
            >
              Join YojnaSetu and simplify your financial
              assistance journey.
            </p>
          </div>

          {/* Error */}
          {errorMsg && (
            <div className="mb-5">
              <Alert type="error">
                {errorMsg}
              </Alert>
            </div>
          )}

          {/* Google */}
          <div className="mb-6">
            <div
              className="
                [&>button]:!w-full
                [&>button]:!h-[58px]
                [&>button]:!rounded-xl
              "
            >
              <GoogleAuthButton
                mode="register"
                onSuccess={() => {
                  navigate('/dashboard', {
                    replace: true,
                  });
                }}
                onError={(msg) => setErrorMsg(msg)}
              />
            </div>
          </div>

          {/* OR */}
          <div
            className="
              relative
              flex
              items-center
              justify-center
              my-7
            "
          >
            <div className="border-t border-[#e3d9d3] w-full" />

            <span
              className="
                absolute
                bg-[#fffaf5]
                px-4
                text-[11px]
                font-bold
                text-[#9b9692]
                uppercase
                tracking-[0.2em]
              "
            >
              {t('common.or', 'OR')}
            </span>
          </div>

          {/* =====================================================
              FORM
          ====================================================== */}
          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >

            {/* Email */}
            <div className="relative">
              <Mail
                className="
                  absolute
                  left-5
                  top-1/2
                  -translate-y-1/2
                  w-5
                  h-5
                  text-[#8795a1]
                  pointer-events-none
                "
              />

              <input
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                placeholder={t(
                  'auth.emailPlaceholder',
                  'Email Address'
                )}
                className="
                  w-full
                  h-[60px]
                  pl-14
                  pr-5
                  rounded-xl
                  border
                  border-[#dcd7d2]
                  bg-white
                  text-[#071b2b]
                  text-base
                  placeholder:text-[#9aa4ad]
                  outline-none
                  shadow-sm
                  transition-all
                  duration-200
                  focus:border-[#8b1727]
                  focus:ring-2
                  focus:ring-[#8b1727]/10
                "
              />
            </div>

            {/* Phone */}
            <div className="relative">
              <Phone
                className="
                  absolute
                  left-5
                  top-1/2
                  -translate-y-1/2
                  w-5
                  h-5
                  text-[#8795a1]
                  pointer-events-none
                "
              />

              <input
                type="tel"
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value)
                }
                placeholder="Phone Number"
                className="
                  w-full
                  h-[60px]
                  pl-14
                  pr-5
                  rounded-xl
                  border
                  border-[#dcd7d2]
                  bg-white
                  text-[#071b2b]
                  text-base
                  placeholder:text-[#9aa4ad]
                  outline-none
                  shadow-sm
                  transition-all
                  duration-200
                  focus:border-[#8b1727]
                  focus:ring-2
                  focus:ring-[#8b1727]/10
                "
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock
                className="
                  absolute
                  left-5
                  top-1/2
                  -translate-y-1/2
                  w-5
                  h-5
                  text-[#8795a1]
                  pointer-events-none
                "
              />

              <input
                type={
                  showPassword
                    ? 'text'
                    : 'password'
                }
                required
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                placeholder="Create Password"
                className="
                  w-full
                  h-[60px]
                  pl-14
                  pr-14
                  rounded-xl
                  border
                  border-[#dcd7d2]
                  bg-white
                  text-[#071b2b]
                  text-base
                  placeholder:text-[#9aa4ad]
                  outline-none
                  shadow-sm
                  transition-all
                  duration-200
                  focus:border-[#8b1727]
                  focus:ring-2
                  focus:ring-[#8b1727]/10
                "
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    (prev) => !prev
                  )
                }
                className="
                  absolute
                  right-5
                  top-1/2
                  -translate-y-1/2
                  text-[#8b959e]
                  hover:text-[#8b1727]
                  transition
                "
                aria-label={
                  showPassword
                    ? 'Hide password'
                    : 'Show password'
                }
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="
                w-full
                h-[60px]
                mt-2
                bg-[#8b1727]
                hover:bg-[#761320]
                active:bg-[#65101d]
                text-white
                font-bold
                text-base
                rounded-xl
                transition-all
                duration-200
                flex
                items-center
                justify-center
                gap-2
                shadow-md
                hover:shadow-lg
                disabled:opacity-50
                disabled:cursor-not-allowed
              "
            >
              {isSubmitting ? (
                <span
                  className="
                    w-5
                    h-5
                    border-2
                    border-white
                    border-t-transparent
                    rounded-full
                    animate-spin
                  "
                />
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />

                  <span>
                    {t(
                      'auth.registerBtn',
                      'Create Account'
                    )}
                  </span>
                </>
              )}
            </button>
          </form>

          {/* Login */}
          <div
            className="
              text-center
              mt-8
              text-base
              text-[#6f7c87]
            "
          >
            {t(
              'auth.hasAccount',
              'Already have an account?'
            )}{' '}

            <Link
              to="/login"
              className="
                font-bold
                text-[#8b1727]
                hover:text-[#65101d]
                transition
              "
            >
              {t(
                'auth.signInBtn',
                'Log in'
              )}
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};