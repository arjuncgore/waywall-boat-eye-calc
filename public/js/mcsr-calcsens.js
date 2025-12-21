// ======== Part 2: MCSR Calcsens Online ========
// ==== Document Elements ====
const mcSensInput2  = document.getElementById("mc_sens_input2");
const resultsDiv2   = document.getElementById("results2");
const errorDiv2     = document.getElementById("error2");
const calcButton2   = document.getElementById("calc2");

// ==== Helpers ====
const errorCheck2 = (msg) => {
    errorDiv2.textContent = msg;
    errorDiv2.hidden = false;
    resultsDiv2.hidden = true;
    return;
}

// ==== Data Functions ====
// Thank you Esensats

// Minecraft's nonlinear effective sensitivity
function mcEffectiveSens(s) {
    return Math.pow(s * 0.6 + 0.2, 3) * 8.0;
}

// Visible vertical FOV calculation
function visibleVFOV(vDeg, displayH, fbH) {
    const k = displayH / fbH;
    return (2 * Math.atan(Math.tan((vDeg * Math.PI) / 180 / 2) * k)) * (180 / Math.PI);
}

// Calculate new normal/tall coefficients
function calcSensJS(
    currentMouseSens,
    currentNormalCoef = 1.0,
    normalRes = [1920, 1080],
    tallRes = [384, 16384],
    newMouseSens = 0.02291165,
    vFov = 30.0,
    currentTallCoef = null
) {
    // Step 1: effective sens scale
    const effOld = mcEffectiveSens(currentMouseSens);
    const effNew = mcEffectiveSens(newMouseSens);
    const scale  = effOld / effNew;

    // Step 2: new normal coef
    const newNormal = currentNormalCoef * scale;

    // Step 3: new tall coef
    let newTall;
    if (currentTallCoef === null) {
        // Auto-compute tall coefficient from FOV shrink
        const vfovNormal = visibleVFOV(vFov, normalRes[1], normalRes[1]); 
        const vfovTall   = visibleVFOV(vFov, normalRes[1], tallRes[1]);
        const Z = vfovNormal / vfovTall;
        newTall = newNormal / Z;
    } else {
        newTall = currentTallCoef * scale;
    }

    return {
        newMouseSens: newMouseSens,
        normalCoef: newNormal,
        tallCoef: newTall
    };
}

const r6 = (x) => Number(x.toFixed(6));


// ==== Form Submission ====
if (calcButton2) {
    calcButton2.addEventListener("click", (event) => {
        event.preventDefault();

        // ==== Input Validation ====
        const mc    = mcSensInput2.value.trim();

        if (!mc) {
            return errorCheck2("Fill in the field");
        }
        const mcNum = Number(mc);

        if (isNaN(mcNum) || mcNum < 0 || mcNum > 1) {
            return errorCheck2("Minecraft sensitivity must be a number between 0 and 1.");
        }

        errorDiv2.hidden = true;

        // ==== Calculations ====
        const result = calcSensJS(
            mcNum,         // currentMouseSens
            1.0,           // currentNormalCoef (assumed 1)
            [1920, 1080],  // normal resolution
            [384, 16384],  // tall resolution
            0.02291165,    // new target mouse sensitivity
            30.0,          // v_fov
            null           // auto-compute tall coef
        );

        let mcOut = result.newMouseSens;
        let normal = result.normalCoef;
        let tall = result.tallCoef;



        // ==== Results ====
        const dl = document.createElement("dl");

        const titles = [
            "New Minecraft Sensitivity: ",
            "Waywall Normal Sensitivity: ",
            "Waywall Tall Sensitivity: ",
        ]
        const values = [
            r6(mcOut),
            r6(normal),
            r6(tall)
        ];


        for (let i = 0; i < titles.length; i++) {
            let dt = document.createElement("dt");
            let dd = document.createElement("dd");

            dt.textContent = titles[i];
            dd.textContent = values[i];
            dl.appendChild(dt);
            dl.appendChild(dd);
        }

        resultsDiv2.innerHTML = "";
        resultsDiv2.appendChild(dl);
        resultsDiv2.hidden = false;

    });
}

