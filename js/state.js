/* ==========================================================================
   ឯកសារ៖ js/state.js
   តួនាទី៖ រក្សាទុកអថេរទិន្នន័យរួម (Shared State) សម្រាប់គ្រប់ឯកសារ JS ទាំងអស់
   ========================================================================== */

export const Q = s => document.querySelector(s);
export const esc = s => String(s).replace(/[&<>"']/g, c => '&#' + c.charCodeAt(0) + ';');

export const state = {
  els: [],                // បញ្ជីឧបករណ៍ទាំងអស់នៅលើប្លង់
  wires: [],              // បញ្ជីខ្សែភ្លើង [x1, y1, x2, y2]
  nid: 1,                 // លេខសម្គាល់ ID បន្ទាប់សម្រាប់ឧបករណ៍ថ្មី
  sel: null,              // ID ឧបករណ៍ដែលកំពុងជ្រើសរើស
  selW: -1,               // លេខរៀងខ្សែភ្លើងដែលកំពុងជ្រើសរើស
  clip: null,             // ទិន្នន័យឧបករណ៍ដែលបាន Copy ទុកក្នុង Clipboard
  sim: false,             // ស្ថានភាពកំពុងដំណើរការ Simulation (true/false)
  out: {},                // ស្ថានភាពបូប៊ីន/Timer ដែលមានភ្លើង (ឧ. { K1: true })
  acc: {},                // រយៈពេលរាប់វិនាទីរបស់ Timer នីមួយៗ
  pressed: new Set(),     // ប៊ូតុងចុចមួយភ្លែត (Push Button) ដែលកំពុងសង្កត់
  tog: new Set(),         // កុងតាក់/ប្រេកគ័រ (Toggle) ដែលកំពុងបើក/បិទ
  tripped: new Set(),     // រ៉េឡេកម្ដៅ (Overload) ដែលកំពុងលោត (Trip)
  live: null,             // លទ្ធផលគណនាចរន្តអគ្គិសនីបច្ចុប្បន្ន
  tm: null,               // Timer Interval សម្រាប់ Simulation
  wireMode: false,        // wire tool on/off
  wp: null,               // wire in progress: [[x,y],...]
  wcur: null,             // cursor point while drawing a wire
  guides: null,           // alignment guide lines while dragging a part
  tagCol: '',             // custom tag colour ('' = default)
  pinCol: '',             // custom pin-label colour
  flowT: 0,               // ពេលវេលាសម្រាប់ចលនាចរន្តរត់តាមខ្សែ
  last: 0,                // timestamp (ms) of last tick
  ang: 0,                 // មុំវិលរបស់ម៉ូទ័រ (0 - 360 ដឺក្រេ)
  hist: [],               // ប្រវត្តិសម្រាប់ Undo
  fut: [],                // ប្រវត្តិសម្រាប់ Redo
  v: { x: -20, y: -20, k: 1 }, // ទីតាំងផ្ទៃមើល (Pan X, Y) និងកម្រិតពង្រីក (Zoom k)
  opt: { grid: 'lines', pins: true, vibrate: true, zoom: true, listLib: false, dark: null, lang: 'km' }, // ការកំណត់
  proj: '១. សៀគ្វីបញ្ជាម៉ូទ័រ DOL', // ឈ្មោះគម្រោងបច្ចុប្បន្ន
  fileHandle: null,       // FileSystemFileHandle សម្រាប់រក្សាទុកឯកសារ .mcc លើកុំព្យូទ័រ
  mode: null,             // របៀបអូសបច្ចុប្បន្ន ('pan', 'drag', 'wire')
  pinch: null,            // ចម្ងាយម្រាមដៃពីរសម្រាប់ពង្រីក/ពង្រួមលើទូរស័ព្ទ
  ptr: new Map()          // រក្សាទុកទីតាំង Pointer/Touch
};