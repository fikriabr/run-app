import type { Exercise } from "@/lib/training-types";

/** Shared shape for band moves: reps, no logged load (band tension varies), not per side unless stated. */
type BandMove = Omit<Exercise, "category" | "measure" | "weighted" | "perSide"> &
  Partial<Pick<Exercise, "category" | "measure" | "perSide">>;

const band = (e: BandMove): Exercise => ({ category: "strength", measure: "reps", perSide: false, weighted: false, ...e });

const BAND_TIP = {
  en: "Pick a band that makes the last two reps hard but clean. Move slowly on the way back so the band does not snap you back.",
  id: "Pilih band yang membuat dua repetisi terakhir terasa berat tapi tetap rapi. Kembali dengan pelan supaya band tidak menarikmu.",
};

export const BAND_EXERCISES: Exercise[] = [
  // Lower body
  band({
    id: "band-squat",
    name: { en: "Band squat", id: "Squat dengan band" },
    equipment: ["band"],
    muscles: ["quads", "glutes"],
    steps: {
      en: ["Stand on a long band with feet shoulder width apart and hold the top at your shoulders.", "Sit the hips down and back, chest up, knees over the toes.", "Drive up through the whole foot against the band to stand tall."],
      id: ["Injak band panjang dengan kaki selebar bahu, pegang ujung atasnya di depan bahu.", "Turunkan pinggul ke bawah dan belakang, dada tegak, lutut searah ujung kaki.", "Dorong naik lewat seluruh telapak melawan tarikan band sampai berdiri tegak."],
    },
    tip: BAND_TIP,
  }),
  band({
    id: "band-split-squat",
    name: { en: "Band split squat", id: "Split squat dengan band" },
    equipment: ["band"],
    muscles: ["quads", "glutes", "hamstrings"],
    perSide: true,
    steps: {
      en: ["Stand in a long split stance with the front foot on the band, ends held at the shoulders.", "Lower straight down until the back knee nearly touches the floor.", "Push through the front heel to rise. Finish all reps, then switch legs."],
      id: ["Berdiri dengan kaki depan dan belakang berjauhan, kaki depan menginjak band, ujungnya dipegang di bahu.", "Turun lurus ke bawah sampai lutut belakang hampir menyentuh lantai.", "Dorong lewat tumit depan untuk naik. Selesaikan semua repetisi, lalu ganti kaki."],
    },
  }),
  band({
    id: "band-reverse-lunge",
    name: { en: "Band reverse lunge", id: "Reverse lunge dengan band" },
    equipment: ["band"],
    muscles: ["quads", "glutes", "hamstrings"],
    perSide: true,
    steps: {
      en: ["Stand on the band with one foot and hold the ends at your shoulders.", "Step the other foot back and lower until both knees are bent about 90 degrees.", "Drive through the front heel to step back up."],
      id: ["Injak band dengan satu kaki, pegang ujungnya di depan bahu.", "Langkahkan kaki lainnya ke belakang dan turun sampai kedua lutut menekuk sekitar 90 derajat.", "Dorong lewat tumit depan untuk kembali berdiri."],
    },
  }),
  band({
    id: "band-lateral-lunge",
    name: { en: "Band lateral lunge", id: "Lateral lunge dengan band" },
    equipment: ["band"],
    muscles: ["quads", "glutes", "hips"],
    perSide: true,
    steps: {
      en: ["Put a mini band just above the knees and stand with feet together.", "Step wide to one side and sit the hips back over that foot, the other leg straight.", "Push off to return. Keep the knees pressing out against the band."],
      id: ["Pasang mini band tepat di atas lutut, berdiri dengan kaki rapat.", "Melangkah lebar ke samping dan duduk ke belakang di atas kaki itu, kaki lainnya lurus.", "Dorong untuk kembali. Jaga lutut tetap menekan ke luar melawan band."],
    },
  }),
  band({
    id: "band-deadlift",
    name: { en: "Band deadlift", id: "Deadlift dengan band" },
    equipment: ["band"],
    muscles: ["hamstrings", "glutes", "back"],
    steps: {
      en: ["Stand on the middle of a long band, feet hip width, and grab the band low with a flat back.", "Push the floor away and stand up, squeezing the glutes at the top.", "Hinge back down with control, hips moving back first."],
      id: ["Injak bagian tengah band panjang, kaki selebar pinggul, pegang band di bawah dengan punggung lurus.", "Dorong lantai dan berdiri, kencangkan bokong di posisi atas.", "Turun kembali dengan terkendali, pinggul bergerak ke belakang lebih dulu."],
    },
  }),
  band({
    id: "band-single-leg-rdl",
    name: { en: "Band single-leg Romanian deadlift", id: "Romanian deadlift satu kaki dengan band" },
    equipment: ["band"],
    muscles: ["hamstrings", "glutes", "core"],
    perSide: true,
    steps: {
      en: ["Stand on the band with one foot and hold the other end in the opposite hand.", "Hinge forward on that leg, the free leg reaching back, until the body is near parallel.", "Squeeze the glute of the standing leg to come back up."],
      id: ["Injak band dengan satu kaki, pegang ujung lainnya dengan tangan sisi berlawanan.", "Condongkan badan ke depan bertumpu pada kaki itu, kaki bebas menjulur ke belakang sampai badan hampir datar.", "Kencangkan bokong kaki tumpuan untuk kembali berdiri."],
    },
    tip: { en: "Balance on one leg is exactly what each running stride asks for.", id: "Keseimbangan satu kaki adalah yang dibutuhkan di setiap langkah lari." },
  }),
  band({
    id: "band-glute-bridge",
    name: { en: "Banded glute bridge", id: "Glute bridge dengan band" },
    equipment: ["band", "mat"],
    muscles: ["glutes", "hamstrings", "hips"],
    steps: {
      en: ["Lie on your back, knees bent, with a mini band just above the knees.", "Press the knees out against the band and lift the hips until the body is straight from knees to shoulders.", "Hold one second at the top, then lower slowly."],
      id: ["Berbaring telentang, lutut menekuk, mini band tepat di atas lutut.", "Tekan lutut ke luar melawan band dan angkat pinggul sampai badan lurus dari lutut ke bahu.", "Tahan sedetik di atas, lalu turunkan perlahan."],
    },
  }),
  band({
    id: "band-hip-thrust",
    name: { en: "Banded hip thrust", id: "Hip thrust dengan band" },
    equipment: ["band", "bench"],
    muscles: ["glutes", "hamstrings"],
    steps: {
      en: ["Sit with the upper back against a bench or sofa and a band across the hips, held down by your hands or anchored under the feet.", "Drive the hips up until the body is flat from knees to shoulders, chin tucked.", "Lower with control."],
      id: ["Duduk dengan punggung atas bersandar di bangku atau sofa, band melintang di pinggul ditahan tangan atau dikaitkan di bawah kaki.", "Dorong pinggul ke atas sampai badan rata dari lutut ke bahu, dagu ditekuk.", "Turunkan dengan terkendali."],
    },
  }),
  band({
    id: "band-pull-through",
    name: { en: "Band pull-through", id: "Pull-through dengan band" },
    equipment: ["band"],
    muscles: ["glutes", "hamstrings"],
    steps: {
      en: ["Anchor a band low behind you, face away and hold it between your legs.", "Hinge the hips back and let the band pull your hands through your legs, back flat.", "Snap the hips forward to stand tall and squeeze the glutes."],
      id: ["Kaitkan band di bagian bawah di belakangmu, membelakangi kaitan dan pegang band di antara kaki.", "Dorong pinggul ke belakang dan biarkan band menarik tangan melewati kaki, punggung tetap lurus.", "Dorong pinggul ke depan dengan cepat sampai berdiri tegak dan kencangkan bokong."],
    },
  }),
  band({
    id: "band-monster-walk",
    name: { en: "Monster walk", id: "Monster walk" },
    equipment: ["band"],
    muscles: ["glutes", "hips"],
    steps: {
      en: ["Put a mini band around the knees or ankles and sit into a quarter squat.", "Step forward and out diagonally with one foot, then the other, keeping tension on the band.", "Walk forward for the set, then backward."],
      id: ["Pasang mini band di lutut atau pergelangan kaki dan turun sedikit seperti seperempat squat.", "Langkahkan satu kaki ke depan serong keluar, lalu kaki lainnya, band tetap tegang.", "Berjalan maju selama satu set, lalu mundur."],
    },
    tip: { en: "Strong side glutes keep the knee from caving in when you land.", id: "Bokong samping yang kuat menjaga lutut tidak jatuh ke dalam saat mendarat." },
  }),
  band({
    id: "band-seated-abduction",
    name: { en: "Seated band hip abduction", id: "Hip abduction duduk dengan band" },
    equipment: ["band", "bench"],
    muscles: ["glutes", "hips"],
    steps: {
      en: ["Sit on the edge of a chair with a mini band just above the knees, feet hip width.", "Push the knees apart as far as you can control.", "Return slowly without letting the band snap the knees together."],
      id: ["Duduk di tepi kursi dengan mini band tepat di atas lutut, kaki selebar pinggul.", "Dorong lutut ke luar sejauh yang masih terkendali.", "Kembali perlahan tanpa membiarkan band menarik lutut dengan cepat."],
    },
  }),
  band({
    id: "band-fire-hydrant",
    name: { en: "Banded fire hydrant", id: "Fire hydrant dengan band" },
    equipment: ["band", "mat"],
    muscles: ["glutes", "hips"],
    perSide: true,
    steps: {
      en: ["Start on hands and knees with a mini band just above the knees.", "Keeping the knee bent, lift one leg out to the side without tipping the hips.", "Lower slowly. Finish the side, then switch."],
      id: ["Mulai merangkak dengan mini band tepat di atas lutut.", "Dengan lutut tetap menekuk, angkat satu kaki ke samping tanpa memiringkan pinggul.", "Turunkan perlahan. Selesaikan satu sisi, lalu ganti."],
    },
  }),
  band({
    id: "band-hamstring-curl",
    name: { en: "Lying band hamstring curl", id: "Hamstring curl berbaring dengan band" },
    equipment: ["band", "mat"],
    muscles: ["hamstrings"],
    steps: {
      en: ["Anchor a band low in front of you, lie face down and loop it around your ankles.", "Curl the heels toward the glutes, hips pressed into the floor.", "Straighten the legs slowly."],
      id: ["Kaitkan band di bawah di depanmu, berbaring tengkurap dan lingkarkan band di pergelangan kaki.", "Tekuk lutut menarik tumit ke arah bokong, pinggul tetap menempel di lantai.", "Luruskan kaki perlahan."],
    },
  }),
  band({
    id: "band-standing-march",
    name: { en: "Banded standing march", id: "Standing march dengan band" },
    equipment: ["band"],
    muscles: ["hips", "core"],
    perSide: true,
    steps: {
      en: ["Loop a mini band around both feet and stand tall, a hand on a wall if needed.", "Drive one knee up to hip height against the band, like a running stride.", "Lower with control and repeat. Finish the side, then switch."],
      id: ["Lingkarkan mini band di kedua kaki dan berdiri tegak, pegang dinding bila perlu.", "Angkat satu lutut setinggi pinggul melawan band, seperti gerakan langkah lari.", "Turunkan dengan terkendali dan ulangi. Selesaikan satu sisi, lalu ganti."],
    },
    tip: { en: "Strong hip flexors keep your knee drive late in a race.", id: "Hip flexor yang kuat menjaga ayunan lutut tetap tinggi di akhir lomba." },
  }),
  band({
    id: "band-calf-raise",
    name: { en: "Band calf raise", id: "Calf raise dengan band" },
    equipment: ["band"],
    muscles: ["calves"],
    steps: {
      en: ["Stand on the band with the balls of the feet and hold the ends at your shoulders.", "Rise as high as you can onto the toes.", "Lower slowly over two to three seconds."],
      id: ["Injak band dengan bagian depan telapak kaki, pegang ujungnya di depan bahu.", "Jinjit setinggi mungkin.", "Turunkan perlahan selama dua sampai tiga detik."],
    },
  }),
  band({
    id: "band-ankle-strength",
    category: "mobility",
    name: { en: "Band ankle strengthening", id: "Penguatan pergelangan kaki dengan band" },
    equipment: ["band", "mat"],
    muscles: ["calves"],
    perSide: true,
    steps: {
      en: ["Sit with legs straight and loop a band around the front of one foot, anchored to the side.", "Turn the foot out against the band (eversion), then switch the anchor side and turn it in (inversion).", "Move only at the ankle, slowly in both directions."],
      id: ["Duduk dengan kaki lurus, lingkarkan band di depan satu telapak kaki, kaitkan ke samping.", "Putar telapak kaki ke luar melawan band (eversi), lalu pindahkan kaitan ke sisi lain dan putar ke dalam (inversi).", "Gerakkan hanya pergelangan kaki, pelan ke dua arah."],
    },
    tip: { en: "Helps prevent rolled ankles on trails and uneven ground.", id: "Membantu mencegah keseleo di jalur trail dan jalan tidak rata." },
  }),
  // Upper body
  band({
    id: "band-chest-press",
    name: { en: "Standing band chest press", id: "Chest press berdiri dengan band" },
    equipment: ["band"],
    muscles: ["chest", "shoulders", "arms"],
    steps: {
      en: ["Anchor the band behind you at chest height, or wrap it around your upper back, and take a split stance.", "Press the hands straight forward until the arms are straight.", "Return slowly to the chest."],
      id: ["Kaitkan band di belakangmu setinggi dada atau lingkarkan di punggung atas, berdiri dengan satu kaki di depan.", "Dorong tangan lurus ke depan sampai lengan lurus.", "Kembalikan perlahan ke depan dada."],
    },
  }),
  band({
    id: "band-push-up",
    name: { en: "Banded push-up", id: "Push-up dengan band" },
    equipment: ["band"],
    muscles: ["chest", "arms", "core"],
    steps: {
      en: ["Wrap a band across your upper back and hold one end under each hand.", "Do a push-up: body in one line, chest down toward the floor.", "Press up against the band. Use a lighter band or knees down if form breaks."],
      id: ["Lingkarkan band di punggung atas, tahan tiap ujungnya di bawah telapak tangan.", "Lakukan push-up: badan satu garis, dada turun mendekati lantai.", "Dorong naik melawan band. Pakai band lebih ringan atau bertumpu di lutut jika teknik rusak."],
    },
  }),
  band({
    id: "band-shoulder-press",
    name: { en: "Band shoulder press", id: "Shoulder press dengan band" },
    equipment: ["band"],
    muscles: ["shoulders", "arms"],
    steps: {
      en: ["Stand on the band and hold the ends at shoulder height, palms forward.", "Press straight overhead without leaning back.", "Lower slowly to the shoulders."],
      id: ["Injak band dan pegang ujungnya setinggi bahu, telapak menghadap ke depan.", "Dorong lurus ke atas kepala tanpa mencondongkan badan ke belakang.", "Turunkan perlahan ke bahu."],
    },
  }),
  band({
    id: "band-lateral-raise",
    name: { en: "Band lateral raise", id: "Lateral raise dengan band" },
    equipment: ["band"],
    muscles: ["shoulders"],
    steps: {
      en: ["Stand on the band and hold the ends by your sides, elbows soft.", "Raise the arms out to the sides up to shoulder height.", "Lower slowly."],
      id: ["Injak band dan pegang ujungnya di samping badan, siku sedikit menekuk.", "Angkat lengan ke samping sampai setinggi bahu.", "Turunkan perlahan."],
    },
  }),
  band({
    id: "band-biceps-curl",
    name: { en: "Band biceps curl", id: "Biceps curl dengan band" },
    equipment: ["band"],
    muscles: ["arms"],
    steps: {
      en: ["Stand on the band and hold the ends, palms forward.", "Curl the hands to the shoulders, elbows pinned to your sides.", "Lower all the way with control."],
      id: ["Injak band dan pegang ujungnya, telapak menghadap ke depan.", "Tekuk siku menarik tangan ke bahu, siku tetap menempel di badan.", "Turunkan sampai lurus dengan terkendali."],
    },
  }),
  band({
    id: "band-triceps-extension",
    name: { en: "Band overhead triceps extension", id: "Ekstensi triceps di atas kepala dengan band" },
    equipment: ["band"],
    muscles: ["arms"],
    steps: {
      en: ["Stand on the band and hold the other end behind your head with both hands, elbows pointing up.", "Straighten the arms overhead.", "Bend the elbows to lower slowly behind the head."],
      id: ["Injak band dan pegang ujung lainnya di belakang kepala dengan dua tangan, siku menghadap ke atas.", "Luruskan lengan ke atas kepala.", "Tekuk siku untuk menurunkan perlahan ke belakang kepala."],
    },
  }),
  band({
    id: "band-lat-pulldown",
    name: { en: "Band lat pulldown", id: "Lat pulldown dengan band" },
    equipment: ["band"],
    muscles: ["back", "arms"],
    steps: {
      en: ["Anchor the band high, for example over a door, and kneel facing it holding both ends.", "Pull the elbows down to your sides, chest up.", "Let the arms straighten slowly overhead."],
      id: ["Kaitkan band di atas, misalnya di atas pintu, berlutut menghadapnya sambil memegang kedua ujung.", "Tarik siku ke bawah ke samping badan, dada terangkat.", "Luruskan lengan perlahan kembali ke atas."],
    },
    tip: { en: "A good first step toward your first pull-up.", id: "Langkah awal yang baik menuju pull-up pertamamu." },
  }),
  band({
    id: "band-bent-over-row",
    name: { en: "Band bent-over row", id: "Bent-over row dengan band" },
    equipment: ["band"],
    muscles: ["back", "arms"],
    steps: {
      en: ["Stand on the band, hinge forward with a flat back and hold the ends.", "Row the hands to your lower ribs, squeezing the shoulder blades.", "Lower slowly without rounding the back."],
      id: ["Injak band, bungkukkan badan dengan punggung lurus dan pegang ujungnya.", "Tarik tangan ke rusuk bawah sambil merapatkan tulang belikat.", "Turunkan perlahan tanpa membungkukkan punggung."],
    },
  }),
  band({
    id: "band-upright-row",
    name: { en: "Band upright row", id: "Upright row dengan band" },
    equipment: ["band"],
    muscles: ["shoulders", "back"],
    steps: {
      en: ["Stand on the band and hold it in front of your thighs, hands a bit narrower than shoulders.", "Pull the hands up to chest height, elbows leading and staying below the shoulders.", "Lower slowly."],
      id: ["Injak band dan pegang di depan paha, tangan sedikit lebih sempit dari bahu.", "Tarik tangan ke atas sampai setinggi dada, siku memimpin dan tetap di bawah bahu.", "Turunkan perlahan."],
    },
  }),
  band({
    id: "band-external-rotation",
    name: { en: "Band shoulder external rotation", id: "External rotation bahu dengan band" },
    equipment: ["band"],
    muscles: ["shoulders"],
    perSide: true,
    steps: {
      en: ["Anchor the band at elbow height beside you and hold it with the far hand, elbow bent 90 degrees against your side.", "Rotate the forearm outward, keeping the elbow pinned.", "Return slowly. Finish the side, then switch."],
      id: ["Kaitkan band setinggi siku di sampingmu, pegang dengan tangan yang jauh, siku menekuk 90 derajat menempel di badan.", "Putar lengan bawah ke luar, siku tetap menempel.", "Kembali perlahan. Selesaikan satu sisi, lalu ganti."],
    },
  }),
  // Core and mobility
  band({
    id: "band-woodchop",
    category: "core",
    name: { en: "Band woodchop", id: "Woodchop dengan band" },
    equipment: ["band"],
    muscles: ["obliques", "core", "shoulders"],
    perSide: true,
    steps: {
      en: ["Anchor the band high to one side and hold it with both hands, arms straight.", "Pull diagonally down across the body, turning through the hips and chest.", "Return slowly. Finish the side, then switch."],
      id: ["Kaitkan band di atas di satu sisi, pegang dengan dua tangan, lengan lurus.", "Tarik serong ke bawah menyilang badan, putar lewat pinggul dan dada.", "Kembali perlahan. Selesaikan satu sisi, lalu ganti."],
    },
  }),
  band({
    id: "band-dead-bug",
    category: "core",
    name: { en: "Banded dead bug", id: "Dead bug dengan band" },
    equipment: ["band", "mat"],
    muscles: ["core"],
    steps: {
      en: ["Lie on your back, knees over hips, holding a band anchored behind your head with straight arms.", "Keep the lower back pressed down and slowly extend one leg out.", "Bring it back and switch legs. The band keeps your trunk working."],
      id: ["Berbaring telentang, lutut di atas pinggul, pegang band yang dikaitkan di belakang kepala dengan lengan lurus.", "Jaga punggung bawah menempel dan luruskan satu kaki perlahan.", "Kembalikan dan ganti kaki. Band membuat otot inti terus bekerja."],
    },
  }),
  band({
    id: "band-press-out",
    category: "core",
    name: { en: "Standing anti-rotation press out", id: "Anti-rotation press out berdiri" },
    equipment: ["band"],
    muscles: ["core", "obliques"],
    perSide: true,
    steps: {
      en: ["Anchor the band at chest height beside you and hold it at your sternum, standing side-on.", "Press the hands straight out without letting the band twist you.", "Hold two seconds, bring back to the chest. Finish the side, then switch."],
      id: ["Kaitkan band setinggi dada di sampingmu, pegang di depan tulang dada, berdiri menyamping.", "Dorong tangan lurus ke depan tanpa membiarkan band memutar badan.", "Tahan dua detik, tarik kembali ke dada. Selesaikan satu sisi, lalu ganti."],
    },
  }),
  band({
    id: "band-pass-through",
    category: "mobility",
    name: { en: "Band shoulder pass-through", id: "Pass-through bahu dengan band" },
    equipment: ["band"],
    muscles: ["shoulders", "spine"],
    steps: {
      en: ["Hold a light band wide in front of your hips, arms straight.", "Lift it over your head and down behind you as far as it goes without bending the elbows.", "Bring it back the same way. Widen the grip if it pinches."],
      id: ["Pegang band ringan dengan genggaman lebar di depan pinggul, lengan lurus.", "Angkat melewati kepala dan turunkan ke belakang sejauh mungkin tanpa menekuk siku.", "Kembalikan lewat jalur yang sama. Lebarkan genggaman jika terasa terjepit."],
    },
  }),
];
