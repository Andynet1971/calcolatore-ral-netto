const euro = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
});

const ralInput = document.getElementById("ralInput");
const calcButton = document.getElementById("calcButton");
const prefillButton = document.getElementById("prefillButton");
const errorBox = document.getElementById("errorBox");

const nettoAnnuoEl = document.getElementById("nettoAnnuo");
const nettoMensileEl = document.getElementById("nettoMensile");
const tasseTotaliEl = document.getElementById("tasseTotali");
const breakdownBody = document.getElementById("breakdownBody");

function calcolaContributiINPS(ral) {
  const aliquotaINPS = 0.095;
  return ral * aliquotaINPS;
}

function calcolaIrpef(imponibile) {
  let imposta = 0;

  const sc1 = 28000;
  const sc2 = 50000;

  if (imponibile <= 0) return 0;

  if (imponibile <= sc1) {
    imposta = imponibile * 0.23;
  } else if (imponibile <= sc2) {
    imposta = sc1 * 0.23 + (imponibile - sc1) * 0.35;
  } else {
    imposta =
      sc1 * 0.23 +
      (sc2 - sc1) * 0.35 +
      (imponibile - sc2) * 0.43;
  }

  return imposta;
}

function calcolaAddizionaleRegionale(imponibile) {
  if (imponibile <= 0) return 0;

  const brackets = [
    { limit: 15000, rate: 0.0123 },
    { limit: 28000, rate: 0.0158 },
    { limit: 50000, rate: 0.0172 },
    { limit: Infinity, rate: 0.0173 },
  ];

  let remaining = imponibile;
  let prevLimit = 0;
  let imposta = 0;

  for (const b of brackets) {
    if (remaining <= 0) break;

    const taxableInBracket = Math.min(remaining, b.limit - prevLimit);
    if (taxableInBracket > 0) {
      imposta += taxableInBracket * b.rate;
      remaining -= taxableInBracket;
    }
    prevLimit = b.limit;
  }

  return imposta;
}

function calcolaAddizionaleComunale(imponibile) {
  if (imponibile <= 0) return 0;
  return imponibile * 0.008;
}

function calcolaNettoDaRal(ral) {
  const ralNum = Number(ral);
  if (!Number.isFinite(ralNum) || ralNum <= 0) {
    throw new Error("Inserisci una RAL valida maggiore di zero.");
  }

  const contributiInps = calcolaContributiINPS(ralNum);
  const imponibile = Math.max(ralNum - contributiInps, 0);
  const irpef = calcolaIrpef(imponibile);
  const addReg = calcolaAddizionaleRegionale(imponibile);
  const addCom = calcolaAddizionaleComunale(imponibile);

  const tasseTotali = contributiInps + irpef + addReg + addCom;
  const nettoAnnuo = Math.max(ralNum - tasseTotali, 0);
  const nettoMensile = nettoAnnuo / 13;

  const aliquotaEff = (tasseTotali / ralNum) * 100;

  return {
    ral: ralNum,
    contributiInps,
    imponibile,
    irpef,
    addReg,
    addCom,
    tasseTotali,
    nettoAnnuo,
    nettoMensile,
    aliquotaEff,
  };
}

function aggiornaUI(r) {
  nettoAnnuoEl.textContent = euro.format(r.nettoAnnuo);
  nettoMensileEl.textContent = euro.format(r.nettoMensile);
  tasseTotaliEl.textContent = euro.format(r.tasseTotali);

  const rows = breakdownBody.querySelectorAll("tr");
  const [
    rowRal,
    rowInps,
    rowImponibile,
    rowIrpef,
    rowAddReg,
    rowAddCom,
    rowTasseTot,
    rowNettoAnnuo,
  ] = rows;

  rowRal.querySelector(".td-value").textContent = euro.format(r.ral);
  rowInps.querySelector(".td-value").textContent = euro.format(r.contributiInps);
  rowImponibile.querySelector(".td-value").textContent = euro.format(r.imponibile);
  rowIrpef.querySelector(".td-value").textContent = euro.format(r.irpef);
  rowAddReg.querySelector(".td-value").textContent = euro.format(r.addReg);
  rowAddCom.querySelector(".td-value").textContent = euro.format(r.addCom);
  rowTasseTot.querySelector(".td-value").textContent = euro.format(r.tasseTotali);
  rowNettoAnnuo.querySelector(".td-value").textContent = euro.format(r.nettoAnnuo);

  const smallNote = document.querySelector(".small-note");
  smallNote.innerHTML =
    `Il carico complessivo è pari al <strong>${r.aliquotaEff.toFixed(1)}%</strong> della RAL inserita.`;
}

function mostraErrore(msg) {
  errorBox.textContent = msg;
  errorBox.style.display = "block";
}

function nascondiErrore() {
  errorBox.style.display = "none";
}

function onCalcolaClick() {
  nascondiErrore();
  try {
    const ral = ralInput.value.trim();
    const risultato = calcolaNettoDaRal(ral);
    aggiornaUI(risultato);
  } catch (err) {
    mostraErrore(err.message || "Errore imprevisto.");
  }
}

calcButton.addEventListener("click", onCalcolaClick);

ralInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    onCalcolaClick();
  }
});

prefillButton.addEventListener("click", () => {
  ralInput.value = "40000";
  nascondiErrore();
  onCalcolaClick();
});
