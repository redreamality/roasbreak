import "../styles.css";
import "../tool-pages.css";
import { acosToRoas, roasToAcos } from "../lib/decision-tools";
import { setYearAndIcons, track } from "./common";

const roasInput = document.querySelector<HTMLInputElement>("#guide-roas");
const acosInput = document.querySelector<HTMLInputElement>("#guide-acos");

if (roasInput && acosInput) {
  let updating = false;
  roasInput.addEventListener("input", () => {
    if (updating) return;
    updating = true;
    acosInput.value = roasToAcos(Number(roasInput.value)).toFixed(1);
    updating = false;
  });
  acosInput.addEventListener("input", () => {
    if (updating) return;
    updating = true;
    roasInput.value = acosToRoas(Number(acosInput.value)).toFixed(2);
    updating = false;
  });
}

setYearAndIcons();
track("guide_view", { guide: document.body.dataset.guide ?? "unknown" });
