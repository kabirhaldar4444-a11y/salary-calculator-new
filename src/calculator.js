export const DEFAULT_INPUTS = Object.freeze({
  annualCtc: 2_000_000,
  basicPercent: 50,
  hraPercent: 40,
  siteAllowance: 0,
  otherBenefits: 0,
  pfApplicable: true,
  pfRate: 12,
  pfCeiling: 25_000,
  pfHigherWages: true,
  gratuityRate: 4.807692308,
  projectBonus: 500_000,
});

const toFiniteNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const nonNegative = (value, fallback = 0) => Math.max(0, toFiniteNumber(value, fallback));
const percentage = (value, fallback = 0) => Math.min(100, nonNegative(value, fallback));

export function normalizeInputs(values = {}) {
  return {
    annualCtc: nonNegative(values.annualCtc, DEFAULT_INPUTS.annualCtc),
    basicPercent: percentage(values.basicPercent, DEFAULT_INPUTS.basicPercent),
    hraPercent: percentage(values.hraPercent, DEFAULT_INPUTS.hraPercent),
    siteAllowance: nonNegative(values.siteAllowance, DEFAULT_INPUTS.siteAllowance),
    otherBenefits: nonNegative(values.otherBenefits, DEFAULT_INPUTS.otherBenefits),
    pfApplicable: values.pfApplicable ?? DEFAULT_INPUTS.pfApplicable,
    pfRate: percentage(values.pfRate, DEFAULT_INPUTS.pfRate),
    pfCeiling: nonNegative(values.pfCeiling, DEFAULT_INPUTS.pfCeiling),
    pfHigherWages: values.pfHigherWages ?? DEFAULT_INPUTS.pfHigherWages,
    gratuityRate: percentage(values.gratuityRate, DEFAULT_INPUTS.gratuityRate),
    projectBonus: nonNegative(values.projectBonus, DEFAULT_INPUTS.projectBonus),
  };
}

export function calculateSalary(values = {}) {
  const inputs = normalizeInputs(values);
  const basicAnnual = inputs.annualCtc * (inputs.basicPercent / 100);
  const hraAnnual = basicAnnual * (inputs.hraPercent / 100);
  const basicMonthly = basicAnnual / 12;

  const pfMonthlyWage = inputs.pfApplicable
    ? inputs.pfHigherWages
      ? basicMonthly
      : Math.min(basicMonthly, inputs.pfCeiling)
    : 0;

  const pfAnnual = inputs.pfApplicable ? pfMonthlyWage * 12 * (inputs.pfRate / 100) : 0;
  const gratuityAnnual = basicAnnual * (inputs.gratuityRate / 100);

  // This follows the supplied sheet, which includes both employee and employer PF in the CTC allocation.
  // Site allowance and other benefits now reduce the balancing allowance instead of remaining unused inputs.
  const fixedAllocation =
    basicAnnual +
    hraAnnual +
    inputs.siteAllowance +
    inputs.otherBenefits +
    pfAnnual +
    pfAnnual +
    gratuityAnnual;

  const specialAnnual = inputs.annualCtc - fixedAllocation;

  const components = [
    {
      key: "basic",
      label: "Basic salary",
      annual: basicAnnual,
      basis: `${inputs.basicPercent.toFixed(2)}% of annual CTC`,
      color: "#234a73",
    },
    {
      key: "hra",
      label: "House rent allowance",
      annual: hraAnnual,
      basis: `${inputs.hraPercent.toFixed(2)}% of basic salary`,
      color: "#4f7cac",
    },
    {
      key: "special",
      label: "Special / flexi allowance",
      annual: specialAnnual,
      basis: "Balancing component",
      color: "#e07a5f",
    },
    {
      key: "site",
      label: "Site / project allowance",
      annual: inputs.siteAllowance,
      basis: "Annual input",
      color: "#d39b45",
    },
    {
      key: "benefits",
      label: "Other benefits",
      annual: inputs.otherBenefits,
      basis: "Annual input",
      color: "#8f6aa7",
    },
    {
      key: "employeePf",
      label: "Employee PF contribution",
      annual: pfAnnual,
      basis: inputs.pfApplicable ? `${inputs.pfRate.toFixed(2)}% of PF wage` : "PF not applicable",
      color: "#4a8c7b",
    },
    {
      key: "employerPf",
      label: "Employer PF contribution",
      annual: pfAnnual,
      basis: inputs.pfApplicable ? `${inputs.pfRate.toFixed(2)}% of PF wage` : "PF not applicable",
      color: "#75a88f",
    },
    {
      key: "gratuity",
      label: "Gratuity provision",
      annual: gratuityAnnual,
      basis: `${inputs.gratuityRate.toFixed(4)}% of basic salary`,
      color: "#aab7c4",
    },
  ].map((component) => ({
    ...component,
    monthly: component.annual / 12,
    percentOfCtc: inputs.annualCtc ? component.annual / inputs.annualCtc : 0,
  }));

  const allocatedAnnual = components.reduce((sum, component) => sum + component.annual, 0);
  const grossAnnual = basicAnnual + hraAnnual + specialAnnual + inputs.siteAllowance + inputs.otherBenefits;
  const monthlyGross = grossAnnual / 12;
  const monthlyEmployeePf = pfAnnual / 12;
  const monthlyTakeHomeBeforeTax = monthlyGross - monthlyEmployeePf;
  const monthlyEmployerContributions = (pfAnnual + gratuityAnnual) / 12;
  const allowanceAnnual = hraAnnual + specialAnnual + inputs.siteAllowance + inputs.otherBenefits;
  const allowanceShare = inputs.annualCtc ? allowanceAnnual / inputs.annualCtc : 0;
  const ctcDifference = inputs.annualCtc - allocatedAnnual;

  return {
    inputs,
    components,
    basicAnnual,
    hraAnnual,
    specialAnnual,
    pfAnnual,
    pfMonthlyWage,
    gratuityAnnual,
    allocatedAnnual,
    grossAnnual,
    monthlyGross,
    monthlyEmployeePf,
    monthlyTakeHomeBeforeTax,
    monthlyEmployerContributions,
    allowanceShare,
    ctcDifference,
    hasNegativeBalance: specialAnnual < 0,
  };
}

