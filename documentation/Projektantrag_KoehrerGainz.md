# Projektantrag: KöhrerGainz

## Die Idee / USP

**KöhrerGainz – Der Kraftstoff für echte Maschinen**
Fitness-Shops gibt es wie Sand am Meer, aber keinen mit dem legendären Köhrer-Treibstoff. KöhrerGainz verkauft nicht nur Proteinpulver, Riegel und Creatin, sondern ein Lebensgefühl. Der Shop hebt sich durch exklusive "Köhrer-Bundles" und extrem humorvolles, zielgruppengerechtes Storytelling ab. Kein langweiliges 08/15-Gelaber, sondern klare Ansagen für Leute, die Muskeln aufbauen wollen - und es dadurch auch werden. KöhrerGainz Produkte wirken anabol, durch Experten bestätigt. 

## UI / UX

* **Der erste Eindruck (Startseite):** Beim öffnen der Seite sieht man direkt den Slogan "Hol dir die KöhrerGainz!". Highlight-Produkte ("Köhrer's Choice") springen sofort ins Auge und rufen direkt zum Kauf auf.

* **Der Look (UI):** Simpel, modern und auf "ins Auge springend". Sportliche "Gym-Aesthetic": Ein cooles Dark-Mode-Design mit knalligen Akzenten bei wichtigen Buttons und Texten mit Switch zu White-Mode möglich, simpel durch knopfdruck. Das Ganze ist komplett responsive, damit es auf dem Handy im Gym perfekt aussieht.

* **Das Feeling (UX):** Der Weg vom Suchen eines Produkts bis zum Checkout ist extrem einfach und intuitiv. Kleine Details machen den Shop besonders: Wenn man etwas in den Warenkorb legt, gibt es zb visuelles Feedback (z. B. ein pumpender Bizeps (GIF)). 

## Coder Plan

* **Frontend:** HTML, CSS und JavaScript
* **Backend:** PHP + MySQL
* **Spezielle Features:** Ein sicheres User-System (Login/Registrierung), ein interaktiver Warenkorb, Newsletter, Mailversand für Bestellbestätigungen, Kalorien + Protein + Creatin Rechner (auf Userbasierte Werte), verschiedene Rabattcodes geben individuelle Animations am Bildschrim aus.

### Grobe Datenbank Struktur (MySQL)
Die Daten werden in mindestens 5 Tabellen organisiert und mit PHP wie gelernt sicher abgerufen:
1. **`users`**: Verwaltung von Kunden & Admins (ID, Name, Mail, Passwort, Rolle)
2. **`categories`**: Produktkategorien wie Proteine oder Zubehör (ID, Name, Beschreibung)
3. **`products`**: Die Artikel selbst (ID, Kategorie-ID, Name, Preis, Bestand, Bild-URL)
4. **`orders`**: Übersicht der getätigten Käufe (ID, User-ID, Gesamtpreis, Status, Datum)
5. **`order_items`**: Die einzelnen Positionen einer Bestellung (ID, Bestell-ID, Produkt-ID, Menge)

