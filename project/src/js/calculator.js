/* ===================================================================
 * KöhrerGainz - Calculator (Kalorien, Protein, Creatin, BMI, Wasser)
 * Alle Tabs voll funktionsfähig, Validierung pro Tab
 * =================================================================== */

const Calculator = (() => {
    let activeTab = 'calories';

    function init() {
        bindTabs();
        bindForms();
        initRangeSliders();
    }

    function bindTabs() {
        document.querySelectorAll('.calc-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                activeTab = tab.dataset.calc;
                document.querySelectorAll('.calc-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                document.querySelectorAll('.calc-form-section').forEach(s => {
                    s.classList.add('d-none');
                });
                const section = document.getElementById(`calc-${activeTab}`);
                if (section) section.classList.remove('d-none');

                const resultEl = document.getElementById('calcResult');
                if (resultEl) { resultEl.innerHTML = ''; resultEl.style.display = 'none'; }
            });
        });
    }

    function bindForms() {
        const form = document.getElementById('calcForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                runCalculation();
            });
        }
    }

    function runCalculation() {
        switch (activeTab) {
            case 'calories':  calculateCalories(); break;
            case 'protein':   calculateProtein(); break;
            case 'creatine':  calculateCreatine(); break;
            case 'bmi':       calculateBMI(); break;
            case 'water':     calculateWater(); break;
        }
    }

    function initRangeSliders() {
        document.querySelectorAll('input[type="range"][data-display]').forEach(slider => {
            const displayEl = document.getElementById(slider.dataset.display);
            const suffix = slider.dataset.suffix || '';
            const update = () => { if (displayEl) displayEl.textContent = slider.value + suffix; };
            slider.addEventListener('input', update);
            update();
        });
    }

    function val(id) {
        const el = document.getElementById(id);
        return el ? (el.value || '').trim() : '';
    }
    function numVal(id) {
        return parseFloat(val(id)) || 0;
    }

    // ===== 1. KALORIEN =====
    function calculateCalories() {
        const gender   = val('calcGender') || 'male';
        const age      = numVal('calcAge');
        const weight   = numVal('calcWeight');
        const height   = numVal('calcHeight');
        const activity = parseFloat(val('calcActivity')) || 1.55;
        const goal     = val('calcGoal') || 'maintain';

        if (age < 10 || weight < 20 || height < 100) {
            showError('Bitte alle Felder korrekt ausfüllen (Alter, Gewicht, Größe).');
            return;
        }

        const bmr = gender === 'female'
            ? (10 * weight) + (6.25 * height) - (5 * age) - 161
            : (10 * weight) + (6.25 * height) - (5 * age) + 5;

        const tdee = bmr * activity;
        const deltas = { cut: -500, maintain: 0, bulk: 300, aggressive_bulk: 500 };
        const target = tdee + (deltas[goal] ?? 0);

        const protein = Math.round(weight * 2);
        const fat     = Math.round((target * 0.25) / 9);
        const carbs   = Math.round((target - protein * 4 - fat * 9) / 4);

        const goalLabels = {
            cut: '🔥 Abnehmen (−500 kcal)', maintain: '⚖️ Gewicht halten',
            bulk: '💪 Muskelaufbau (+300 kcal)', aggressive_bulk: '🦍 Aggressiver Aufbau (+500 kcal)'
        };
        const pPct = Math.round((protein * 4 / target) * 100);
        const cPct = Math.round((carbs * 4 / target) * 100);
        const fPct = Math.round((fat * 9 / target) * 100);

        renderResult(`
            <div class="calc-result-header">
                <h3>🔥 Dein Kalorienbedarf</h3>
                <div class="result-main">
                    <div class="result-big-value" id="kcal-counter">0</div>
                    <div class="result-unit">kcal / Tag</div>
                    <div class="result-sub">${goalLabels[goal]}</div>
                </div>
            </div>
            <div class="calc-result-grid">
                <div class="calc-result-item">
                    <div class="label">Grundumsatz (BMR)</div>
                    <div class="value">${Math.round(bmr)}</div>
                    <div class="label-small">kcal</div>
                </div>
                <div class="calc-result-item">
                    <div class="label">Gesamtumsatz (TDEE)</div>
                    <div class="value">${Math.round(tdee)}</div>
                    <div class="label-small">kcal</div>
                </div>
            </div>
            <div class="macro-breakdown">
                <h4>Makronährstoffe</h4>
                <div class="macro-bar-row">
                    <span class="macro-label">Protein</span>
                    <div class="macro-bar-track"><div class="macro-bar protein-bar" style="width:0%" data-width="${pPct}"></div></div>
                    <span class="macro-value">${protein}g <small>(${pPct}%)</small></span>
                </div>
                <div class="macro-bar-row">
                    <span class="macro-label">Kohlenhydrate</span>
                    <div class="macro-bar-track"><div class="macro-bar carb-bar" style="width:0%" data-width="${cPct}"></div></div>
                    <span class="macro-value">${carbs}g <small>(${cPct}%)</small></span>
                </div>
                <div class="macro-bar-row">
                    <span class="macro-label">Fett</span>
                    <div class="macro-bar-track"><div class="macro-bar fat-bar" style="width:0%" data-width="${fPct}"></div></div>
                    <span class="macro-value">${fat}g <small>(${fPct}%)</small></span>
                </div>
            </div>
            <div class="info-box success">
                💡 <strong>Tipp:</strong> Du brauchst täglich ca. <strong>${protein}g Protein</strong> — ca. <strong>${Math.ceil(protein / 25)} Scoops KöhrerWhey</strong> pro Tag.
            </div>`);

        setTimeout(() => {
            const c = document.getElementById('kcal-counter');
            if (c && typeof Animations !== 'undefined') Animations.animateCounter(c, Math.round(target), 1200);
            document.querySelectorAll('.macro-bar[data-width]').forEach(b => {
                setTimeout(() => { b.style.width = b.dataset.width + '%'; }, 150);
            });
        }, 50);
    }

    // ===== 2. PROTEIN =====
    function calculateProtein() {
        const weight   = numVal('calcProteinWeight');
        const goal     = val('calcProteinGoal') || 'build';
        const training = parseInt(val('calcProteinTraining')) || 3;

        if (weight < 20) { showError('Bitte gib dein Körpergewicht ein.'); return; }

        const base = { maintain: 1.2, build: 1.8, max: 2.2, athlete: 2.5 };
        let mult = Math.max(0.8, Math.min(3.0, (base[goal] || 1.8) + (training - 3) * 0.05));
        const daily = Math.round(weight * mult);
        const scoops = Math.ceil(daily / 25);

        const schedule = [
            { time: '07:00', meal: 'Frühstück', amount: Math.round(daily * 0.20) + 'g', note: 'Eier, Quark, Joghurt' },
            { time: '10:30', meal: 'Snack',     amount: Math.round(daily * 0.10) + 'g', note: 'KöhrerWhey Shake' },
            { time: '13:00', meal: 'Mittagessen',amount: Math.round(daily * 0.30) + 'g', note: 'Hähnchen, Thunfisch' },
            { time: '16:30', meal: 'Pre-Workout',amount: Math.round(daily * 0.10) + 'g', note: 'KöhrerWhey + Banane' },
            { time: '20:00', meal: 'Abendessen', amount: Math.round(daily * 0.30) + 'g', note: 'Fleisch, Magerquark' },
        ];

        const goalLabels = { maintain: 'Erhalten', build: 'Muskelaufbau', max: 'Maximaler Aufbau', athlete: 'Leistungssport' };

        renderResult(`
            <div class="calc-result-header">
                <h3>💪 Dein Proteinbedarf</h3>
                <div class="result-main">
                    <div class="result-big-value" id="protein-counter">0</div>
                    <div class="result-unit">g Protein / Tag</div>
                    <div class="result-sub">${goalLabels[goal] || goal} — ${mult.toFixed(1)}g/kg</div>
                </div>
            </div>
            <div class="calc-result-grid">
                <div class="calc-result-item"><div class="label">Pro Mahlzeit (÷5)</div><div class="value">${Math.round(daily/5)}g</div></div>
                <div class="calc-result-item"><div class="label">KöhrerWhey Scoops/Tag</div><div class="value">${scoops}</div><div class="label-small">à 25g Protein</div></div>
            </div>
            <div class="protein-schedule">
                <h4>Proteinverteilung</h4>
                <div class="schedule-list">
                    ${schedule.map(s => `<div class="schedule-item">
                        <span class="schedule-time">${s.time}</span>
                        <span class="schedule-meal">${s.meal}</span>
                        <span class="schedule-amount">${s.amount}</span>
                        <span class="schedule-example">${s.note}</span>
                    </div>`).join('')}
                </div>
            </div>
            <div class="info-box success">🥛 <strong>Tipp:</strong> Verteile Protein auf 5 Mahlzeiten — max. ~40g pro Sitzung optimal verwertbar.</div>`);

        setTimeout(() => {
            const c = document.getElementById('protein-counter');
            if (c && typeof Animations !== 'undefined') Animations.animateCounter(c, daily, 1200, 'g');
        }, 50);
    }

    // ===== 3. CREATIN =====
    function calculateCreatine() {
        const weight = numVal('calcCreatineWeight');
        const phase  = val('calcCreatinePhase') || 'maintenance';

        if (weight < 20) { showError('Bitte gib dein Körpergewicht ein.'); return; }

        let daily, durationText;
        if (phase === 'loading') {
            daily = Math.round(Math.max(15, Math.min(25, weight * 0.3)) * 10) / 10;
            durationText = '5–7 Tage Ladephase, dann Erhaltung';
        } else {
            daily = weight >= 90 ? 5 : weight >= 70 ? 4 : 3;
            durationText = 'Dauerhaft täglich';
        }

        const daysPerContainer = Math.floor(500 / daily);
        const waterL = (weight * 0.04).toFixed(1);

        renderResult(`
            <div class="calc-result-header">
                <h3>⚡ Dein Creatinbedarf</h3>
                <div class="result-main">
                    <div class="result-big-value" id="creatine-counter">0</div>
                    <div class="result-unit">g Creatin / Tag</div>
                    <div class="result-sub">${phase === 'loading' ? '🚀 Ladephase' : '🔄 Erhaltungsphase'} — ${durationText}</div>
                </div>
            </div>
            <div class="calc-result-grid">
                <div class="calc-result-item"><div class="label">500g Dose reicht</div><div class="value">${daysPerContainer}</div><div class="label-small">Tage</div></div>
                <div class="calc-result-item"><div class="label">Monats-Bedarf</div><div class="value">${Math.ceil(30 / daysPerContainer)}</div><div class="label-small">Dose(n) KöhrerCreatin</div></div>
            </div>
            ${phase === 'loading' ? `
            <div class="loading-phases">
                <h4>Ladephase Plan</h4>
                <div class="phase-row"><span>Tag 1–7</span><span><strong>${daily}g</strong> auf 4× ${Math.round(daily/4)}g verteilt</span></div>
                <div class="phase-row"><span>Ab Tag 8</span><span><strong>${weight >= 90 ? 5 : weight >= 70 ? 4 : 3}g</strong> tägl. Erhaltung</span></div>
            </div>` : ''}
            <div class="info-box warning">💧 <strong>Wichtig:</strong> Trinke täglich mind. <strong>${waterL}L Wasser</strong> bei Creatin-Einnahme!</div>`);

        setTimeout(() => {
            const c = document.getElementById('creatine-counter');
            if (c && typeof Animations !== 'undefined') Animations.animateCounter(c, daily, 1000, 'g');
        }, 50);
    }

    // ===== 4. BMI =====
    function calculateBMI() {
        const weight = numVal('calcBmiWeight');
        const height = numVal('calcBmiHeight');

        if (weight < 20 || height < 100) { showError('Bitte Gewicht und Größe eingeben.'); return; }

        const hm = height / 100;
        const bmi = Math.round((weight / (hm * hm)) * 10) / 10;

        let cat, color, emoji, advice;
        if      (bmi < 16)   { cat='Stark untergewichtig'; color='#e74c3c'; emoji='🚨'; advice='Bitte sofort einen Arzt aufsuchen!'; }
        else if (bmi < 17)   { cat='Mäßig untergewichtig'; color='#e74c3c'; emoji='⚠️'; advice='Kalorienüberschuss und Proteinzufuhr erhöhen.'; }
        else if (bmi < 18.5) { cat='Leicht untergewichtig';color='#f39c12'; emoji='📈'; advice='Mehr essen – Muskelaufbau beginnen!'; }
        else if (bmi < 25)   { cat='Normalgewicht 🎯';      color='#2ecc71'; emoji='✅'; advice='Perfekter Startpunkt für Gainz!'; }
        else if (bmi < 30)   { cat='Übergewicht';           color='#f39c12'; emoji='🔥'; advice='Kaloriendefizit + mehr Training empfohlen.'; }
        else if (bmi < 35)   { cat='Adipositas Grad I';     color='#e74c3c'; emoji='⚠️'; advice='Ernährungsumstellung dringend empfohlen.'; }
        else                 { cat='Adipositas Grad II–III';color='#c0392b'; emoji='🚨'; advice='Bitte einen Arzt konsultieren.'; }

        const idealMin = Math.round(18.5 * hm * hm);
        const idealMax = Math.round(24.9 * hm * hm);
        const pos = Math.min(98, Math.max(2, ((bmi - 10) / 35) * 100));
        const diff = weight < idealMin ? `−${idealMin - weight}kg` : weight > idealMax ? `+${weight - idealMax}kg` : 'Ideal ✅';

        renderResult(`
            <div class="calc-result-header">
                <h3>${emoji} Dein BMI</h3>
                <div class="result-main">
                    <div class="result-big-value" id="bmi-counter">0</div>
                    <div class="result-unit">Body-Mass-Index</div>
                    <div class="result-sub" style="color:${color};font-weight:700;">${cat}</div>
                </div>
            </div>
            <div class="bmi-scale-wrapper">
                <div class="bmi-scale">
                    <div class="bmi-range bmi-uw">Untergew.<br/>&lt;18.5</div>
                    <div class="bmi-range bmi-nw">Normal<br/>18.5–25</div>
                    <div class="bmi-range bmi-ow">Übergewicht<br/>25–30</div>
                    <div class="bmi-range bmi-ob">Adipositas<br/>&gt;30</div>
                </div>
                <div class="bmi-indicator" style="left:${pos}%;background:${color};" title="${bmi}"><span>${bmi}</span></div>
            </div>
            <div class="calc-result-grid">
                <div class="calc-result-item"><div class="label">Dein Gewicht</div><div class="value">${weight}kg</div></div>
                <div class="calc-result-item"><div class="label">Idealgewicht</div><div class="value">${idealMin}–${idealMax}kg</div></div>
                <div class="calc-result-item"><div class="label">Differenz</div><div class="value" style="color:${diff.includes('−')?'#f39c12':diff.includes('+')?'#e74c3c':'#2ecc71'}">${diff}</div></div>
            </div>
            <div class="info-box">💡 <strong>Hinweis:</strong> ${advice} <br/><small style="color:var(--text-muted)">BMI berücksichtigt keine Muskelmasse — nur ein Richtwert.</small></div>`);

        setTimeout(() => {
            const c = document.getElementById('bmi-counter');
            if (c && typeof Animations !== 'undefined') Animations.animateCounter(c, bmi, 1000);
        }, 50);
    }

    // ===== 5. WASSER =====
    function calculateWater() {
        const weight   = numVal('calcWaterWeight');
        const training = parseInt(val('calcWaterTraining')) || 3;
        const climate  = val('calcWaterClimate') || 'normal';
        const creatine = val('calcWaterCreatine') === 'yes';

        if (weight < 20) { showError('Bitte gib dein Körpergewicht ein.'); return; }

        let total = weight * 0.033 + training * 0.3;
        if (climate === 'hot')   total += 0.5;
        if (climate === 'humid') total += 0.3;
        if (creatine)            total += 0.5;
        total = Math.round(total * 10) / 10;
        const glasses = Math.ceil(total / 0.25);

        renderResult(`
            <div class="calc-result-header">
                <h3>💧 Dein Wasserbedarf</h3>
                <div class="result-main">
                    <div class="result-big-value" id="water-counter">0</div>
                    <div class="result-unit">Liter Wasser / Tag</div>
                    <div class="result-sub">≈ ${glasses} Gläser à 250ml</div>
                </div>
            </div>
            <div class="calc-result-grid">
                <div class="calc-result-item"><div class="label">Grundbedarf</div><div class="value">${Math.round(weight*0.033*10)/10}L</div><div class="label-small">ohne Extras</div></div>
                <div class="calc-result-item"><div class="label">Training-Bonus</div><div class="value">+${Math.round(training*0.3*10)/10}L</div></div>
                ${creatine ? '<div class="calc-result-item"><div class="label">Creatin-Bonus</div><div class="value">+0.5L</div></div>' : ''}
            </div>
            <div class="protein-schedule">
                <h4>Empfohlene Trinktimes</h4>
                <div class="schedule-list">
                    <div class="schedule-item"><span class="schedule-time">07:00</span><span class="schedule-meal">Aufwachen</span><span class="schedule-amount">500ml</span></div>
                    <div class="schedule-item"><span class="schedule-time">09:00</span><span class="schedule-meal">Vormittags</span><span class="schedule-amount">${Math.round(total*0.15*10)/10}L</span></div>
                    <div class="schedule-item"><span class="schedule-time">12:00</span><span class="schedule-meal">Mittag</span><span class="schedule-amount">500ml</span></div>
                    <div class="schedule-item"><span class="schedule-time">15:00</span><span class="schedule-meal">Nachmittag</span><span class="schedule-amount">${Math.round(total*0.2*10)/10}L</span></div>
                    <div class="schedule-item"><span class="schedule-time">17:00</span><span class="schedule-meal">Training</span><span class="schedule-amount">750ml</span></div>
                    <div class="schedule-item"><span class="schedule-time">19:00</span><span class="schedule-meal">Abends</span><span class="schedule-amount">${Math.round(total*0.15*10)/10}L</span></div>
                </div>
            </div>
            <div class="info-box success">🏆 <strong>Profi-Tipp:</strong> Stelle dir Wasser-Erinnerungen alle 2h! Ausreichend Wasser steigert die Leistung um bis zu 15%.</div>`);

        setTimeout(() => {
            const c = document.getElementById('water-counter');
            if (c && typeof Animations !== 'undefined') Animations.animateCounter(c, total, 1000);
        }, 50);
    }

    // ===== HELPERS =====
    function renderResult(html) {
        const el = document.getElementById('calcResult');
        if (!el) return;
        el.innerHTML = `<div class="calc-result animate-result">${html}</div>`;
        el.style.display = 'block';
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
    }

    function showError(msg) {
        if (typeof App !== 'undefined') App.showToast(msg, 'error');
        else alert(msg);
    }

    document.addEventListener('DOMContentLoaded', () => {
        if (document.querySelector('.calc-tab')) init();
    });

    return { init };
})();
