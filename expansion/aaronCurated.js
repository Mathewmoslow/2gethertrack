// Aaron's curated exercise programming data.
// Ported from the original travel-workout-app (React) so the trainer's hand-tuned
// defaults (sets, reps, weight, RPE, cues, description) are preserved even though
// we shifted to the broader megaDB for exercise variety.
//
// Usage: when an exercise from EXERCISE_DB matches one of these by name (case-insensitive),
// the canvas pre-fills with Aaron's defaults and surfaces his coaching cues.

export const AARON_CURATED = [
    // ---------- shoulders ----------
    { name: "Kettlebell halo + shoulder press", bodyPart: "shoulders", equipment: ["kettlebells"], defaultSets: "3", defaultReps: "8-10", defaultWeight: "15-25 lbs", defaultRPE: "7", description: "Dynamic shoulder mobility and strength exercise", cues: "Control the halo motion, press overhead with locked out arms" },
    { name: "Arnold press", bodyPart: "shoulders", equipment: ["dumbbells"], defaultSets: "3", defaultReps: "10-12", defaultWeight: "15-20 lbs", defaultRPE: "7", description: "Multi-plane shoulder press with rotation", cues: "Start palms facing you, rotate as you press, control the descent" },
    { name: "Alternating dumbbell shoulder press", bodyPart: "shoulders", equipment: ["dumbbells"], defaultSets: "3", defaultReps: "8 each", defaultWeight: "20-25 lbs", defaultRPE: "7", description: "Unilateral shoulder press for core stability", cues: "Keep core tight, full lockout overhead, control the tempo" },
    { name: "Leaning lateral raise", bodyPart: "shoulders", equipment: ["dumbbells"], defaultSets: "3", defaultReps: "12-15", defaultWeight: "10-15 lbs", defaultRPE: "8", description: "Lateral deltoid isolation with gravity assistance", cues: "Lean away, raise to shoulder height, control the negative" },
    { name: "Machine seated shoulder press", bodyPart: "shoulders", equipment: ["specialized machines"], defaultSets: "3", defaultReps: "10-12", defaultWeight: "Adjust to feel", defaultRPE: "7", description: "Supported overhead pressing movement", cues: "Full range of motion, don't lock elbows aggressively" },
    { name: "Bent over rear delt fly", bodyPart: "shoulders", equipment: ["dumbbells"], defaultSets: "3", defaultReps: "12-15", defaultWeight: "8-12 lbs", defaultRPE: "7", description: "Posterior deltoid strengthening", cues: "Hinge at hips, slight bend in elbows, squeeze shoulder blades" },

    // ---------- chest ----------
    { name: "Dumbbell bench press", bodyPart: "chest", equipment: ["dumbbells", "bench"], defaultSets: "3", defaultReps: "8-10", defaultWeight: "25-35 lbs", defaultRPE: "7", description: "Primary chest pressing movement", cues: "Retract shoulder blades, control descent, drive through chest" },
    { name: "Machine seated chest press", bodyPart: "chest", equipment: ["specialized machines"], defaultSets: "3", defaultReps: "10-12", defaultWeight: "Adjust to feel", defaultRPE: "7", description: "Supported chest pressing", cues: "Keep shoulder blades back, don't lock elbows hard" },
    { name: "Dumbbell fly", bodyPart: "chest", equipment: ["dumbbells", "bench"], defaultSets: "3", defaultReps: "10-12", defaultWeight: "15-20 lbs", defaultRPE: "7", description: "Chest isolation with stretch", cues: "Slight elbow bend, feel stretch at bottom, squeeze at top" },
    { name: "Cable fly", bodyPart: "chest", equipment: ["cable system"], defaultSets: "3", defaultReps: "12-15", defaultWeight: "Light-moderate", defaultRPE: "7", description: "Constant tension chest isolation", cues: "Control the cables, focus on chest squeeze" },
    { name: "Incline push up", bodyPart: "chest", equipment: ["bodyweight", "bench"], defaultSets: "3", defaultReps: "8-12", defaultWeight: "Bodyweight", defaultRPE: "6", description: "Modified push-up for building strength", cues: "Hands on bench, straight body line, full range" },
    { name: "Push up", bodyPart: "chest", equipment: ["bodyweight"], defaultSets: "3", defaultReps: "8-15", defaultWeight: "Bodyweight", defaultRPE: "7", description: "Classic bodyweight chest exercise", cues: "Straight plank, elbows 45 degrees, chest to floor" },

    // ---------- triceps ----------
    { name: "Bench dip", bodyPart: "triceps", equipment: ["bench", "bodyweight"], defaultSets: "3", defaultReps: "8-12", defaultWeight: "Bodyweight", defaultRPE: "7", description: "Bodyweight triceps exercise", cues: "Keep close to bench, full range, control the descent" },
    { name: "Triceps kickback", bodyPart: "triceps", equipment: ["dumbbells"], defaultSets: "3", defaultReps: "10-12", defaultWeight: "8-15 lbs", defaultRPE: "7", description: "Isolation triceps movement", cues: "Keep upper arm still, full extension, squeeze at top" },
    { name: "Cable triceps pushdown", bodyPart: "triceps", equipment: ["cable system"], defaultSets: "3", defaultReps: "12-15", defaultWeight: "Moderate", defaultRPE: "7", description: "Cable triceps isolation", cues: "Keep elbows tucked, full extension, control the return" },
    { name: "Overhead dumbbell triceps extension", bodyPart: "triceps", equipment: ["dumbbells"], defaultSets: "3", defaultReps: "10-12", defaultWeight: "15-25 lbs", defaultRPE: "7", description: "Overhead triceps stretch and strength", cues: "Keep elbows pointing forward, control the weight" },
    { name: "Skull crusher", bodyPart: "triceps", equipment: ["dumbbells", "barbell", "bench"], defaultSets: "3", defaultReps: "8-12", defaultWeight: "Moderate", defaultRPE: "7", description: "Lying triceps extension", cues: "Keep elbows stable, lower to forehead, full extension" },

    // ---------- biceps ----------
    { name: "21s", bodyPart: "biceps", equipment: ["dumbbells", "barbell", "cable system"], defaultSets: "1", defaultReps: "21 total", defaultWeight: "Light-moderate", defaultRPE: "8", description: "High volume biceps technique", cues: "7 bottom half, 7 top half, 7 full range" },
    { name: "Zottman curl", bodyPart: "biceps", equipment: ["dumbbells"], defaultSets: "3", defaultReps: "10-12", defaultWeight: "15-20 lbs", defaultRPE: "7", description: "Biceps and forearm combination", cues: "Curl up normal, rotate and lower slowly" },
    { name: "Hammer curl", bodyPart: "biceps", equipment: ["dumbbells"], defaultSets: "3", defaultReps: "10-12", defaultWeight: "20-25 lbs", defaultRPE: "7", description: "Neutral grip biceps exercise", cues: "Keep wrists straight, controlled movement" },
    { name: "Reverse biceps curl", bodyPart: "biceps", equipment: ["dumbbells", "barbell"], defaultSets: "3", defaultReps: "12-15", defaultWeight: "Light", defaultRPE: "7", description: "Overhand grip biceps and forearms", cues: "Keep wrists strong, control the weight" },
    { name: "Biceps curl", bodyPart: "biceps", equipment: ["dumbbells", "barbell", "cable system"], defaultSets: "3", defaultReps: "10-12", defaultWeight: "20-30 lbs", defaultRPE: "7", description: "Classic biceps exercise", cues: "Keep elbows still, full range of motion" },

    // ---------- core ----------
    { name: "Marching farmers carry", bodyPart: "core", equipment: ["dumbbells", "kettlebells"], defaultSets: "3", defaultReps: "20 steps each", defaultWeight: "Moderate", defaultRPE: "7", description: "Core stability with carrying", cues: "Stay tall, march in place, tight core" },
    { name: "Russian twist", bodyPart: "core", equipment: ["bodyweight", "dumbbells"], defaultSets: "3", defaultReps: "15 each side", defaultWeight: "Light weight", defaultRPE: "7", description: "Rotational core exercise", cues: "Keep feet up, rotate from core, control the movement" },
    { name: "Situp and reach", bodyPart: "core", equipment: ["bodyweight", "dumbbells"], defaultSets: "3", defaultReps: "12-15", defaultWeight: "Light weight", defaultRPE: "7", description: "Dynamic core movement", cues: "Reach overhead at top, control down" },
    { name: "Pallof press", bodyPart: "core", equipment: ["cable system", "resistance bands"], defaultSets: "3", defaultReps: "10 each side", defaultWeight: "Moderate", defaultRPE: "7", description: "Anti-rotation core exercise", cues: "Press out and hold, resist rotation" },
    { name: "Cable twist", bodyPart: "core", equipment: ["cable system"], defaultSets: "3", defaultReps: "12 each side", defaultWeight: "Moderate", defaultRPE: "7", description: "Rotational core with resistance", cues: "Keep hips square, rotate from core" },
    { name: "Leg raise", bodyPart: "core", equipment: ["bodyweight"], defaultSets: "3", defaultReps: "10-15", defaultWeight: "Bodyweight", defaultRPE: "7", description: "Lower abdominal exercise", cues: "Control the descent, don't swing legs" },

    // ---------- glutes ----------
    { name: "Fire hydrant", bodyPart: "glutes", equipment: ["bodyweight"], defaultSets: "3", defaultReps: "12 each side", defaultWeight: "Bodyweight", defaultRPE: "6", description: "Glute activation exercise", cues: "Keep hips square, lift from glutes" },
    { name: "Glute bridge", bodyPart: "glutes", equipment: ["bodyweight"], defaultSets: "3", defaultReps: "15-20", defaultWeight: "Bodyweight", defaultRPE: "6", description: "Basic glute strengthening", cues: "Drive through heels, squeeze at top" },
    { name: "Heels-elevated bridge", bodyPart: "glutes", equipment: ["bodyweight", "bench"], defaultSets: "3", defaultReps: "12-15", defaultWeight: "Bodyweight", defaultRPE: "7", description: "Elevated glute bridge variation", cues: "Heels on bench, drive up, squeeze glutes" },
    { name: "Glute bridge march", bodyPart: "glutes", equipment: ["bodyweight"], defaultSets: "3", defaultReps: "10 each leg", defaultWeight: "Bodyweight", defaultRPE: "7", description: "Single leg glute challenge", cues: "Hold bridge, march slowly, stay level" },

    // ---------- quads ----------
    { name: "Goblet squat", bodyPart: "quads", equipment: ["dumbbells", "kettlebells"], defaultSets: "3", defaultReps: "12-15", defaultWeight: "25-35 lbs", defaultRPE: "7", description: "Front-loaded squat pattern", cues: "Hold weight at chest, squat deep, drive up" },
    { name: "Step-through lunge", bodyPart: "quads", equipment: ["bodyweight"], defaultSets: "3", defaultReps: "10 each leg", defaultWeight: "Bodyweight", defaultRPE: "6", description: "Dynamic lunge pattern", cues: "Step forward and back, control the movement" },
    { name: "Walking lunge", bodyPart: "quads", equipment: ["bodyweight", "dumbbells"], defaultSets: "3", defaultReps: "12 each leg", defaultWeight: "Light weight", defaultRPE: "7", description: "Forward moving lunge", cues: "Long steps, knee tracking, stay tall" },
    { name: "Reverse Nordic curl", bodyPart: "quads", equipment: ["bodyweight"], defaultSets: "3", defaultReps: "5-8", defaultWeight: "Bodyweight", defaultRPE: "8", description: "Advanced quad strengthening", cues: "Control the descent, use hands if needed" },
    { name: "Cyclist squat", bodyPart: "quads", equipment: ["bodyweight", "dumbbells"], defaultSets: "3", defaultReps: "12-15", defaultWeight: "Light weight", defaultRPE: "7", description: "Heels elevated squat", cues: "Heels up, deep squat, drive through toes" },

    // ---------- hamstrings ----------
    { name: "RDL", bodyPart: "hamstrings", equipment: ["dumbbells", "barbell", "kettlebells"], defaultSets: "3", defaultReps: "10-12", defaultWeight: "Moderate", defaultRPE: "7", description: "Hip hinge hamstring exercise", cues: "Hinge at hips, keep knees soft, feel stretch" },
    { name: "Staggered RDL", bodyPart: "hamstrings", equipment: ["dumbbells", "barbell", "kettlebells"], defaultSets: "3", defaultReps: "8 each leg", defaultWeight: "Light-moderate", defaultRPE: "7", description: "Single leg RDL variation", cues: "One foot back, hinge forward, balance" },
    { name: "Hamstring walkout", bodyPart: "hamstrings", equipment: ["bodyweight"], defaultSets: "3", defaultReps: "8-12", defaultWeight: "Bodyweight", defaultRPE: "8", description: "Bodyweight hamstring exercise", cues: "Walk feet out and back, keep hips up" },
    { name: "Hamstring rollout", bodyPart: "hamstrings", equipment: ["stability ball"], defaultSets: "3", defaultReps: "10-15", defaultWeight: "Bodyweight", defaultRPE: "7", description: "Ball hamstring curl", cues: "Heels on ball, roll in and out, squeeze glutes" },

    // ---------- back ----------
    { name: "Single arm bench supported back row", bodyPart: "back", equipment: ["dumbbells", "bench"], defaultSets: "3", defaultReps: "10 each arm", defaultWeight: "25-35 lbs", defaultRPE: "7", description: "Supported rowing movement", cues: "Pull to ribs, squeeze shoulder blade, control descent" },
    { name: "Lat pulldown", bodyPart: "back", equipment: ["cable system", "specialized machines"], defaultSets: "3", defaultReps: "10-12", defaultWeight: "Moderate", defaultRPE: "7", description: "Vertical pulling exercise", cues: "Pull to chest, lean back slightly, squeeze lats" },
    { name: "Lat pullover", bodyPart: "back", equipment: ["dumbbells", "cable system"], defaultSets: "3", defaultReps: "12-15", defaultWeight: "Light-moderate", defaultRPE: "7", description: "Lat isolation exercise", cues: "Keep slight arm bend, feel lat stretch" },
    { name: "Seated row", bodyPart: "back", equipment: ["cable system", "resistance bands"], defaultSets: "3", defaultReps: "12-15", defaultWeight: "Moderate", defaultRPE: "7", description: "Horizontal pulling exercise", cues: "Pull to stomach, squeeze shoulder blades" },
    { name: "Machine seated row", bodyPart: "back", equipment: ["specialized machines"], defaultSets: "3", defaultReps: "10-12", defaultWeight: "Adjust to feel", defaultRPE: "7", description: "Supported horizontal pull", cues: "Keep chest up, pull elbows back" },
    { name: "Superman", bodyPart: "back", equipment: ["bodyweight"], defaultSets: "3", defaultReps: "12-15", defaultWeight: "Bodyweight", defaultRPE: "6", description: "Posterior chain exercise", cues: "Lift chest and legs, hold briefly, control down" },

    // ---------- accessories ----------
    { name: "Shrugs", bodyPart: "accessories", equipment: ["dumbbells", "barbell", "kettlebells"], defaultSets: "3", defaultReps: "15-20", defaultWeight: "Moderate", defaultRPE: "6", description: "Trap strengthening", cues: "Lift shoulders up, hold briefly, control down" },
    { name: "Behind the back wrist curl", bodyPart: "accessories", equipment: ["barbell", "dumbbells"], defaultSets: "3", defaultReps: "15-20", defaultWeight: "Light", defaultRPE: "6", description: "Forearm strengthening", cues: "Curl wrists up, control the movement" },
    { name: "Calf raise", bodyPart: "accessories", equipment: ["bodyweight", "dumbbells", "specialized machines"], defaultSets: "3", defaultReps: "15-20", defaultWeight: "Light-moderate", defaultRPE: "6", description: "Calf strengthening", cues: "Rise up on toes, hold briefly, control down" },

    // ---------- cardio / conditioning ----------
    { name: "Steady state ride", bodyPart: "cardio", equipment: ["bike"], defaultSets: "1", defaultReps: "20-30 min", defaultWeight: "N/A", defaultRPE: "5-6", description: "Moderate intensity cycling", cues: "Keep steady pace, focus on breathing rhythm" },
    { name: "Interval sprints", bodyPart: "cardio", equipment: ["bike"], defaultSets: "8-10", defaultReps: "30 sec on/30 sec off", defaultWeight: "N/A", defaultRPE: "8-9", description: "High intensity bike intervals", cues: "All-out effort during work periods, easy recovery" },
    { name: "Steady state run/walk", bodyPart: "cardio", equipment: ["treadmill"], defaultSets: "1", defaultReps: "20-40 min", defaultWeight: "N/A", defaultRPE: "5-6", description: "Continuous cardio movement", cues: "Find sustainable pace, land midfoot" },
    { name: "Interval training", bodyPart: "cardio", equipment: ["treadmill"], defaultSets: "6-8", defaultReps: "1 min on/1 min off", defaultWeight: "N/A", defaultRPE: "7-8", description: "Alternating high/low intensity", cues: "Push hard during work, recover fully between" },
    { name: "Steady state row", bodyPart: "cardio", equipment: ["rower"], defaultSets: "1", defaultReps: "15-25 min", defaultWeight: "N/A", defaultRPE: "6", description: "Continuous rowing for endurance", cues: "Drive with legs, finish with arms, smooth rhythm" },
    { name: "500m intervals", bodyPart: "cardio", equipment: ["rower"], defaultSets: "4-6", defaultReps: "500m", defaultWeight: "N/A", defaultRPE: "8", description: "Short distance rowing intervals", cues: "Maximum effort, focus on power per stroke" },
    { name: "Basic bounce", bodyPart: "cardio", equipment: ["jump rope"], defaultSets: "3-5", defaultReps: "1-2 min", defaultWeight: "N/A", defaultRPE: "6-7", description: "Basic jump rope technique", cues: "Light on feet, small jumps, wrists do the work" },
    { name: "HIIT circuit", bodyPart: "cardio", equipment: ["bodyweight"], defaultSets: "3-4", defaultReps: "30 sec each", defaultWeight: "Bodyweight", defaultRPE: "8", description: "High intensity bodyweight circuit", cues: "Maximum effort, good form over speed" },
    { name: "Stair climbing", bodyPart: "cardio", equipment: ["stairs"], defaultSets: "1", defaultReps: "10-20 min", defaultWeight: "N/A", defaultRPE: "6-7", description: "Continuous stair climbing", cues: "Use handrail for balance only, full foot on step" },
    { name: "Walking/hiking", bodyPart: "cardio", equipment: ["walking/hiking"], defaultSets: "1", defaultReps: "30-60 min", defaultWeight: "N/A", defaultRPE: "4-6", description: "Low impact endurance activity", cues: "Maintain good posture, swing arms naturally" }
];

// Fast lookup by lowercased name.
export const CURATED_BY_NAME = AARON_CURATED.reduce((acc, ex) => {
    acc[ex.name.toLowerCase()] = ex;
    return acc;
}, {});

// Resolve curated defaults for a megaDB exercise by title. Returns null if no match.
export function getCuratedFor(title) {
    if (!title) return null;
    return CURATED_BY_NAME[title.toLowerCase()] || null;
}
