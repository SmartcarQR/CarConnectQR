/* =========================================
   CARCONNECT QR
   SUPABASE VERSION
========================================= */


/* =========================================
   SUPABASE CONNECTION
========================================= */

const SUPABASE_URL =
    "https://bannrfwcahnvmsrqlnaz.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_ZC5CnukY1WzRYnLpQF92Sw_nGKZ8Eqh";

const supabaseClient =
    supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


/* =========================================
   ELEMENTS
========================================= */

const form = document.getElementById("qrForm");
const result = document.getElementById("result");
const generatedQR = document.getElementById("generatedQR");
const heroQR = document.getElementById("heroQR");
const resultTitle = document.getElementById("resultTitle");
const downloadQR = document.getElementById("downloadQR");
const copyLink = document.getElementById("copyLink");
const testScan = document.getElementById("testScan");


/* =========================================
   QR GENERATOR
========================================= */

function createQRCode(element, text, size) {

    element.innerHTML = "";

    new QRCode(element, {

        text: text,

        width: size,

        height: size,

        colorDark: "#080a0e",

        colorLight: "#ffffff",

        correctLevel: QRCode.CorrectLevel.H

    });

}


/* =========================================
   HERO DEMO QR
========================================= */

const demoURL =
    window.location.origin +
    window.location.pathname.replace("index.html", "") +
    "scan.html#demo";

createQRCode(
    heroQR,
    demoURL,
    230
);


/* =========================================
   FORM SUBMIT
========================================= */

form.addEventListener("submit", async function(event) {

    event.preventDefault();

    /* ---------- GET VALUES ---------- */

    const vehicle =
        document
            .getElementById("vehicleNumber")
            .value
            .trim()
            .toUpperCase();

    const owner =
        document
            .getElementById("ownerName")
            .value
            .trim();

    const phone =
        document
            .getElementById("phone")
            .value
            .trim();

    const type =
        document
            .getElementById("vehicleType")
            .value;


    /* ---------- VALIDATE PHONE ---------- */

    if (!/^[0-9]{10}$/.test(phone)) {

        alert(
            "Please enter a valid 10-digit mobile number."
        );

        return;
    }


    /* =========================================
       STEP 1: ANONYMOUS AUTH
    ========================================= */

    /* =========================================
   GET / CREATE USER
========================================= */

let user = null;


/* ---------- CHECK CURRENT AUTH USER ---------- */

const {
    data: currentUserData,
    error: currentUserError
} = await supabaseClient.auth.getUser();


if (!currentUserError && currentUserData?.user) {

    user = currentUserData.user;

}


/* ---------- CREATE ANONYMOUS USER IF NEEDED ---------- */

if (!user) {

    const {
        data: authData,
        error: authError
    } = await supabaseClient.auth.signInAnonymously();


    if (authError) {

        console.error(
            "AUTH ERROR:",
            authError
        );

        alert(
            "Account creation failed: " +
            authError.message
        );

        return;

    }


    user = authData.user;

}


/* ---------- FINAL USER CHECK ---------- */

if (!user) {

    alert(
        "Unable to create user. Please try again."
    );

    return;

}


console.log(
    "CURRENT USER ID:",
    user.id
);

console.log(
    "ANONYMOUS USER:",
    user.is_anonymous
);

    if (!user) {

        alert(
            "Unable to create user."
        );

        return;
    }


    /* =========================================
       STEP 2: CREATE / UPDATE PROFILE
    ========================================= */

    const {
        error: profileError
    } =
        await supabaseClient
            .from("profiles")
            .upsert(
                {
                    id: user.id,

                    name: owner,

                    phone: phone,

                    email: null
                },
                {
                    onConflict: "id"
                }
            );


    if (profileError) {

        console.error(
            "PROFILE ERROR:",
            profileError
        );

        alert(
            "Profile creation failed: " +
            profileError.message
        );

        return;
    }


    /* =========================================
       STEP 3: CREATE VEHICLE
    ========================================= */

    const {
        data: vehicleData,
        error: vehicleError
    } =
        await supabaseClient
            .from("vehicles")
            .insert({

                user_id: user.id,

                vehicle_number:
                    vehicle || null,

                vehicle_type:
                    type || null,

                vehicle_model:
                    null,

                status:
                    "active"

            })
            .select()
            .single();


    if (vehicleError) {

        console.error(
            "VEHICLE ERROR:",
            vehicleError
        );

        alert(
            "Vehicle creation failed: " +
            vehicleError.message
        );

        return;
    }


    /* =========================================
       STEP 4: CREATE QR
    ========================================= */

    const {
        data: qrData,
        error: qrError
    } =
        await supabaseClient
            .from("qr_codes")
            .insert({

                vehicle_id:
                    vehicleData.id,

                status:
                    "active"

            })
            .select()
            .single();


    if (qrError) {

        console.error(
            "QR ERROR:",
            qrError
        );

        alert(
            "QR creation failed: " +
            qrError.message
        );

        return;
    }


    /* =========================================
       STEP 5: CREATE SECURE SCAN URL
    ========================================= */

    const scanURL =
        window.location.origin +
        window.location.pathname.replace(
            "index.html",
            ""
        ) +
        "scan.html?token=" +
        qrData.qr_token;


    /* =========================================
       STEP 6: GENERATE QR
    ========================================= */

    generatedQR.innerHTML = "";

    createQRCode(
        generatedQR,
        scanURL,
        220
    );


    /* =========================================
       RESULT
    ========================================= */

    const vehicleLabel =
        vehicle || "Vehicle";

    const typeLabel =
        type || "Vehicle";


    resultTitle.textContent =
        vehicle
            ? `${vehicle} • ${typeLabel}`
            : typeLabel;


    result.classList.remove("hidden");

    testScan.href =
        scanURL;


    /* =========================================
       DOWNLOAD QR
    ========================================= */

    downloadQR.onclick =
        function() {

            const image =
                generatedQR.querySelector("img");


            if (!image) {

                alert(
                    "QR is still generating."
                );

                return;
            }


            const downloadLink =
                document.createElement("a");


            downloadLink.href =
                image.src;


            downloadLink.download =
                (vehicle || "Vehicle")
                    .replace(/\s+/g, "-") +
                "-CarConnect-QR.png";


            downloadLink.click();

        };


    /* =========================================
       COPY LINK
    ========================================= */

    copyLink.onclick =
        async function() {

            try {

                await navigator.clipboard
                    .writeText(scanURL);


                copyLink.textContent =
                    "Copied ✓";


                setTimeout(
                    function() {

                        copyLink.textContent =
                            "Copy Scan Link";

                    },
                    1800
                );

            }

            catch {

                prompt(
                    "Copy this link:",
                    scanURL
                );

            }

        };


    /* =========================================
       SCROLL TO RESULT
    ========================================= */

    result.scrollIntoView({

        behavior: "smooth",

        block: "center"

    });

});