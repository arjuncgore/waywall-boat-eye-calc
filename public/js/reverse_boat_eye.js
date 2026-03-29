// ======== Part 1: Reverse Boat Eye ========
// ==== Document Elements ====
const dpiInput      = document.getElementById("dpi_input");
const mcSensInput1  = document.getElementById("mc_sens_input1");
const winSensInput  = document.getElementById("win_sens_input");
const linuxSensInput  = document.getElementById("linux_sens_input");
const resultsDiv1   = document.getElementById("results1");
const errorDiv1     = document.getElementById("error1");
const calcButton1   = document.getElementById("calc1");

// ==== Helpers ====
const errorCheck1 = (msg) => {
    errorDiv1.textContent = msg;
    errorDiv1.hidden = false;
    resultsDiv1.hidden = true;
    return;
}

// ==== Data Functions ====
// Thank you r0hkx
const lookupTable = [
    null,
    0.03125, // 1
    0.0625,  // 2
    0.125,   // 3
    0.25,    // 4
    0.375,   // 5
    0.5,     // 6
    0.625,   // 7
    0.75,    // 8
    0.875,   // 9
    1,       // 10
    1.25,    // 11
    1.5,     // 12
    1.75,    // 13
    2,       // 14
    2.25,    // 15
    2.5,     // 16
    2.75,    // 17
    3,       // 18
    3.25,    // 19
    3.5      // 20
];

const dpiNew = (dpiOld, winOld) => dpiOld * lookupTable[winOld];
const winMultiplier = (winOld) => lookupTable[winOld];
const linuxMultiplier = (linuxVal) => 1 + linuxVal;

const dpcOld = (mcOld) => ((mcOld * 0.6 + 0.2) ** 3) * 1.2;

const dpcNew = (mcOld, dpiOld, winOld) => (dpcOld(mcOld) * dpiOld) / dpiNew(dpiOld, winOld);
const dpcNewWithMultiplier = (mcOld, mult) => dpcOld(mcOld) / mult;

const mcNew = (mcOld, dpiOld, winOld) => {
    const dpc = dpcNew(mcOld, dpiOld, winOld);
    const raw = (Math.cbrt(dpc / 1.2) - 0.2) / 0.6;

    return Math.min(1, Math.max(0, raw));
};

const mcNewWithMultiplier = (mcOld, mult) => {
    const dpc = dpcNewWithMultiplier(mcOld, mult);
    const raw = (Math.cbrt(dpc / 1.2) - 0.2) / 0.6;

    return Math.min(1, Math.max(0, raw));
};

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

const r8 = (x) => Number(x.toFixed(8));


// ==== Form Submission ====
if (calcButton1) {
    calcButton1.addEventListener("click", (event) => {
        event.preventDefault();

        // ==== Input Validation ====
        const dpi   = dpiInput.value.trim();
        const mc    = mcSensInput1.value.trim();
        const win   = winSensInput.value.trim();
        const linux = linuxSensInput.value.trim();

        const hasWin = win !== "";
        const hasLinux = linux !== "";

        if (!dpi || !mc || (!hasWin && !hasLinux)) {
            return errorCheck1("Please fill DPI, MC sensitivity, and either Windows OR Linux sensitivity.");
        }

        if (hasWin && hasLinux) {
            return errorCheck1("Provide only one: Windows OR Linux sensitivity, not both.");
        }

        const dpiNum = Number(dpi);
        const mcNum = Number(mc);
        const winNum = hasWin ? Number(win) : null;
        const linuxNum = hasLinux ? Number(linux) : null;

        if (!Number.isInteger(dpiNum) || dpiNum <= 0) {
            return errorCheck1("DPI must be a positive whole number.");
        }

        if (isNaN(mcNum) || mcNum < 0 || mcNum > 1) {
            return errorCheck1("Minecraft sensitivity must be a number between 0 and 1.");
        }

        if (hasWin) {
            if (!Number.isInteger(winNum) || winNum < 1 || winNum > 20) {
                return errorCheck1("Windows Sensitivity must be a whole number from 1 to 20.");
            }
        }

        if (hasLinux) {
            if (isNaN(linuxNum) || linuxNum < -1 || linuxNum > 1) {
                return errorCheck1("Linux Sensitivity must be a number between -1 and 1.");
            }
        }

        errorDiv1.hidden = true;

        // ==== Calculations ====
        let mult;
        let mcConverted;

        if (hasLinux) {
            mult = linuxMultiplier(linuxNum);
            if (mult === 0) {
                return errorCheck1("Linux sensitivity results in zero multiplier; adjust the Linux value.");
            }
            mcConverted = mcNewWithMultiplier(mcNum, mult);
        } else {
            mult = winMultiplier(winNum);
            mcConverted = mcNew(mcNum, dpiNum, winNum);
        }

        const result = calcSensJS(
            mcConverted,   // currentMouseSens
            1.0,           // currentNormalCoef (assumed 1)
            [1920, 1080],  // normal resolution
            [384, 16384],  // tall resolution
            0.02291165,    // new target mouse sensitivity
            30.0,          // v_fov
            null           // auto-compute tall coef
        );

        let mcOut = 0.02291165;
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
            mcOut,
            r8(normal),
            r8(tall)
        ]

        for (let i = 0; i < titles.length; i++) {
            let dt = document.createElement("dt");
            let dd = document.createElement("dd");

            dt.textContent = titles[i];
            dd.textContent = values[i];
            dl.appendChild(dt);
            dl.appendChild(dd);
        }

        resultsDiv1.innerHTML = "";
        resultsDiv1.appendChild(dl);
        resultsDiv1.hidden = false;

    });
}

