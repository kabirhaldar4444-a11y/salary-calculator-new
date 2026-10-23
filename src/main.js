import { calculateSalary, DEFAULT_INPUTS } from "./calculator.js";

const moneyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const preciseMoneyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const percentFormatter = new Intl.NumberFormat("en-IN", {
  style: "percent",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const form = document.querySelector("#salary-form");
const fields = Object.fromEntries(
  Object.keys(DEFAULT_INPUTS).map((key) => [key, document.querySelector(`#${key}`)]),
);

const output = {
  heroCtc: document.querySelector("#hero-ctc"),
  heroMonthlyCtc: document.querySelector("#hero-monthly-ctc"),
  monthlyTakeHome: document.querySelector("#monthly-take-home"),
  monthlyGross: document.querySelector("#monthly-gross"),
  monthlyEmployeePf: document.querySelector("#monthly-employee-pf"),
  monthlyEmployerCost: document.querySelector("#monthly-employer-cost"),
  structureWarning: document.querySelector("#structure-warning"),
  breakdownBody: document.querySelector("#breakdown-body"),
  totalAnnual: document.querySelector("#total-annual"),
  totalMonthly: document.querySelector("#total-monthly"),
  ctcCheck: document.querySelector("#ctc-check"),
  allowanceShare: document.querySelector("#allowance-share"),
  allowanceMessage: document.querySelector("#allowance-message"),
  pfMonthlyWage: document.querySelector("#pf-monthly-wage"),
  pfWageMessage: document.querySelector("#pf-wage-message"),
  annualGratuity: document.querySelector("#annual-gratuity"),
  projectBonus: document.querySelector("#project-bonus-output"),
  compositionBar: document.querySelector("#composition-bar"),
  compositionLegend: document.querySelector("#composition-legend"),
  reconciledPill: document.querySelector("#reconciled-pill"),
  pfFields: document.querySelector("#pf-fields"),
};

let currentResult = calculateSalary(DEFAULT_INPUTS);

function formatMoney(value, precise = false) {
  const formatter = precise ? preciseMoneyFormatter : moneyFormatter;
  return formatter.format(Math.abs(value) < 0.005 ? 0 : value);
}

function valuesFromForm() {
  return Object.fromEntries(
    Object.entries(fields).map(([key, element]) => [
      key,
      element.type === "checkbox" ? element.checked : element.value,
    ]),
  );
}

function setFormValues(values) {
  Object.entries(values).forEach(([key, value]) => {
    const element = fields[key];
    if (!element) return;
    if (element.type === "checkbox") element.checked = Boolean(value);
    else element.value = value;
  });
}

function renderBreakdown(result) {
  output.breakdownBody.replaceChildren(
    ...result.components
      .filter((component) => component.annual !== 0 || ["special", "employeePf", "employerPf"].includes(component.key))
      .map((component) => {
        const row = document.createElement("tr");
        if (component.annual < 0) row.classList.add("negative-row");

        const label = document.createElement("th");
        label.scope = "row";
        label.textContent = component.label;

        const annual = document.createElement("td");
        annual.textContent = formatMoney(component.annual, true);

        const monthly = document.createElement("td");
        monthly.textContent = formatMoney(component.monthly, true);

        const share = document.createElement("td");
        share.textContent = percentFormatter.format(component.percentOfCtc);

        const basis = document.createElement("td");
        basis.textContent = component.basis;

        row.append(label, annual, monthly, share, basis);
        return row;
      }),
  );
}

function renderComposition(result) {
  const visibleComponents = result.components.filter((component) => component.annual > 0);
  output.compositionBar.replaceChildren(
    ...visibleComponents.map((component) => {
      const segment = document.createElement("span");
      segment.style.width = `${Math.max(component.percentOfCtc * 100, 0)}%`;
      segment.style.backgroundColor = component.color;
      segment.title = `${component.label}: ${percentFormatter.format(component.percentOfCtc)}`;
      segment.setAttribute("aria-label", segment.title);
      return segment;
    }),
  );

  output.compositionLegend.replaceChildren(
    ...visibleComponents.map((component) => {
      const item = document.createElement("div");
      const swatch = document.createElement("span");
      swatch.className = "legend-swatch";
      swatch.style.backgroundColor = component.color;
      const text = document.createElement("span");
      text.textContent = `${component.label} ${percentFormatter.format(component.percentOfCtc)}`;
      item.append(swatch, text);
      return item;
    }),
  );
}

function render() {
  currentResult = calculateSalary(valuesFromForm());
  const { inputs } = currentResult;

  output.heroCtc.textContent = formatMoney(inputs.annualCtc);
  output.heroMonthlyCtc.textContent = `${formatMoney(inputs.annualCtc / 12)} per month`;
  output.monthlyTakeHome.textContent = formatMoney(currentResult.monthlyTakeHomeBeforeTax);
  output.monthlyGross.textContent = formatMoney(currentResult.monthlyGross);
  output.monthlyEmployeePf.textContent = formatMoney(currentResult.monthlyEmployeePf);
  output.monthlyEmployerCost.textContent = formatMoney(currentResult.monthlyEmployerContributions);
  output.structureWarning.hidden = !currentResult.hasNegativeBalance;
  output.totalAnnual.textContent = formatMoney(inputs.annualCtc, true);
  output.totalMonthly.textContent = formatMoney(inputs.annualCtc / 12, true);
  output.ctcCheck.textContent = formatMoney(currentResult.ctcDifference, true);
  output.allowanceShare.textContent = currentResult.hasNegativeBalance
    ? "n.a."
    : percentFormatter.format(currentResult.allowanceShare);
  output.allowanceMessage.textContent = currentResult.hasNegativeBalance
    ? "Resolve the negative flexi allowance before reviewing this share"
    : currentResult.allowanceShare > 0.5
      ? "Above the 50% review threshold used in the source sheet"
      : "At or below the 50% review threshold used in the source sheet";
  output.pfMonthlyWage.textContent = formatMoney(currentResult.pfMonthlyWage, true);
  output.pfWageMessage.textContent = inputs.pfApplicable
    ? inputs.pfHigherWages
      ? "Full monthly basic wage used"
      : `Capped at ${formatMoney(inputs.pfCeiling)} per month`
    : "PF is not included";
  output.annualGratuity.textContent = formatMoney(currentResult.gratuityAnnual, true);
  output.projectBonus.textContent = formatMoney(inputs.projectBonus);
  output.pfFields.classList.toggle("is-disabled", !inputs.pfApplicable);
  output.reconciledPill.textContent = Math.abs(currentResult.ctcDifference) < 0.01 ? "Reconciled" : "Review totals";
  output.reconciledPill.classList.toggle("is-warning", Math.abs(currentResult.ctcDifference) >= 0.01);

  renderBreakdown(currentResult);
  renderComposition(currentResult);
}

function downloadCsv() {
  const rows = [
    ["Component", "Annual (INR)", "Monthly (INR)", "% of CTC", "Basis"],
    ...currentResult.components.map((component) => [
      component.label,
      component.annual.toFixed(2),
      component.monthly.toFixed(2),
      (component.percentOfCtc * 100).toFixed(2),
      component.basis,
    ]),
    ["Total annual CTC", currentResult.inputs.annualCtc.toFixed(2), (currentResult.inputs.annualCtc / 12).toFixed(2), "100.00", "Annual CTC input"],
    [],
    ["Project completion bonus (outside CTC)", currentResult.inputs.projectBonus.toFixed(2)],
    ["Estimated monthly take-home before tax", currentResult.monthlyTakeHomeBeforeTax.toFixed(2)],
  ];

  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "salary-structure.csv";
  link.click();
  URL.revokeObjectURL(url);
}

setFormValues(DEFAULT_INPUTS);
form.addEventListener("input", render);
form.addEventListener("change", render);

document.querySelectorAll(".preset").forEach((button) => {
  button.addEventListener("click", () => {
    fields.annualCtc.value = button.dataset.ctc;
    render();
  });
});

document.querySelector("#reset-button").addEventListener("click", () => {
  setFormValues(DEFAULT_INPUTS);
  render();
});

document.querySelector("#download-button").addEventListener("click", downloadCsv);
document.querySelector("#print-button").addEventListener("click", () => window.print());

render();

