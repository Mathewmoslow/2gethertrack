import json

chapters = [
    {
        "chapter": 1,
        "title": "Role and Scope",
        "caseStudy": "Sarah is a new personal trainer working at a large health club. She is approached by a client who has recently been diagnosed with hypertension and is taking medication. Sarah wants to ensure she stays within her professional boundaries while helping the client achieve their weight loss goals."
    },
    {
        "chapter": 2,
        "title": "ACE IFT Model",
        "caseStudy": "James is a 40-year-old sedentary male who wants to start an exercise program to improve his health and lose weight. He has no known health issues but has not exercised in over a decade. The trainer needs to apply the ACE Integrated Fitness Training (IFT) Model to design a safe and effective program."
    },
    {
        "chapter": 3,
        "title": "Behavior Change",
        "caseStudy": "Linda has been contemplating starting an exercise routine for several months. She understands the benefits but is struggling with self-efficacy and finding time in her busy schedule. A trainer is working with her to identify barriers and build a sustainable habit using behavioral change strategies."
    },
    {
        "chapter": 4,
        "title": "Communication & Teaching",
        "caseStudy": "A trainer is working with a group of diverse clients in a small group training session. The trainer needs to effectively communicate instructions, provide feedback, and adapt their teaching style to accommodate different learning preferences (visual, auditory, kinesthetic)."
    },
    {
        "chapter": 5,
        "title": "Health Screening",
        "caseStudy": "Mark, a 52-year-old male, wants to begin high-intensity interval training. He smokes occasionally and has a family history of heart disease. The trainer must conduct a thorough health screening to determine if medical clearance is necessary and to identify potential risks."
    },
    {
        "chapter": 6,
        "title": "Nutrition",
        "caseStudy": "Emily is a marathon runner who wants to optimize her performance through nutrition. She is looking for guidance on macronutrient distribution, hydration strategies, and the role of supplements in her training regimen while staying within the trainer's scope of practice."
    }
]

# I will use a subagent to generate the questions for these chapters.
