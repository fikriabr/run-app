import type { Routine, RoutineItem } from "@/lib/training-types";

const item = (exerciseId: string, sets: number, target: number, restSeconds: number): RoutineItem => ({ exerciseId, sets, target, restSeconds });

export const BUILT_IN_ROUTINES: Routine[] = [
  {
    id: "runner-strength-a",
    category: "strength",
    builtIn: true,
    name: { en: "Runner strength A", id: "Kekuatan pelari A" },
    description: {
      en: "Bodyweight lower body and core. Builds the legs and trunk that hold your form late in a run.",
      id: "Tubuh bawah dan inti tanpa alat. Membangun kaki dan badan yang menjaga teknik di akhir lari.",
    },
    items: [
      item("squat", 3, 12, 60),
      item("reverse-lunge", 3, 8, 60),
      item("glute-bridge", 3, 12, 45),
      item("calf-raise", 3, 15, 45),
      item("side-plank", 2, 30, 30),
      item("dead-bug", 2, 8, 30),
    ],
  },
  {
    id: "runner-strength-b",
    category: "strength",
    builtIn: true,
    name: { en: "Runner strength B", id: "Kekuatan pelari B" },
    description: {
      en: "Dumbbell session for heavier single-leg and hinge work. Log the weights and add a little when every rep feels clean.",
      id: "Sesi dumbbell untuk gerakan satu kaki dan hinge yang lebih berat. Catat bebannya dan tambah sedikit saat semua repetisi terasa rapi.",
    },
    items: [
      item("goblet-squat", 3, 10, 90),
      item("dumbbell-rdl", 3, 10, 90),
      item("bulgarian-split-squat", 3, 8, 75),
      item("step-up", 2, 10, 60),
      item("calf-raise", 3, 12, 45),
      item("pallof-press", 2, 10, 30),
    ],
  },
  {
    id: "hip-stability",
    category: "strength",
    builtIn: true,
    name: { en: "Hip stability", id: "Stabilitas pinggul" },
    description: {
      en: "Short, light session for the glutes and hips. Good in taper weeks or the day after a hard run.",
      id: "Sesi pendek dan ringan untuk bokong dan pinggul. Cocok di minggu tapering atau sehari setelah lari berat.",
    },
    items: [
      item("clamshell", 2, 15, 20),
      item("lateral-band-walk", 2, 12, 30),
      item("single-leg-glute-bridge", 2, 10, 30),
      item("single-leg-rdl", 2, 8, 30),
      item("side-plank", 2, 30, 20),
    ],
  },
  {
    id: "upper-body",
    category: "strength",
    builtIn: true,
    name: { en: "Upper body and core", id: "Tubuh atas dan inti" },
    description: {
      en: "Arms, back and shoulders with dumbbells. A strong upper body keeps the arm swing steady.",
      id: "Lengan, punggung, dan bahu dengan dumbbell. Tubuh atas yang kuat menjaga ayunan lengan tetap stabil.",
    },
    items: [
      item("push-up", 3, 10, 60),
      item("dumbbell-row", 3, 10, 60),
      item("shoulder-press", 3, 10, 60),
      item("floor-press", 3, 10, 60),
      item("plank", 3, 40, 30),
      item("bird-dog", 2, 8, 30),
    ],
  },
  {
    id: "core-10",
    category: "core",
    builtIn: true,
    name: { en: "Core in 10 minutes", id: "Inti tubuh 10 menit" },
    items: [
      item("dead-bug", 2, 10, 20),
      item("bird-dog", 2, 10, 20),
      item("plank", 2, 40, 20),
      item("side-plank", 2, 30, 20),
      item("russian-twist", 2, 12, 20),
    ],
  },
  {
    id: "plyo-beginner",
    category: "plyometric",
    builtIn: true,
    name: { en: "Plyometrics: first steps", id: "Pliometrik: tahap awal" },
    description: {
      en: "Low-volume jumps and drills to make your stride springier. Do it fresh, not after a hard run.",
      id: "Lompatan dan drill volume rendah agar langkah lebih memantul. Lakukan saat segar, bukan setelah lari berat.",
    },
    items: [
      item("a-skip", 3, 2, 45),
      item("pogo-hops", 3, 15, 60),
      item("jump-squat", 3, 6, 75),
      item("skater-jump", 2, 6, 60),
    ],
  },
  {
    id: "plyo-power",
    category: "plyometric",
    builtIn: true,
    name: { en: "Plyometric power", id: "Kekuatan pliometrik" },
    description: {
      en: "Higher-intensity jumps. Only after a few weeks of the first-steps session without soreness.",
      id: "Lompatan intensitas lebih tinggi. Hanya setelah beberapa minggu sesi tahap awal tanpa pegal berlebih.",
    },
    items: [
      item("high-knees", 2, 20, 45),
      item("box-jump", 4, 5, 90),
      item("broad-jump", 3, 5, 90),
      item("split-jump", 3, 6, 75),
      item("pogo-hops", 2, 20, 60),
    ],
  },
  {
    id: "yoga-runners",
    category: "yoga",
    builtIn: true,
    name: { en: "Yoga for runners", id: "Yoga untuk pelari" },
    description: {
      en: "Opens the hips, hamstrings and calves that running tightens. Hold each pose and breathe slowly.",
      id: "Membuka pinggul, paha belakang, dan betis yang kaku karena lari. Tahan tiap pose dan bernapas pelan.",
    },
    items: [
      item("cat-cow", 1, 8, 0),
      item("downward-dog", 2, 45, 0),
      item("low-lunge", 1, 45, 0),
      item("warrior-2", 1, 30, 0),
      item("pigeon-pose", 1, 60, 0),
      item("supine-twist", 1, 45, 0),
      item("childs-pose", 1, 60, 0),
    ],
  },
  {
    id: "yoga-wind-down",
    category: "yoga",
    builtIn: true,
    name: { en: "Evening wind-down", id: "Yoga santai malam" },
    items: [
      item("childs-pose", 1, 60, 0),
      item("cat-cow", 1, 8, 0),
      item("sphinx-pose", 2, 45, 0),
      item("supine-twist", 1, 60, 0),
    ],
  },
  {
    id: "dr-phase-1",
    category: "diastasis",
    builtIn: true,
    name: { en: "Diastasis recti: foundation", id: "Diastasis recti: dasar" },
    description: {
      en: "Breathing and deep-core work to reconnect the abdominal wall, done lying down. Stop or regress if the belly domes. Not a replacement for a check by a pelvic health physiotherapist.",
      id: "Latihan napas dan otot inti dalam untuk menyambungkan kembali dinding perut, dilakukan sambil berbaring. Berhenti atau turunkan level jika perut menonjol. Bukan pengganti pemeriksaan fisioterapis kesehatan panggul.",
    },
    items: [
      item("dr-breathing", 1, 10, 0),
      item("dr-tva", 2, 8, 30),
      item("dr-pelvic-tilt", 2, 10, 30),
      item("dr-heel-slide", 2, 8, 30),
      item("glute-bridge", 2, 10, 30),
    ],
  },
  {
    id: "dr-phase-2",
    category: "diastasis",
    builtIn: true,
    name: { en: "Diastasis recti: progression", id: "Diastasis recti: lanjutan" },
    description: {
      en: "Adds leg load once the foundation feels easy with no doming. Keep exhaling on the effort.",
      id: "Menambah beban kaki setelah tahap dasar terasa mudah tanpa perut menonjol. Tetap buang napas saat bagian berat.",
    },
    items: [
      item("dr-breathing", 1, 6, 0),
      item("dr-toe-tap", 3, 8, 30),
      item("dr-dead-bug", 3, 6, 30),
      item("bird-dog", 2, 8, 30),
      item("glute-bridge", 3, 12, 30),
      item("clamshell", 2, 12, 20),
    ],
  },
  {
    id: "pre-run-mobility",
    category: "mobility",
    builtIn: true,
    name: { en: "Pre-run mobility", id: "Mobilitas sebelum lari" },
    description: { en: "Five minutes of dynamic moves before you head out.", id: "Lima menit gerakan dinamis sebelum mulai lari." },
    items: [
      item("leg-swings", 1, 10, 0),
      item("knee-to-wall", 1, 10, 0),
      item("worlds-greatest-stretch", 1, 5, 0),
      item("open-book", 1, 8, 0),
      item("a-skip", 2, 1, 20),
    ],
  },
  {
    id: "post-run-stretch",
    category: "mobility",
    builtIn: true,
    name: { en: "Post-run stretch", id: "Peregangan setelah lari" },
    items: [
      item("calf-stretch", 1, 45, 0),
      item("hamstring-stretch", 1, 45, 0),
      item("hip-flexor-stretch", 1, 45, 0),
      item("hip-90-90", 1, 6, 0),
      item("childs-pose", 1, 60, 0),
    ],
  },
];

export const BUILT_IN_ROUTINE_MAP: Record<string, Routine> = Object.fromEntries(BUILT_IN_ROUTINES.map((r) => [r.id, r]));
