const kasten = document.getElementById('kasten')
const textanzeige = document.getElementById('text')

kasten.addEventListener('click', function(){
    const bildUrl = "images/png.png" 
    
    
    const neuertext = `
        <div>
            <p>Das ist ein Text über dem Bild</p>
            <img src="${bildUrl}" alt="Beschreibung" width="67%">
            <p>Das ist ein Text unter dem Bild</p>
        </div>
    `
    
    textanzeige.innerHTML += neuertext
}, { once: true });