let ergebnis = 0;
const Knopf = document.getElementById('Knopf');
const Knopf2 = document.getElementById('Knopf2');
const ergebnisAnzeige = document.getElementById('ergebnis');

Knopf.addEventListener('click', function() {
    ergebnis = ergebnis + 1;
    ergebnisAnzeige.innerText = ergebnis;
});

Knopf2.addEventListener('click', function() {
ergebnis = ergebnis + 5;
ergebnisAnzeige.innerText = ergebnis;
});

Knopf3.addEventListener('click', function() {
ergebnis = ergebnis * 5;
ergebnisAnzeige.innerText = ergebnis;
});

Knopf4.addEventListener('click', function() {
ergebnis = ergebnis -1;
ergebnisAnzeige.innerText = ergebnis;
});

Knopf5.addEventListener('click', function() {
ergebnis = ergebnis -5;
ergebnisAnzeige.innerText = ergebnis;
});

Knopf6.addEventListener('click', function() {
ergebnis = ergebnis /5;
ergebnisAnzeige.innerText = ergebnis;
});