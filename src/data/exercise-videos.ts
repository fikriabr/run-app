import type { ExerciseVideos } from "@/lib/training-types";

// Every video was checked by thumbnail for who demonstrates it, and through YouTube oEmbed for being embeddable.
// Titles are kept as listed on YouTube so the source stays visible.
// Add `start` and `end` (seconds) to a video to loop only the demo part instead of the whole tutorial.
export const EXERCISE_VIDEOS: Record<string, ExerciseVideos> = {
  "squat": {
    male: { id: "ckvHymGK3s0", title: "The Air Squat | Beginner Bodyweight Squat Variation" },
    female: { id: "P-yaD24bUE8", title: "Bodyweight Squat Tutorial - Proper Form and Technique" },
  },
  "goblet-squat": {
    male: { id: "gCESNsDsbqk", title: "Goblet Squats: Proper Form & Technique" },
    female: { id: "mF5tnEBrdkc", title: "Goblet Squat" },
  },
  "reverse-lunge": {
    male: { id: "u_zSfK5ZFU4", title: "Reverse Lunge Exercise: Proper Form" },
    female: { id: "MyqQRJ2lW7Q", title: "Dumbbell Reverse Lunges (Tutorial + Tips) | Team Evolve" },
  },
  "bulgarian-split-squat": {
    male: { id: "2C-uNgKwPLE", title: "How To: Bulgarian Split Squat" },
    female: { id: "QD4P9Di7L20", title: "How to Perform a Bulgarian Split Squat at Home" },
  },
  "dumbbell-rdl": {
    male: { id: "uUjqvxEWcbo", title: "Dumbbell Romanian Deadlift (RDL) | TECHNIQUE for Beginners" },
    female: { id: "08StUopZee8", title: "Dumbbell Romanian Deadlift" },
  },
  "single-leg-rdl": {
    male: { id: "gz9l8UA_KXs", title: "How to Perform Single Leg Romanian Deadlifts | Bodyweight Exercise Tutorial" },
    female: { id: "GY3xKrda3U4", title: "Dumbbell Single Leg Deadlift Variations Tutorial | RDL" },
  },
  "step-up": {
    male: { id: "9ZknEYboBOQ", title: "Dumbbell Step-up - How To" },
    female: { id: "nE9Yh1JuCuo", title: "Dumbbell Single Leg Step Up Form | How To Do a Step Up" },
  },
  "glute-bridge": {
    male: { id: "8bbE64NuDTU", title: "How To: Glute Bridge" },
    female: { id: "wPM8icPu6H8", title: "How To Do A Glute Bridge | The Right Way | Well+Good" },
  },
  "single-leg-glute-bridge": {
    male: { id: "Zb3ILLdI6fk", title: "Single-Leg Glute Bridge" },
    female: { id: "_K_di6h2-Wg", title: "How to do a Single-Leg Glute Bridge | The Right Way | Well+Good" },
  },
  "hip-thrust": {
    male: { id: "SEdqd1n0cvg", title: "How To: Hip Thrust" },
    female: { id: "C1wpa1CWauI", title: "STOP DOING YOUR HIP THRUSTS WRONG!" },
  },
  "calf-raise": {
    male: { id: "hPA98_r-6e4", title: "Standing DB Calf Raises (Exercise Library)" },
    female: { id: "nnPGrBLNlaw", title: "Calf Raises" },
  },
  "push-up": {
    male: { id: "IODxDxX7oi4", title: "The Perfect Push Up | Do it right!" },
    female: { id: "P3D2PPMYWjk", title: "Learn How To Do a Push-Up" },
  },
  "dumbbell-row": {
    male: { id: "pYcpY20QaE8", title: "How To: Dumbbell Bent-Over Row (Single-Arm)" },
    female: { id: "SIuz8kZNn48", title: "Dumbbell Single Arm Row" },
  },
  "shoulder-press": {
    male: { id: "qEwKCR5JCog", title: "How To: Dumbbell Shoulder Press" },
    female: { id: "qGtDCtYeRQM", title: "Dumbbell Overhead Press" },
  },
  "floor-press": {
    male: { id: "uUGDRwge4F8", title: "How To: Dumbbell Floor Press" },
    female: { id: "T0Y3OBF1bNI", title: "How To Do A Dumbbell Floor Press" },
  },
  "lateral-band-walk": {
    male: { id: "i0w7KczRvkk", title: "Lateral walk with exercise band" },
    female: { id: "PhNkkOieB-8", title: "Lateral Band Walk" },
  },
  "clamshell": {
    male: { id: "gFyIjunfbbg", title: "How to Do the Clamshell Exercise" },
    female: { id: "Cn09FlW5Zfs", title: "How to do a Clamshell | The Right Way | Well+Good" },
  },
  "plank": {
    male: { id: "pSHjTRCQxIw", title: "How To: Plank" },
    female: { id: "u6ZelKyUM6g", title: "How to Plank | The Right Way | Well+Good" },
  },
  "side-plank": {
    male: { id: "YlF9mvIOo8I", title: "Side Plank Tutorial — (OBLIQUE WORKOUT FOR BEGINNERS)" },
    female: { id: "iNbH7_edNI8", title: "Side Plank Tutorial - Proper Form and Technique" },
  },
  "dead-bug": {
    male: { id: "o4GKiEoYClI", title: "Dead Bug Exercise For Core Stability  | Pursuit Physical Therapy" },
    female: { id: "GbSC02oU3To", title: "How to Do a Dead Bug: A Guide from Physical Therapists" },
  },
  "bird-dog": {
    male: { id: "ZdAHe9_HeEw", title: "How to do a Bird Dog | Proper Form & Technique | NASM" },
    female: { id: "xEDnlOxeJH4", title: "How to Do the Bird Dog Exercise: A Guide from Physical Therapists" },
  },
  "pallof-press": {
    male: { id: "QGrE4L2o4J0", title: "Pallof Press | Core Strengthening Exercise" },
    female: { id: "5_8d8vHgZvU", title: "Pallof Press - How To Do Pallof Presses + Variations" },
  },
  "russian-twist": {
    male: { id: "PkGPokybYaU", title: "How To Do A KETTLEBELL RUSSIAN TWIST | Exercise Demonstration Video and Guide" },
    female: { id: "IJDOoVyVjhc", title: "Russian Twist Tutorial - Proper Form and Technique" },
  },
  "jump-squat": {
    male: { id: "tZjZxrAeVjg", title: "How To Do Jump Squats Properly - Full Video Tutorial & Exercise Guide (With & Without Weights)" },
    female: { id: "Azl5tkCzDcc", title: "Jump Squat" },
  },
  "box-jump": {
    male: { id: "hxldG9FX4j4", title: "How To: Box Jump" },
  },
  "skater-jump": {
    male: { id: "9_jLW6VkU8A", title: "Speed Skaters Exercise (Skater Hops): Proper Form" },
    female: { id: "rKjOsXiIqqc", title: "Skater Jumps" },
  },
  "pogo-hops": {
    male: { id: "lz6BM6WyJ0k", title: "How To Do Pogo Hops" },
  },
  "split-jump": {
    male: { id: "j7ODZHSEGQA", title: "Split Jump - How To" },
    female: { id: "jurMUbKDjsU", title: "Split Jump" },
  },
  "broad-jump": {
    male: { id: "7Du1KbwCdUk", title: "How To Do A BROAD JUMP | Exercise Demonstration Video and Guide" },
    female: { id: "uhz-ia-2UcM", title: "How To Do Broad Jumps" },
  },
  "a-skip": {
    male: { id: "_MCDR-luwHU", title: "A Skip Running Form Drill Demonstration" },
    female: { id: "A7r6yCpmSrA", title: "How to Do A-Skip - B-Skip with Proper Form- Find Your Stride with Coach John Smith" },
  },
  "high-knees": {
    male: { id: "N4VwL0WGhzw", title: "High Knees Drill For Runners - Dr. Jordan Fairley" },
    female: { id: "tx5rgpDAJRI", title: "High Knees" },
  },
  "downward-dog": {
    male: { id: "sd-Fn6xpyeg", title: "Yoga For Men | How To Do a Downward Dog For Inflexible Beginners" },
    female: { id: "ljYDGXjyKNA", title: "How To Do A Downward Facing Dog Pose (Adho Mukha Svanasana)" },
  },
  "childs-pose": {
    male: { id: "zNY7iPq39OQ", title: "Active Child's Pose for Back Pain Relief" },
    female: { id: "EniGBCHAEVQ", title: "How to do Childs Pose PROPERLY | Yoga for Beginners Pose Tutorial" },
  },
  "low-lunge": {
    male: { id: "c2N4yXXVNOs", title: "Low Lunge- Pose Guide Technique Walkthrough" },
    female: { id: "OfJl_jhJcWw", title: "Runner's Lunge - Foundations of Yoga" },
  },
  "pigeon-pose": {
    male: { id: "XvKtUDQqfUs", title: "The #1 Mistake People Make in Pigeon Stretch | Yoga for Men" },
    female: { id: "M1gEGLtF1p0", title: "How To Do Pigeon Pose | The Right Way | Well+Good" },
  },
  "warrior-2": {
    male: { id: "7Xl-TNyOJec", title: "Warrior Two Pose Guide Technique Walkthrough" },
    female: { id: "4Ejz7IgODlU", title: "Warrior 2 Yoga Pose - Yoga With Adriene" },
  },
  "cat-cow": {
    male: { id: "jGR2LTqGI2Y", title: "Cat Cow Pose Basics | Get the Alignment Right" },
    female: { id: "y_cKHKi9UaM", title: "How to do a Cat-Cow | The Right Way | Well+Good" },
  },
  "sphinx-pose": {
    male: { id: "yvsgUzpMP1M", title: "Sphinx Pose, Salamba Bhujangasana" },
    female: { id: "Z0n4DYBBhhE", title: "How To Do Sphinx Pose (Salamba Bhujangasana)" },
  },
  "supine-twist": {
    male: { id: "gC8CUEnq_ks", title: "Supine Twist Supta Matsyendrasana Mistakes" },
    female: { id: "NDA8rQDyBzQ", title: "Lying Down Spinal Twist - Cat Kabira" },
  },
  "dr-breathing": {
    female: { id: "nmUr_pA4BCQ", title: "How To Diaphragm Breathe For Pelvic Floor" },
  },
  "dr-tva": {
    female: { id: "2LH2Yfjl8JI", title: "TA Activation for Diastasis Recti Healing" },
  },
  "dr-pelvic-tilt": {
    female: { id: "Ezb3QgzitVg", title: "Diastasis recti exercises - Pelvic tilt - Core Fitness for Moms" },
  },
  "dr-heel-slide": {
    female: { id: "3SMvNev_L4k", title: "Diastasis recti exercises - Heel slides - Core Fitness for Moms" },
  },
  "dr-toe-tap": {
    female: { id: "3FZfFmUK03k", title: "Pelvic floor exercise: Toe taps in table top #fitness #pelvichealth #pelvicfloorexercises" },
  },
  "dr-dead-bug": {
    female: { id: "LjBfAyRRg68", title: "Diastasis Recti Dead Bug Exercise" },
  },
  "worlds-greatest-stretch": {
    male: { id: "3Y1_eMdreK8", title: "How to do the World’s Greatest Stretch" },
    female: { id: "uUQw9DwkD5Q", title: "World’s Greatest Stretch! The 4-Step Lunge to Release tight Hip Flexors, Hamstrings, Thoracic Spine" },
  },
  "hip-flexor-stretch": {
    male: { id: "gqoPYLUgP48", title: "Bulletproof Step-by-step Guide to the Half Kneeling Hip Flexor Stretch\" [stretching advice]" },
    female: { id: "F55tzqJggAY", title: "Half Kneeling Hip Flexor Stretch | B3 Physical Therapy" },
  },
  "hamstring-stretch": {
    male: { id: "5f5aHVj-f9Q", title: "How to Do a Standing Hamstring Stretch: A Guide from Physical Therapists" },
    female: { id: "cHjdA3f-81s", title: "Standing Hamstring Stretch | B3 Physical Therapy" },
  },
  "calf-stretch": {
    male: { id: "dEJgPRgsnnY", title: "Gastroc and Soleus Calf Stretching" },
    female: { id: "Zmc36LtB7f8", title: "Soleus Stretch Standing" },
  },
  "leg-swings": {
    male: { id: "difYoBtZi2s", title: "How To Do Leg Swings" },
    female: { id: "E68-pMl1Im8", title: "Leg Swings   Front to back" },
  },
  "open-book": {
    male: { id: "e71IP2SLrRc", title: "Open Book/Thoracic Rotation" },
    female: { id: "93C-PRmMra0", title: "Thoracic Mobility- Open Book Stretch" },
  },
  "knee-to-wall": {
    male: { id: "Clutk_VsgUY", title: "How To Do The KNEE TO WALL ANKLE DORSIFLEXION TEST | Exercise Demonstration Video and Guide" },
    female: { id: "xoZWOR1a1zU", title: "knee to wall ankle mobility exercise" },
  },
  "hip-90-90": {
    male: { id: "t4Zz6-aG8Iw", title: "90 90 Hip Stretch (Best Hip Mobility Exercise!)" },
  },
  "barbell-back-squat": {
    male: { id: "SW_C1A-rejs", title: "How To: Deep Barbell Back Squat" },
    female: { id: "rrJIyZGlK8c", title: "How To Do A Barbell Back Squat" },
  },
  "barbell-front-squat": {
    male: { id: "tlfahNdNPPI", title: "How To: Front Squat (Barbell)" },
    female: { id: "revE4okQS6c", title: "HOW TO FRONT SQUAT | Coach Kelly Cues" },
  },
  "deadlift": {
    male: { id: "yPqv3ejnZvc", title: "How to do a Barbell Deadlift" },
    female: { id: "qVuYxjpAavw", title: "Form Check: How To Deadlift by Joslyn Thompson Rule" },
  },
  "barbell-rdl": {
    male: { id: "3VXmecChYYM", title: "How to do the ROMANIAN DEADLIFT! | 2 Minute Tutorial" },
    female: { id: "1srqEAPcUCc", title: "HOW TO DO A BARBELL ROMANIAN DEADLIFT | Coach Kelly Cues" },
  },
  "bench-press": {
    male: { id: "lWFknlOTbyM", title: "How to do the BARBELL BENCH PRESS! | 2 Minute Tutorial" },
    female: { id: "JvOJdUtx6UQ", title: "How to BENCH PRESS with Good Form - Quick and Easy Technique Fix" },
  },
  "overhead-press": {
    male: { id: "2yjwXTZQDDI", title: "How To: Standing Straight-Bar Military / Overhead Press" },
    female: { id: "RoY7aG94X_Y", title: "Standing Barbell Overhead Press" },
  },
  "barbell-row": {
    male: { id: "FWJR5Ve8bnQ", title: "How to do the BENT-OVER BARBELL ROW! | 2 Minute Tutorial" },
    female: { id: "vnGSs0qnD8Q", title: "Bent Over Barbell Row" },
  },
  "barbell-hip-thrust": {
    male: { id: "xDmFkJxPzeM", title: "How To Build Great Glutes with Perfect Hip Thrust Technique (Fix Mistakes!)" },
    female: { id: "4hYRM_60BD4", title: "HOW TO BARBELL HIP THRUST | Coach Kelly Cues" },
  },
  "db-walking-lunge": {
    male: { id: "Pbmj6xPo-Hw", title: "Walking Lunges Exercise Tutorial | Build Legendary Legs & Cardio" },
    female: { id: "_qSuiZ62vqI", title: "How To Do A DUMBBELL WALKING LUNGE | Exercise Demonstration Video and Guide" },
  },
  "db-lateral-lunge": {
    male: { id: "R8jArZG2J6Q", title: "How To Do A DUMBBELL LATERAL LUNGE | Exercise Demonstration Video and Guide" },
    female: { id: "a-udwj1jnwI", title: "Dumbbell Lateral Lunges (Tutorial + Tips) | Team Evolve" },
  },
  "farmer-carry": {
    male: { id: "z7E_YU9P1jU", title: "How to Perform the Farmer’s Carry" },
    female: { id: "7mzKcADa46c", title: "Dumbbell Farmer Carry Exercise Tutorial | Farmers Carry Compound Exercise" },
  },
  "renegade-row": {
    male: { id: "wTqlJ0aoJlM", title: "Renegade Row: Core & Back Builder" },
    female: { id: "_I98ircIcpE", title: "How To Do Renegade Rows" },
  },
  "lateral-raise": {
    male: { id: "3VcKaXpzqRo", title: "How To: Dumbbell Side Lateral Raise" },
    female: { id: "KCMF8w7rs70", title: "How To Do Lateral Raises - Build Your Shoulders" },
  },
  "biceps-curl": {
    male: { id: "6DeLZ6cbgWQ", title: "How to Perform Standing Dumbbell Bicep Curls" },
    female: { id: "sYV-ki-1blM", title: "How To Do A Bicep Curl | The Right Way | Well+Good" },
  },
  "overhead-triceps": {
    male: { id: "-Vyt2QdsR7E", title: "How To: Standing Overhead Dumbbell Tricep Extension" },
    female: { id: "YM8iX9BJWjA", title: "Dumbbell Overhead Triceps Extension" },
  },
  "db-thruster": {
    male: { id: "He4-ttcwthg", title: "Dumbbell Thrusters" },
    female: { id: "0RJXwEZmcCg", title: "Dumbbell Thruster (Squat and Press) | Exercise Tutorial" },
  },
  "band-pull-apart": {
    male: { id: "kZDAZFxA3-c", title: "How To Do Band Pull-Aparts THE RIGHT WAY!!" },
    female: { id: "bYsgk9SrJ48", title: "How to Do Band Pull Aparts: A Guide from Physical Therapists" },
  },
  "band-row": {
    male: { id: "jix2wqu2MfE", title: "Banded Seated Rows" },
    female: { id: "eOKwM5nHzj4", title: "Resistance Band Seated Row Tutorial" },
  },
  "band-face-pull": {
    male: { id: "hbo-nSIEmXo", title: "Banded Face Pull" },
    female: { id: "uX5W2kynMIo", title: "Face Pulls with a Resistance Band" },
  },
  "band-kickback": {
    female: { id: "TI5djGHdBWA", title: "Banded Glute Kickback" },
  },
  "band-good-morning": {
    male: { id: "S1S3JHNmEAA", title: "Band Good Morning: How To (3 steps to proper form)" },
    female: { id: "CTRaCzE8pWU", title: "Banded Good Morning" },
  },
  "pull-up": {
    male: { id: "eGo4IYlbE5g", title: "The Perfect Pull Up  - Do it right!" },
    female: { id: "6zyx46Vpato", title: "How To Get Your First Pull Up (Beginner Tutorial)" },
  },
  "chin-up": {
    male: { id: "Ln3gAdHr8MM", title: "5 Tips for the Perfect Chin-Up" },
    female: { id: "6ufdsrqNYOQ", title: "Women: How To Do Chin Ups" },
  },
  "negative-pull-up": {
    male: { id: "R8xNrImzdwI", title: "How To Do a Negative Pull-Up | Exercise Guide" },
    female: { id: "gbPURTSxQLY", title: "How To Do a Negative Pull-Up | Exercise Guide" },
  },
  "dead-hang": {
    male: { id: "5FQJJvUAYx4", title: "How To: Dead Hang Exercise" },
    female: { id: "Z6gFs5mXIZM", title: "7 PAINFUL Dead Hang Mistakes You Need to AVOID" },
  },
  "kb-swing": {
    male: { id: "hp3qVqIHNOI", title: "How To Do Kettlebell Swings | Proper Form To Avoid Pain And Injury" },
    female: { id: "sSESeQAir2M", title: "How To Do A Kettlebell Swing | The Right Way | Well+Good" },
  },
  "turkish-get-up": {
    male: { id: "0cJMf_qKTh4", title: "Master the Turkish Get Up in 5 Minutes! 🤩" },
    female: { id: "JFrItinMcyQ", title: "Turkish Get-Up: 2-Minute Complete Tutorial" },
  },
  "bench-dip": {
    male: { id: "c3ZGl4pAwZ4", title: "How To: Bench Dip" },
    female: { id: "IExSaQUjyIw", title: "Bench Triceps Dips" },
  },
  "hanging-knee-raise": {
    male: { id: "p9hhX_Sx5v0", title: "The Hanging Knee Raise | A Tutorial" },
    female: { id: "iC_fu-XjNPo", title: "Hanging Knee Raise" },
  },
  "copenhagen-plank": {
    male: { id: "1NNqUQvMYGc", title: "Copenhagen Plank Progressions" },
    female: { id: "HOmsC6HEiFU", title: "Copenhagen Plank" },
  },
  "mountain-climber": {
    male: { id: "De3Gl-nC7IQ", title: "How to do Mountain Climbers Exercise the RIGHT way." },
    female: { id: "cnyTQDSE884", title: "How to Do Mountain Climbers | The Right Way | Well+Good" },
  },
  "tuck-jump": {
    male: { id: "hEoEgy08RzI", title: "How To Do A FAST FEET TUCK JUMP | Exercise Demonstration Video and Guide" },
    female: { id: "mgBCOVR1hqw", title: "Tuck Jumps" },
  },
  "single-leg-hop": {
    male: { id: "7WgzHOQGgYw", title: "Single Leg Hops | Exercise Tutorial" },
  },
  "lateral-bound": {
    male: { id: "niEGdFUQ6sY", title: "How to Lateral Bound" },
    female: { id: "9lRCe2KNuTk", title: "Lateral Bounds" },
  },
  "tree-pose": {
    male: { id: "uELr6MPi7pI", title: "Learn the Tree Pose - Vrikshasana | Yoga" },
    female: { id: "wdln9qWYloU", title: "How to Do a Tree Pose (Vrksasana) | Yoga" },
  },
  "triangle-pose": {
    female: { id: "_1124fj0BeQ", title: "How To Do Triangle Pose | The Right Way | Well+Good" },
  },
  "dr-bridge": {
    female: { id: "Z-HldsJwzPI", title: "Exercise for Postpartum Diastasis Recti - Glute Bridge" },
  },
  "dr-side-plank-knees": {
    female: { id: "7WwMNfpnGfk", title: "How to: Modified Side Plank - Pregnancy/Postpartum Modification" },
  },
  "dr-bird-dog": {
    female: { id: "lmexQ78YEJc", title: "Diastasis Recti Challenge-Bird Dogs" },
  },
  "dr-quadruped-breath": {
    female: { id: "NZNwQ7t9l7g", title: "6 Mistakes Causing Diastasis Recti During Pregnancy! (HOW TO PREVENT DIASTASIS RECTI)" },
  },
  "dr-bent-knee-fallout": {
    female: { id: "TfqK1c1eH5M", title: "Knee fallouts" },
  },
  "dr-supine-march": {
    female: { id: "Z5pZaG8XKi0", title: "Marching exercise for diastasis recti" },
  },
  "dr-wall-push-up": {
    female: { id: "fMpSsNYi-ws", title: "DIASTASIS RECTI FRIENDLY WALL PUSHUP - Beginners, Prenatal, Recovering Postpartum" },
  },
  "dr-kegel": {
    female: { id: "2RoO9jKvvTA", title: "How to Kegel Postpartum & Strengthen your Pelvic Floor | 2 Simple PHYSIO STEPS" },
  },
  "dr-side-lying-leg-lift": {
    female: { id: "pNismoYr1Fg", title: "Pelvic health education Side lying leg lift" },
  },
};
