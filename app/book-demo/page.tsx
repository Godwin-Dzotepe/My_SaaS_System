'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Check } from 'lucide-react';

const enrollmentOptions = ['1-100', '101-200', '201-500', '500-1000', '1000+'] as const;

type EnrollmentRange = (typeof enrollmentOptions)[number] | '';

type Step = 1 | 2;

export default function BookDemoPage() {
  const [step, setStep] = useState<Step>(1);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    schoolName: '',
    schoolLocation: '',
    averageEnrollment: '' as EnrollmentRange,
    currentSystem: '',
    currentSystemGaps: '',
    mainChallenges: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const activeStage = successMessage ? 3 : step;
  const progress = useMemo(() => ((activeStage - 1) / 2) * 100, [activeStage]);
  const enrollmentIndex =
    formData.averageEnrollment === '' ? 0 : Math.max(0, enrollmentOptions.indexOf(formData.averageEnrollment));

  const updateField =
    (field: keyof typeof formData) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData((current) => ({
        ...current,
        [field]: event.target.value,
      }));
    };

  const handleEnrollmentSelect = (value: EnrollmentRange) => {
    setFormData((current) => ({ ...current, averageEnrollment: value }));
  };

  const handleEnrollmentSlider = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextIndex = Number(event.target.value);
    const selected = enrollmentOptions[nextIndex];
    if (selected) {
      handleEnrollmentSelect(selected);
    }
  };

  const validateStepOne = () => {
    if (!formData.fullName.trim()) return 'Full Name is required.';
    if (!formData.email.trim()) return 'E-mail is required.';
    if (!formData.phoneNumber.trim()) return 'Phone Number is required.';
    if (!formData.schoolName.trim()) return 'School Name is required.';
    if (!formData.schoolLocation.trim()) return 'School location is required.';
    return '';
  };

  const goNextStep = () => {
    setErrorMessage('');
    const stepOneError = validateStepOne();
    if (stepOneError) {
      setErrorMessage(stepOneError);
      return;
    }

    setStep(2);
  };

  const goBackStep = () => {
    setErrorMessage('');
    setStep(1);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!formData.averageEnrollment) {
      setErrorMessage('Please select the average enrollment range for your school.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/book-demo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to submit your demo request.');
      }

      setSuccessMessage(data?.message || 'Thank you. Your demo request has been received. Our team will contact you shortly.');
      setFormData({
        fullName: '',
        email: '',
        phoneNumber: '',
        schoolName: '',
        schoolLocation: '',
        averageEnrollment: '',
        currentSystem: '',
        currentSystemGaps: '',
        mainChallenges: '',
      });
      setStep(1);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to submit your demo request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-100 px-4 py-8 sm:px-6 sm:py-10 lg:px-10">
      <Image
        src="/image/login-school-campus.jpg"
        alt="School campus"
        fill
        priority
        quality={100}
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.95)_0%,rgba(245,247,252,0.92)_45%,rgba(219,234,254,0.9)_100%)]" />

      <div className="relative z-10 mx-auto max-w-6xl">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-400 hover:text-blue-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <section className="rounded-[28px] border border-slate-200 bg-white/95 p-5 shadow-[0_20px_70px_rgba(15,23,42,0.12)] backdrop-blur-sm sm:p-8 lg:p-10">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl lg:text-5xl">
            How do we contact you? Provide your details below!
          </h1>

          <div className="mt-8 sm:mt-10">
            <div className="relative">
              <div className="absolute left-6 right-6 top-6 h-1 rounded-full bg-slate-200 sm:left-10 sm:right-10" />
              <div
                className="absolute left-6 top-6 h-1 rounded-full bg-blue-600 transition-all duration-300 sm:left-10"
                style={{ width: `calc((100% - 3rem) * ${progress / 100})` }}
              />

              <div className="relative grid grid-cols-3 gap-3">
                {[1, 2, 3].map((stepNumber) => {
                  const isComplete = stepNumber < activeStage;
                  const isCurrent = stepNumber === activeStage;

                  return (
                    <div key={stepNumber} className="flex flex-col items-center text-center">
                      <div
                        className={`z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 text-sm font-bold transition ${
                          isComplete || isCurrent
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-slate-300 bg-white text-slate-500'
                        }`}
                      >
                        {isComplete ? <Check className="h-5 w-5" /> : stepNumber}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 text-center text-sm leading-6 text-slate-500 sm:grid-cols-3">
              <p className={`font-semibold ${activeStage >= 1 ? 'text-slate-900' : 'text-slate-400'}`}>
                Enter your contact details
              </p>
              <p className={`font-semibold ${activeStage >= 2 ? 'text-slate-900' : 'text-slate-400'}`}>
                Tell us your current system needs
              </p>
              <p className={`font-semibold ${activeStage >= 3 ? 'text-slate-900' : 'text-slate-400'}`}>
                Submit for review and response
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-10 space-y-6">
            {successMessage ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {successMessage}
              </div>
            ) : null}

            {errorMessage ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {errorMessage}
              </div>
            ) : null}

            {step === 1 ? (
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Full Name">
                  <input
                    required
                    value={formData.fullName}
                    onChange={updateField('fullName')}
                    placeholder="Enter your full name"
                    className="h-12 w-full rounded-xl border border-slate-300 px-4 text-base outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </Field>

                <Field label="E-mail">
                  <input
                    required
                    type="email"
                    value={formData.email}
                    onChange={updateField('email')}
                    placeholder="Enter your e-mail"
                    className="h-12 w-full rounded-xl border border-slate-300 px-4 text-base outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </Field>

                <Field label="Phone Number">
                  <input
                    required
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={updateField('phoneNumber')}
                    placeholder="+233-00-000-0000"
                    className="h-12 w-full rounded-xl border border-slate-300 px-4 text-base outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </Field>

                <Field label="School Name">
                  <input
                    required
                    value={formData.schoolName}
                    onChange={updateField('schoolName')}
                    placeholder="Enter school name"
                    className="h-12 w-full rounded-xl border border-slate-300 px-4 text-base outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </Field>

                <Field label="Where is the school located?" className="md:col-span-2">
                  <input
                    required
                    value={formData.schoolLocation}
                    onChange={updateField('schoolLocation')}
                    placeholder="Enter the school location"
                    className="h-12 w-full rounded-xl border border-slate-300 px-4 text-base outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </Field>
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="What is the average enrollment in your school right now?" className="md:col-span-2">
                  <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <input
                      type="range"
                      min={0}
                      max={enrollmentOptions.length - 1}
                      step={1}
                      value={enrollmentIndex}
                      onChange={handleEnrollmentSlider}
                      className="w-full accent-blue-600"
                    />
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                      {enrollmentOptions.map((option) => {
                        const selected = formData.averageEnrollment === option;
                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => handleEnrollmentSelect(option)}
                            className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                              selected
                                ? 'border-blue-600 bg-blue-50 text-blue-700'
                                : 'border-slate-300 bg-white text-slate-700 hover:border-blue-300'
                            }`}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </Field>

                <Field label="Enter name of your current school management system if any" className="md:col-span-2">
                  <textarea
                    value={formData.currentSystem}
                    onChange={updateField('currentSystem')}
                    placeholder="Type your response here"
                    className="min-h-28 w-full resize-y rounded-xl border border-slate-300 px-4 py-3 text-base outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </Field>

                <Field
                  label="What are some of the things your current school management system is unable to do for you?"
                  className="md:col-span-2"
                >
                  <textarea
                    value={formData.currentSystemGaps}
                    onChange={updateField('currentSystemGaps')}
                    placeholder="Type your response here"
                    className="min-h-28 w-full resize-y rounded-xl border border-slate-300 px-4 py-3 text-base outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </Field>

                <Field
                  label="What are your main challenges you wish the school management system could solve for you?"
                  className="md:col-span-2"
                >
                  <textarea
                    value={formData.mainChallenges}
                    onChange={updateField('mainChallenges')}
                    placeholder="Type your response here"
                    className="min-h-28 w-full resize-y rounded-xl border border-slate-300 px-4 py-3 text-base outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </Field>
              </div>
            )}

            <div className="pt-2">
              {step === 1 ? (
                <button
                  type="button"
                  onClick={goNextStep}
                  className="inline-flex h-12 items-center justify-center rounded-2xl bg-blue-600 px-10 text-lg font-semibold text-white transition hover:bg-blue-700"
                >
                  Next
                </button>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={goBackStep}
                    className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-300 bg-white px-8 text-base font-semibold text-slate-700 transition hover:border-blue-400 hover:text-blue-600"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex h-12 items-center justify-center rounded-2xl bg-blue-600 px-10 text-lg font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit'}
                  </button>
                </div>
              )}
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="mb-2 block text-base font-semibold text-slate-900 sm:text-lg">{label}</label>
      {children}
    </div>
  );
}
