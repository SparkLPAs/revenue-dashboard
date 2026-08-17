export type StripeAccount = { envKey: string; pipelineId: string; label: string; };
export const STRIPE_ACCOUNTS: StripeAccount[] = [
  { envKey: "STRIPE_SECRET_KEY",        pipelineId: "online-wills",     label: "Online-Wills.co.uk" },
  { envKey: "STRIPE_SECRET_KEY_OSIRIS", pipelineId: "osiris-solutions",  label: "Osiris Solutions" },
  { envKey: "STRIPE_SECRET_KEY_SPARK",  pipelineId: "sparkmade",         label: "SparkMade" },
  { envKey: "STRIPE_SECRET_KEY_LPAS",   pipelineId: "sparklpas",         label: "SparkLPAs" },
  { envKey: "STRIPE_SECRET_KEY_WILLS",  pipelineId: "sparkwills",        label: "SparkWills" },
];
