/**
 * Meta Instant Form (lead form) structure for Simulation.
 * People fill this on Facebook / Instagram — not on your website.
 */

export type InstantFormFieldId =
  | "full_name"
  | "email"
  | "phone"
  | "city"
  | "state"
  | "country"
  | "postcode"
  | "company"
  | "job_title"
  | "work_email"
  | "dob"
  | "gender"
  | "marital"
  | "custom";

export interface InstantFormField {
  id: InstantFormFieldId;
  label: string;
  group: "Contact" | "Work" | "Demographics" | "Custom";
  requiredDefault?: boolean;
}

export const INSTANT_FORM_FIELDS: readonly InstantFormField[] = [
  { id: "full_name", label: "Full name", group: "Contact", requiredDefault: true },
  { id: "email", label: "Email", group: "Contact", requiredDefault: true },
  { id: "phone", label: "Phone number", group: "Contact" },
  { id: "city", label: "City", group: "Contact" },
  { id: "state", label: "State / province", group: "Contact" },
  { id: "country", label: "Country", group: "Contact" },
  { id: "postcode", label: "Postcode", group: "Contact" },
  { id: "company", label: "Company name", group: "Work" },
  { id: "job_title", label: "Job title", group: "Work" },
  { id: "work_email", label: "Work email", group: "Work" },
  { id: "dob", label: "Date of birth", group: "Demographics" },
  { id: "gender", label: "Gender", group: "Demographics" },
  { id: "marital", label: "Relationship status", group: "Demographics" },
  { id: "custom", label: "Custom question", group: "Custom" },
] as const;

export type InstantFormThankYouCta = "none" | "website" | "call" | "whatsapp" | "messenger";

export interface InstantFormConfig {
  formName: string;
  introHeadline: string;
  introDescription: string;
  privacyUrl: string;
  fields: InstantFormFieldId[];
  /** Extra custom questions in the marketer’s words. */
  customQuestions: string[];
  thankYouHeadline: string;
  thankYouDescription: string;
  thankYouCta: InstantFormThankYouCta;
  thankYouUrl: string;
}

export const DEFAULT_INSTANT_FORM: InstantFormConfig = {
  formName: "Lead form",
  introHeadline: "Get the guide",
  introDescription: "Leave your details. We will follow up soon.",
  privacyUrl: "https://yoursite.com/privacy",
  fields: ["full_name", "email", "phone"],
  customQuestions: [],
  thankYouHeadline: "Thanks — you’re in.",
  thankYouDescription: "We will message you shortly.",
  thankYouCta: "none",
  thankYouUrl: "",
};

export function summarizeInstantForm(form: InstantFormConfig): string {
  const n = form.fields.length + form.customQuestions.filter((q) => q.trim()).length;
  return `${form.formName} · ${n} questions · thank-you ${form.thankYouCta === "none" ? "plain" : form.thankYouCta}`;
}
