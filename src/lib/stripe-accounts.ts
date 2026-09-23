export type StripeAccount = { envKey: string; pipelineId: string; label: string; };
export const STRIPE_ACCOUNTS: StripeAccount[] = [
  { envKey: "STRIPE_SECRET_KEY",           pipelineId: "online-wills",     label: "Online-Wills.co.uk" },
  { envKey: "STRIPE_SECRET_KEY_OSIRIS",    pipelineId: "osiris-solutions",  label: "Osiris Solutions" },
  { envKey: "STRIPE_SECRET_KEY_SPARK",     pipelineId: "sparkmade",         label: "SparkMade" },
  { envKey: "STRIPE_SECRET_KEY_LPAS",      pipelineId: "sparklpas",         label: "SparkLPAs" },
  { envKey: "STRIPE_SECRET_KEY_WILLS",     pipelineId: "sparkwills",        label: "SparkWills" },
  { envKey: "STRIPE_SECRET_KEY_TRUSTS",    pipelineId: "sparktrusts",       label: "SparkTrusts" },
  // Partner platform-fee subscriptions (WillSuite/SparkLegal checkout in
  // spark-partner-dashboard) — same Stripe account that app already uses,
  // just not previously synced anywhere in this dashboard. Set this env
  // var to the same secret key value as spark-partner-dashboard's own
  // STRIPE_SECRET_KEY (a different Vercel project, so it isn't shared
  // automatically). pipelineId is deliberately not "spark-solutions" — an
  // existing Leads/Enquiry pipeline (marketing-site demo requests) already
  // has that exact id.
  { envKey: "STRIPE_SECRET_KEY_SOLUTIONS", pipelineId: "spark-solutions-subscriptions", label: "Spark Solutions Subscriptions" },
];
