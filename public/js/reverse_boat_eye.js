// ======== Part 1: Reverse Boat Eye ========
// ==== Document Elements ====
const dpiInput      = document.getElementById("dpi_input");
const mcSensInput1  = document.getElementById("mc_sens_input1");
const winSensInput  = document.getElementById("win_sens_input");
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

const dpcOld = (mcOld) => ((mcOld * 0.6 + 0.2) ** 3) * 1.2;

const dpcNew = (mcOld, dpiOld, winOld) => (dpcOld(mcOld) * dpiOld) / dpiNew(dpiOld, winOld);

const mcNew = (mcOld, dpiOld, winOld) => {
    const dpc = dpcNew(mcOld, dpiOld, winOld);
    const raw = (Math.cbrt(dpc / 1.2) - 0.2) / 0.6;

    // optional clamp to [0, 1]
    return Math.min(1, Math.max(0, raw));
};

// ==== Form Submission ====
if (calcButton1) {
    calcButton1.addEventListener("click", (event) => {
        event.preventDefault();

        // ==== Input Validation ====
        const dpi   = dpiInput.value.trim();
        const mc    = mcSensInput1.value.trim();
        const win   = winSensInput.value.trim();

        if (!dpi || !mc || !win) {
            return errorCheck1("Fill in all fields");
        }
        const dpiNum = Number(dpi);
        const mcNum = Number(mc);
        const winNum = Number(win);

        if (!Number.isInteger(dpiNum) || dpiNum <= 0) {
            return errorCheck1("DPI must be a positive whole number.");
        }

        if (isNaN(mcNum) || mcNum < 0 || mcNum > 1) {
            return errorCheck1("Minecraft sensitivity must be a number between 0 and 1.");
        }

        if (!Number.isInteger(winNum) || winNum < 0 || winNum > 20) {
            return errorCheck1("Windows Sensitivity must be a whole number from 0 to 20.");
        }

        errorDiv1.hidden = true;

        // ==== Calculations ====
        let dpiOut  = dpiNew(dpiNum, winNum);
        let mcOut   = mcNew(mcNum, dpiNum, winNum);
        let winOut  = 10;


        // ==== Results ====
        const dl = document.createElement("dl");

        const titles = [
            "New DPI: ",
            "New Minecraft Sensitivity: ",
            "New Windows Sensitivity: ",
        ]
        const values = [
            dpiOut,
            mcOut,
            winOut
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

