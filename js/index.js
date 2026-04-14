

let projekteRein = document.getElementById('projekte_rein');
let projekteReinFeatured = document.getElementById('projekte_rein_featured');

const ProjektArray = [
    ["Nextblog", "Ein Blogpost Website", "fertig", false, "Projekte/nextblog/index.html"],
    ["Javaskript", "Ein Taschenrechner", "fertig", false, "Projekte/Javaskript/index.html"],
    ["innerhtml_test", "Druckplatte Test", "fertig", false, "Projekte/innerhtml_test/index.html"],
    ["Boatfix - Minecraft Mod", "Fixt dem Bug im Boot zu essen", "fertig", true, "https://www.curseforge.com/minecraft/mc-mods/boat-fix"],
    ["Ultimate Apple Mod", "Viele neue Minecraft \u00C4pfel", "pausiert", false, "#"],
    ["Recraft - Minecraft Mod", "Fertige Items zur\u00FCckcraften", "pausiert", false, "#"]
];

function getStatusText(status) {
    switch(status) {
        case 'fertig':
            return 'Fertiggestellt';
        case 'inarbeit':
            return 'In Arbeit';
        case 'pausiert':
            return 'Pausiert';
        default:
            return status;
    }
}


function AlleProjekte() {
    if (projekteRein) {
        for (let i = 0; i < ProjektArray.length; i++) {
            let name = ProjektArray[i][0];
            let beschreibung = ProjektArray[i][1];
            let status = ProjektArray[i][2];
            let featured = ProjektArray[i][3];
            let link = ProjektArray[i][4];

            let statusText = getStatusText(status);

            let Projektkarte = `
                <a href="${link}" class="projekt-link">
                    <div class="text-block">
                        <h3>${name}</h3>
                        <p>${beschreibung}</p>
                        <span class="status ${status}">${statusText}</span>
                    </div>
                </a>`
            
            projekteRein.innerHTML += Projektkarte;
        }
    }
}


function FeaturedProjekte() {
    if (projekteReinFeatured) {
        for (let i = 0; i < ProjektArray.length; i++) {
            let name = ProjektArray[i][0];
            let beschreibung = ProjektArray[i][1];
            let status = ProjektArray[i][2];
            let featured = ProjektArray[i][3];
            let link = ProjektArray[i][4];
            
            
            if (featured === true) {
                let statusText = getStatusText(status);

                let Projektkarte = `
                    <a href="${link}" class="projekt-link">
                        <div class="text-block">
                            <h3>${name}</h3>
                            <p>${beschreibung}</p>
                            <span class="status ${status}">${statusText}</span>
                        </div>
                    </a>`
                
                projekteReinFeatured.innerHTML += Projektkarte;
            }
        }
    }
}

AlleProjekte();
FeaturedProjekte();




let darkmode = localStorage.getItem('darkMode') === 'true';
const darkk = document.getElementById("Dark");

function setStylesheet() {

    const oldStylesheet = document.querySelector('link[href*="styles.css"]');
    if (oldStylesheet) {
        oldStylesheet.remove();
    }

    const newStylesheet = document.createElement('link');
    newStylesheet.rel = 'stylesheet';
    
    if (darkmode) {
        newStylesheet.href = 'styles/darkstyles.css';
    } else {
        newStylesheet.href = 'styles/styles.css';
    }
    

    document.head.appendChild(newStylesheet);
}

function updateImages() {
    const footerImage = document.querySelector('img[alt="Grauer Kasten oben abgerundet"]');
    if (footerImage) {
        if (darkmode) {
            footerImage.src = 'images/Footerbild_dark.png';
        } else {
            footerImage.src = 'images/Footerbild.png';
        }
    } 

    const Bildungimage = document.querySelector('img[alt="Bildungs Zeitstrahl!"]'); 
    if (Bildungimage) {
        if(darkmode) {
            Bildungimage.src = 'images/Bildung_dark.png';
        } else {
            Bildungimage.src = 'images/Bildung.png'; 
        }
    }

    const coffeeImage = document.querySelector('img[alt="buy me a coffe! "]');
    if (coffeeImage) {
        if (darkmode) {
            coffeeImage.src = 'images/bmacoffe_dark.png';
        } else {
            coffeeImage.src = 'images/bmacoffe.png';
        }
    }
}


if (darkk) {
    if (darkmode) {
        document.body.classList.add("dark-mode");
        document.body.classList.remove("light-mode");
        darkk.innerHTML = `<div class="nav-item"><img src="images/light_mode.png" alt="Lightmode an machen?" class="nav-item"></div>`;
    } else {
        document.body.classList.add("light-mode");
        document.body.classList.remove("dark-mode");
        darkk.innerHTML = `<div class="nav-item"><img src="images/Darkmode.png" alt="Darkmode an machen?" class="nav-item"></div>`;
    }
    

    setStylesheet();
    updateImages();
}

if (darkk) {
    darkk.addEventListener("click", function() {
        let list = document.body.classList;
        if (darkmode) {
            darkk.innerHTML = `<div class="nav-item"><img src="images/Darkmode.png" alt="Darkmode an machen?" class="nav-item"></div>`;
            list.remove("dark-mode");
            list.add("light-mode");
            darkmode = false;
        } else {
            darkk.innerHTML = `<div class="nav-item"><img src="images/light_mode.png" alt="Lightmode an machen?" class="nav-item"></div>`;
            list.remove("light-mode");
            list.add("dark-mode");
            darkmode = true;
        }
        
        setStylesheet();
        updateImages();
        
        localStorage.setItem('darkMode', darkmode.toString());
    });
}