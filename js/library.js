/* ==========================================================================
   ឯកសារ៖ js/library.js
   តួនាទី៖ ប្រមូលផ្តុំក្រុម (Category) និងឈ្មោះឧបករណ៍ ២ ភាសា (ខ្មែរ / អង់គ្លេស)
   ========================================================================== */

// ១. ឈ្មោះក្រុម (Category Dropdown) ជាភាសាខ្មែរ (km) និងអង់គ្លេស (en)
export const LIBRARY_CATEGORIES = [
  { id: 'S', km: 'ប្រភពភ្លើង', en: 'Sources' },
  { id: 'P', km: 'ឧបករណ៍ការពារ', en: 'Protection & Breakers' },
  { id: 'W', km: 'ប៊ូតុង និង កុងតាក់', en: 'Buttons & Switches' },
  { id: 'C', km: 'បូប៊ីន និង កំណត់ពេល', en: 'Coils & Timers' },
  { id: 'A', km: 'កុងតាក់ជំនួយ', en: 'Aux Contacts' },
  { id: 'T', km: 'កុងតាក់ទ័រ', en: 'Contactors' },
  { id: 'L', km: 'អំពូលសញ្ញា', en: 'Signals' },
  { id: 'M', km: 'ម៉ូទ័រ', en: 'Motors' },
  { id: 'X', km: 'ផ្សេង', en: 'Other' }
];

// ២. បញ្ជីឧបករណ៍ទាំងអស់ (km: ភាសាខ្មែរ, en: ភាសាអង់គ្លេស)
export const LIBRARY_ITEMS = {
  // --- ប្រភពភ្លើង (Sources - S) ---
  srcL1:            { k: 'S', km: 'ប្រភពហ្វា R/L1', en: 'Phase R/L1' },
  srcL2:            { k: 'S', km: 'ប្រភពហ្វា S/L2', en: 'Phase S/L2' },
  srcL3:            { k: 'S', km: 'ប្រភពហ្វា T/L3', en: 'Phase T/L3' },
  srcN:             { k: 'S', km: 'ប្រភពណឺត N', en: 'Neutral N' },
  srcPE:            { k: 'S', km: 'ប្រភពខ្សែដី PE', en: 'Protective Earth (PE)' },
  srcP:             { k: 'S', km: 'ប្រភពភ្លើង DC +', en: 'Source +DC' },
  srcM:             { k: 'S', km: 'ប្រភពភ្លើង DC −', en: 'Source −DC' },
  src3ph:           { k: 'S', km: 'ប្រភពភ្លើង ៣ ហ្វា', en: 'Power 3Phase (R/L1-S/L2-T/L3)' },
  ic_sourceL1L2L3N: { k: 'S', km: 'ប្រភព ៣ ហ្វា+ណឺត', en: 'Power 3Phase + N' },
  ic_battery:       { k: 'S', km: 'ថ្មពិល/អាគុយ DC', en: 'DC Battery' },
  ic_generator3ph:  { k: 'S', km: 'ម៉ាស៊ីនភ្លើង ៣ ហ្វា', en: 'Generator 3 Phase' },
  ic_junctionPE:    { k: 'S', km: 'ជើងបំបែកខ្សែដី PE', en: 'Ground Terminal PE' },
  ic_sourceGnd:     { k: 'S', km: 'ជើងខ្សែដី PE', en: 'Grounding PE' },
  ic_powerSupply:   { k: 'S', km: 'ប្រភពបំប្លែងភ្លើង AC/DC', en: 'Power Supply AC/DC' },
  ic_powerSupply2:  { k: 'S', km: 'ប្រភពបំប្លែងភ្លើង AC/DC', en: 'Power Supply AC/DC' },

  // --- ឧបករណ៍ការពារ (Protection & Breakers - P) ---
  fuse:             { k: 'P', km: 'ហ្វុយស៊ីប ១ប៉ូល', en: 'Fuse 1P' },
  ic_fuse2p:        { k: 'P', km: 'ហ្វុយស៊ីប ២ប៉ូល', en: 'Fuse 2P' },
  ic_fuse3p:        { k: 'P', km: 'ហ្វុយស៊ីប ៣ប៉ូល', en: 'Fuse 3P' },
  ic_fuse4p:        { k: 'P', km: 'ហ្វុយស៊ីប ៤ប៉ូល', en: 'Fuse 4P' },
  brk1:             { k: 'P', km: 'ឌីសង់ទ័រ MCB ១ប៉ូល', en: 'MCB 1P' },
  brk2:             { k: 'P', km: 'ឌីសង់ទ័រ MCB ២ប៉ូល', en: 'MCB 2P' },
  brk3:             { k: 'P', km: 'ឌីសង់ទ័រ MCB ៣ប៉ូល', en: 'MCB 3P' },
  ic_breaker4p:     { k: 'P', km: 'ឌីសង់ទ័រ MCB ៤ប៉ូល', en: 'MCB 4P' },
  ic_tmBreaker1p:   { k: 'P', km: 'ឌីសង់ទ័រ MCB ១ប៉ូល', en: 'MCB 1P' },
  ic_tmBreaker2p:   { k: 'P', km: 'ឌីសង់ទ័រ MCB ២ប៉ូល', en: 'MCB 2P' },
  ic_tmBreaker3p:   { k: 'P', km: 'ឌីសង់ទ័រ MCB ៣ប៉ូល', en: 'MCB 3P' },
  ic_tmBreaker4p:   { k: 'P', km: 'ឌីសង់ទ័រ MCB ៤ប៉ូល', en: 'MCB 4P' },
  mbrk3:            { k: 'P', km: 'ឌីសង់ទ័រការពារម៉ូទ័រ 3P', en: 'MPCB 3P' },
  ic_rcboBreaker2p: { k: 'P', km: 'ឌីសង់ទ័រការពារឆក់ 2P', en: 'RCBO Breaker 2P' },
  ic_rcboBreaker4p: { k: 'P', km: 'ឌីសង់ទ័រការពារឆក់ 4P', en: 'RCBO Breaker 4P' },
  ic_isolator1p:    { k: 'P', km: 'កុងតាក់ផ្តាច់ចរន្ត 1P', en: 'Isolator 1P' },
  ic_isolator2p:    { k: 'P', km: 'កុងតាក់ផ្តាច់ចរន្ត 2P', en: 'Isolator 2P' },
  ic_isolator3p:    { k: 'P', km: 'កុងតាក់ផ្តាច់ចរន្ត 3P', en: 'Isolator 3P' },
  ic_isolator4p:    { k: 'P', km: 'កុងតាក់ផ្តាច់ចរន្ត 4P', en: 'Isolator 4P' },
  ol3:              { k: 'P', km: 'រ៉េឡេកម្ដៅ 3P', en: 'Thermal Overload 3P' },
 ic_phaseFailure:  { k: 'P', km: 'រ៉េឡេការពារបាត់ហ្វា', en: 'Phase Failure Relay' },
 breaker:          { k: 'P', km: 'ប្រេកគ័រកម្ដៅ 3P (Thermal Breaker)' },

  // --- ប៊ូតុង និងកុងតាក់ (Buttons & Switches - W) ---
  btnNO:            { k: 'W', km: 'ប៊ូតុងចុច NO', en: 'Push Button NO' },
  btnNC:            { k: 'W', km: 'ប៊ូតុងចុច NC', en: 'Push Button NC' },
  ic_buttonNONC:    { k: 'W', km: 'ប៊ូតុងចុច NC+NO', en: 'Push Button NC+NO' },
  ic_buttonCON:     { k: 'W', km: 'ប៊ូតុងចុចប្តូរទិស', en: 'Push Button Changeover' },
  estop:            { k: 'W', km: 'ប៊ូតុងសង្គ្រោះបន្ទាន់ NC', en: 'Emergency Stop NC' },
  ic_emergencyNO:   { k: 'W', km: 'ប៊ូតុងសង្គ្រោះបន្ទាន់ NO', en: 'Emergency Stop NO' },
  swNO:             { k: 'W', km: 'កុងតាក់បិទ/បើក NO', en: 'Switch NO' },
  ic_switchNC:      { k: 'W', km: 'កុងតាក់បិទ/បើក NC', en: 'Switch NC' },
  ic_switchNONC:    { k: 'W', km: 'កុងតាក់ NC+NO', en: 'Switch NC+NO' },
  ic_switchCON:     { k: 'W', km: 'កុងតាក់ប្តូរទិស', en: 'Switch Changeover' },
  ic_switch3p0:     { k: 'W', km: 'កុងតាក់ ៣ ទីតាំង I-0-II', en: '3-Pos Switch I-0-II' },
  ic_switch3p:      { k: 'W', km: 'កុងតាក់ ៣ ទីតាំង I-II-III', en: '3-Pos Switch I-II-III' },
  ic_rollerNO:      { k: 'W', km: 'កុងតាក់កង់រមៀល NO', en: 'Limit Switch NO' },
  ic_rollerNC:      { k: 'W', km: 'កុងតាក់កង់រមៀល NC', en: 'Limit Switch NC' },

  // --- បូប៊ីន និងកំណត់ពេល (Coils & Timers - C) ---
  coil:             { k: 'C', km: 'បូប៊ីនកុងតាក់ទ័រ', en: 'Contactor Coil' },
  timerOn:          { k: 'C', km: 'បូប៊ីនកំណត់ពេល TON', en: 'On-Delay Timer (TON)' },
  timerOff:         { k: 'C', km: 'បូប៊ីនកំណត់ពេល TOF', en: 'Off-Delay Timer (TOF)' },
  ic_coilFlasher:   { k: 'C', km: 'បូប៊ីនភ្លឹបភ្លែត', en: 'Flasher Relay' },
  ic_coilLatch:     { k: 'C', km: 'បូប៊ីនចាក់សោរ', en: 'Impulse Latch Relay' },

  // --- កុងតាក់ជំនួយ (Aux Contacts - A) ---
  conNO:            { k: 'A', km: 'កុងតាក់ជំនួយ NO', en: 'Aux Contact NO' },
  conNC:            { k: 'A', km: 'កុងតាក់ជំនួយ NC', en: 'Aux Contact NC' },
  ic_contactNONC:   { k: 'A', km: 'កុងតាក់ជំនួយ NC+NO', en: 'Aux Contact NC+NO' },
  ic_contactCON:    { k: 'A', km: 'កុងតាក់ជំនួយប្តូរទិស', en: 'Aux Changeover' },
  tmNO:             { k: 'A', km: 'កុងតាក់ Timer TON NO', en: 'Timer TON Contact NO' },
  tmNC:             { k: 'A', km: 'កុងតាក់ Timer TON NC', en: 'Timer TON Contact NC' },
  ic_contactNODelayOff: { k: 'A', km: 'កុងតាក់ Timer TOF NO', en: 'Timer TOF Contact NO' },
  ic_contactNCDelayOff: { k: 'A', km: 'កុងតាក់ Timer TOF NC', en: 'Timer TOF Contact NC' },
   olNC:             { k: 'A', km: 'ជំនួយកម្ដៅ NC (95-96)', en: 'Overload NC (95-96)' },
  olNO:             { k: 'A', km: 'ជំនួយកម្ដៅ NO (97-98)', en: 'Overload NO (97-98)' },
  

  // --- កុងតាក់ទ័រកម្លាំង (Power Contactors - T) ---
  ic_contactor1p:   { k: 'T', km: 'កុងតាក់ទ័រ NO 1P', en: 'Contactor NO 1P' },
  ic_contactor2p:   { k: 'T', km: 'កុងតាក់ទ័រ NO 2P', en: 'Contactor NO 2P' },
  ct3:              { k: 'T', km: 'កុងតាក់ទ័រ NO 3P', en: 'Contactor NO 3P' },
  ic_contactor4p:   { k: 'T', km: 'កុងតាក់ទ័រ NO 4P', en: 'Contactor NO 4P' },
  ic_contactorNC3p: { k: 'T', km: 'កុងតាក់ទ័រ NC 3P', en: 'Contactor NC 3P' },

  // --- ចង្កៀង និងសំឡេងរោទិ៍ (Indicators - L) ---
  lamp:             { k: 'L', km: 'ចង្កៀងសញ្ញា (លឿង)', en: 'Pilot Light (Yellow)' },
  lampRun:          { k: 'L', km: 'ចង្កៀង Run (បៃតង)', en: 'Run Light (Green)' },
  lampStop:         { k: 'L', km: 'ចង្កៀង Stop (ក្រហម)', en: 'Stop Light (Red)' },
  lampTrip:         { k: 'L', km: 'ចង្កៀង Trip (ទឹកក្រូច)', en: 'Trip Light (Amber)' },
  ic_lampBlink:     { k: 'L', km: 'ចង្កៀងភ្លឹបភ្លែត', en: 'Blinking Light' },
  buzz:             { k: 'L', km: 'សំឡេងរោទិ៍ Buzzer', en: 'Buzzer' },
  ic_siren:         { k: 'L', km: 'ស៊ីរ៉ែនប្រកាសអាសន្ន', en: 'Siren' },
  ic_ring:          { k: 'L', km: 'កណ្តឹងរោទិ៍', en: 'Bell Ring' },

  // --- ម៉ូទ័រ (Motors - M) ---
  mot1:             { k: 'M', km: 'ម៉ូទ័រ ១ ហ្វាស', en: '1-Phase Motor' },
  mot3:             { k: 'M', km: 'ម៉ូទ័រ ៣ ហ្វាស', en: '3-Phase Motor' },
  ic_motorStarDelta:{ k: 'M', km: 'ម៉ូទ័រផ្កាយ-ត្រីកោណ', en: 'Star/Delta Motor' },
  ic_motorDhalander:{ k: 'M', km: 'ម៉ូទ័រ ២ ល្បឿន', en: 'Dahlander 2-Speed Motor' },
  ic_motorDC:       { k: 'M', km: 'ម៉ូទ័រចរន្តជាប់ DC', en: 'DC Motor' },

  // --- អក្សរ និងតំណខ្សែ (Text & Junctions - X) ---
  txt:              { k: 'X', km: 'អក្សរចំណាំ', en: 'Text Label' },
  ic_diode:         { k: 'X', km: 'ឌីយ៉ូត', en: 'Diode' },
  ic_junction2p:    { k: 'X', km: 'តំណខ្សែត្រង់', en: 'Straight Junction 2P' },
  ic_junction2p90:  { k: 'X', km: 'តំណខ្សែកែង 90°', en: 'Corner Junction 90°' },
  ic_junction3p:    { k: 'X', km: 'តំណខ្សែប្រសព្វ ៣ ផ្លូវ', en: 'T-Junction 3P' },
  ic_junction4p:    { k: 'X', km: 'តំណខ្សែប្រសព្វ ៤ ផ្លូវ', en: 'Cross Junction 4P' },
  ic_arrowSource:   { k: 'X', km: 'ព្រួញបញ្ជូនចរន្តចេញ', en: 'Source Arrow' },
  ic_arrowDestination: { k: 'X', km: 'ព្រួញទទួលចរន្តចូល', en: 'Destination Arrow' }
};

// អនុវត្តឈ្មោះ និងក្រុមតាមភាសាបច្ចុប្បន្ន ('km' ឬ 'en')
export function applyLibraryConfig(D, lang = 'km') {
  const isEn = lang === 'en';
  Object.entries(LIBRARY_ITEMS).forEach(([key, cfg]) => {
    if (!D[key]) return;
    if (cfg.k) D[key].k = cfg.k;
    D[key].nm = isEn ? (cfg.en || cfg.km || D[key].nm) : (cfg.km || cfg.en || D[key].nm);
  });
}