import express from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Type } from '@google/genai';
import { db } from '../../db/index.ts';
import { lessonPlans, syllabusDocuments } from '../../db/schema.ts';
import { eq, desc, and, sql } from 'drizzle-orm';
import { requireAuth, requireAdmin } from '../../middleware/auth.ts';
import { getGeminiClient, generateGeminiContentWithRetry, retryWithFallback } from '../geminiService.js';
import { deleteFileFromCloud, upload } from '../storageService.js';

  function getFallbackLessonPackage(topic: string, gradeLevel: string, subject: string, syllabusText?: string) {
    const actualTopic = topic || 'Introduction to Building Foundations & Excavation Safety';
    const actualGrade = gradeLevel || 'Form Four Building Construction (F4BA)';
    const actualSubject = subject || 'Building Construction';
    
    let syllabusSection = '';
    if (syllabusText) {
      syllabusSection = `\n\n### SYLLABUS CORRELATION & FOCUS\n* **Extracted Syllabus Guidelines / Objectives:**\n${syllabusText.substring(0, 1500)}${syllabusText.length > 1500 ? '... [Content Truncated]' : ''}\n\n---\n`;
    }

    const contentMarkdown = `# Cameroon Ministry of Secondary Education (MINESEC)
## Department of Civil Engineering & Building Construction
### Competency-Based Approach (CBA) Lesson Package

---

### PART 1 - LESSON INFORMATION
* **School Name:** Government Technical High School (GTHS) Yaounde / Douala
* **Academic Year:** 2026/2027
* **Term / Sequence / Week:** Term 1 | Sequence 1 | Week 2
* **Subject / Specialization:** ${actualSubject} | Building Construction (F4BA)
* **Grade / Class:** ${actualGrade}
* **Topic:** ${actualTopic}
* **Duration:** 2 Periods (100 Minutes)
* **Teacher:** Senior Curriculum Specialist (AI Assistant)${syllabusSection}

---

### PART 2 - CURRICULUM ALIGNMENT
* **Competency:** Mastery of foundation types, excavating protocols, and workshop health and safety.
* **Expected Learning Outcomes:** Learners will identify strip, pad, and raft foundations, select proper excavation tools, and apply personal protective equipment (PPE) correctly.
* **SDGs Aligned:** Goal 9: Industry, Innovation, and Infrastructure & Goal 8: Decent Work and Economic Growth.

---

### PART 3 - LEARNING OBJECTIVES
By the end of this lesson, learners will be able to:
1. Define a "foundation" in building construction and explain its primary load-bearing purpose.
2. Differentiate between Strip Foundations and Pad Foundations with clear hand-drawn structural sketches.
3. List 5 vital Personal Protective Equipment (PPE) items required on a Cameroonian construction site.
4. Calculate the volume of soil excavation required for a pad foundation footprint of 1.2m x 1.2m x 1.0m.
5. Create a simple site checklist for timbering and timber-shoring support in deep soil excavations.

---

### PART 4 - KEY VOCABULARY
| Term | Definition | Practical Example |
| :--- | :--- | :--- |
| **Foundation** | The lower structural part of a building that transmits loads safely to the soil. | A reinforced concrete pad under a structural pillar. |
| **Excavation** | The removal of earth to prepare the ground for foundation footings. | Digging a trench 1 meter deep for a strip footing. |
| **Shoring (Timbering)** | Temporary timber supports to prevent the collapse of vertical excavation walls. | Placing timber boards against loose sand walls during trenching. |

---

### PART 5 - REQUIRED MATERIALS
* **Teacher Resources:** Standard CBA curriculum guides, foundation models, chalk, whiteboard markers.
* **Student Resources:** Textbooks, technical drawing instruments, notebooks.
* **Workshop Equipment & Construction Tools:** Shovels, pickaxes, spirit levels, wheelbarrows, measuring tapes.
* **PPE (Safety Equipment):** Hard hats, safety boots, high-visibility vests, hand gloves.

---

### PART 6 - LESSON INTRODUCTION (Hook)
**Activity (5-10 Minutes):** Show the class a photo of a collapsed foundation wall or a local structural failure in Yaounde or Douala caused by poor soil testing and lack of foundations.
* **Teacher Script:** *"Class, look at this residential building that collapsed. What went wrong? Why do some buildings stand for 100 years, while others sink into the wet clay soil of Wouri?"*
* **Expected Student Response:** *"Sir, the ground was too soft!"* or *"The concrete foundation was too weak or missing!"*

---

### PART 7 - DIRECT INSTRUCTION
#### Stage 1: Purpose of Foundations (20 Mins)
A foundation must distribute the dead load (self-weight) and live load (occupants, wind) over a large area to prevent soil shear failure and settlement.
* **Safety First:** Excavations deeper than 1.5 meters must be shored (timbered) to prevent burial accidents under collapsing soil walls.
* **Common Misconception:** *"Concrete foundations are only needed for multi-story structures."* Correction: All permanent block structures, including single-room classrooms, need a strip or pad footing to prevent water infiltration and cracks.

#### Stage 2: Strip vs. Pad Footings (25 Mins)
* **Strip Foundation:** A continuous strip of concrete under load-bearing masonry walls.
* **Pad Foundation:** Isolated square or rectangular concrete blocks under structural columns.

---

### PART 8 - GUIDED PRACTICE
The teacher divides the class into groups of 5 in the school workshop or yard. Each group is given a tape measure and peg lines to set out a 1.2m x 1.2m pad foundation footprint.
* **Teacher Prompt:** *"Ensure your diagonals are perfectly equal! Use the 3:4:5 rule for a perfect 90-degree corner."*

---

### PART 9 - INDEPENDENT PRACTICE
**Individual Task (20 Mins):** Calculate the total excavation volume for a row of 6 column pads, each measuring 1.5m length, 1.5m width, and 1.2m depth.
* **Marking Criteria:**
  - Correct formula: Volume = L x W x D (2 Marks)
  - Calculation: 1.5 x 1.5 x 1.2 = 2.7 cubic meters per pad (2 Marks)
  - Total Volume: 2.7 x 6 = 16.2 m3 (1 Mark)

---

### PART 10 - DIFFERENTIATION
* **Struggling Learners:** Paired with peers, given pre-calculated layout models.
* **Advanced Learners:** Tasked with estimating the number of bags of Portland cement required for a 1:2:4 concrete mix ratio.

---

### PART 11 - FORMATIVE ASSESSMENT
Observe student peg layout accuracy. Ask rapid-fire questions: *"What PPE protects your feet from stepping on rusty nails?"* (Expected: Safety boots with steel toes).

---

### PART 12 - EXIT TICKET
1. **Question:** Name the foundation type used for load-bearing brick walls.
   * **Answer:** Strip Foundation.
2. **Question:** Why do we place shoring in wet trenches?
   * **Answer:** To prevent the wet vertical clay or sandy soil walls from collapsing.

---

### PART 13 - HOMEWORK / PROJECT
Observe a construction site in your neighborhood. Draw a sketch of their foundation trench and note down if workers are wearing proper helmets and safety boots. Write a 100-word field report.`;

    const presentationJSON = [
      {
        "slideNumber": 1,
        "title": `${actualTopic} - Introduction`,
        "bullets": [
          "What is a building foundation?",
          "Primary load-bearing objectives",
          "Soil bearing capacity in Cameroon",
          "Understanding dead loads vs live loads"
        ],
        "speakerNotes": "Welcome everyone to Building Construction. Today we are focusing on how structures stand up and safe ground preparation.",
        "diagram": "Cross-section of load path from roof down to soil foundation",
        "discussionQuestion": "Why does a heavy truck sink in mud, while a human can walk? (Hint: Surface area!)"
      },
      {
        "slideNumber": 2,
        "title": "Strip Foundations",
        "bullets": [
          "Continuous concrete footings",
          "Placed directly under brick or block walls",
          "Ideal for standard residential structures",
          "Normal Cameroon mix ratio 1:3:6 or 1:2:4"
        ],
        "speakerNotes": "Strip foundations run continuously under walls to spread weight uniformly.",
        "diagram": "Strip foundation detailing with brick wall and concrete footing",
        "discussionQuestion": "When should we use strip instead of isolated pads?"
      },
      {
        "slideNumber": 3,
        "title": "Pad Foundations",
        "bullets": [
          "Isolated reinforced concrete pads",
          "Used under load-bearing columns/pillars",
          "Transmits heavy concentrated point loads",
          "Standard size: 1m x 1m or 1.2m x 1.2m"
        ],
        "speakerNotes": "For framed buildings where columns carry the main weight, pads are standard.",
        "diagram": "Isometric sketch of a pad footing with reinforcing steel starter bars",
        "discussionQuestion": "Why do we add steel bars in pad footings?"
      },
      {
        "slideNumber": 4,
        "title": "Excavation and Site Preparation",
        "bullets": [
          "Clearing topsoil (organic matter)",
          "Digging to firm load-bearing strata",
          "Setting out peg markers accurately",
          "Using 3-4-5 rule for square corners"
        ],
        "speakerNotes": "Site clearing is the first step. Topsoil contains grass and roots and must be removed.",
        "diagram": "Peg and string line layout layout diagram",
        "discussionQuestion": "What happens if we build directly on organic grass layer?"
      },
      {
        "slideNumber": 5,
        "title": "Trench Safety & Shoring",
        "bullets": [
          "Risk of cave-ins and collapsing soils",
          "Using timbering (shoring) in loose sand",
          "Safety access ladders every 5 meters",
          "Keeping dug soil at least 1 meter away"
        ],
        "speakerNotes": "Never work in an unsecured deep trench. Ground collapses happen instantly.",
        "diagram": "Timber shoring trench strutting detail",
        "discussionQuestion": "What type of soil collapses easiest: clay, loam, or dry sand?"
      },
      {
        "slideNumber": 6,
        "title": "Calculations of Soil Volumes",
        "bullets": [
          "Formula: Volume = Length x Width x Depth",
          "Why we calculate: Spoil removal logistics",
          "Bulking factor: Soil expands when dug!",
          "Estimating truck trips required"
        ],
        "speakerNotes": "We need to know how much dirt is coming out to pay laborers and book dump trucks.",
        "diagram": "Dimensioned cube showing L, W, D",
        "discussionQuestion": "If clay bulk factor is 30%, how much does 10 cubic meters of dug clay measure?"
      },
      {
        "slideNumber": 7,
        "title": "Concrete Mix Ratios & Curing",
        "bullets": [
          "Portland cement, sand, gravel, water",
          "Ratio 1:2:4 for reinforced structural footings",
          "Ratio 1:3:6 for unreinforced strip concrete",
          "Curing: keeping concrete wet for 7-14 days"
        ],
        "speakerNotes": "Concrete gains full strength by hydration, which requires constant moisture.",
        "diagram": "Concrete mix volumetric buckets diagram",
        "discussionQuestion": "Why does dry concrete crack and crumble?"
      },
      {
        "slideNumber": 8,
        "title": "PPE & Site Health/Safety",
        "bullets": [
          "Steel-toed boots (stepping on nails)",
          "Hard hats (falling debris / scaffold drops)",
          "High-visibility vest (heavy machine visibility)",
          "Heavy gloves (handling cement chemical burns)"
        ],
        "speakerNotes": "Safety is non-negotiable. Cement causes chemical skin burns, and sites have sharp metals.",
        "diagram": "Worker wearing full PPE kit",
        "discussionQuestion": "Which PPE is most critical when mixing dry concrete by hand?"
      },
      {
        "slideNumber": 9,
        "title": "Differentiation & Local Methods",
        "bullets": [
          "Hand-digging vs. mechanical excavators",
          "Local Cameroon stones used for blinding",
          "Adapting to high water tables in Littoral",
          "Adapting to dry rocky soils in Far North"
        ],
        "speakerNotes": "In Limbe or Douala, you reach water at 1m. In Maroua, the soil is dry and sandy.",
        "diagram": "Map of Cameroon showing soil types and foundation adaptations",
        "discussionQuestion": "How do foundations differ between Douala and Maroua?"
      },
      {
        "slideNumber": 10,
        "title": "Summary & Next Steps",
        "bullets": [
          "Foundations transmit loads safely",
          "Strip footings are linear; pad footings are isolated",
          "Excavations require safety timbering",
          "Diagonals must be checked for squareness"
        ],
        "speakerNotes": "Let's review. Next week we move to brickwork and mortar masonry.",
        "diagram": "Timeline checklist",
        "discussionQuestion": "What is the single most important safety rule on an excavation site?"
      }
    ];

    const worksheetMarkdown = `# Cameroon Technical School Student Worksheet
## Grade Level: ${actualGrade} | Subject: ${actualSubject}
### Topic: ${actualTopic}

**Name:** ___________________________  **Class:** __________  **Date:** ____________

---

### PART A: WARM-UP ACTIVITY (10 Minutes)
Look around your school building. Identify where the heavy pillars meet the ground. Can you see the concrete pads underneath? Sketch what you think is underground.

---

### PART B: GUIDED NOTES (Fill in the blanks)
1. A **foundation** is the lowest load-bearing component of a structure, designed to transmit dead and live loads safely into the ________________________.
2. **Strip foundations** run continuously under continuous ________________________ walls.
3. **Pad foundations** are isolated concrete blocks placed directly under structural ________________________.
4. Trenches deeper than **1.5 meters** require temporary wood supports called ________________________ to prevent cave-ins.

---

### PART C: PRACTICAL CALCULATION EXERCISE
An engineering project in Yaounde requires the excavation of 10 isolated column pad foundations. Each foundation excavation must be:
* Length = 1.2 meters
* Width = 1.2 meters
* Depth = 1.5 meters

**Task:**
1. Calculate the excavation volume of **one** pad footing.
   * *Formula:* Volume = L x W x D
   * *My Work:* __________________________________________________
   * *Answer:* ____________________ m3
2. Calculate the **total** excavation volume for all 10 footings.
   * *My Work:* __________________________________________________
   * *Answer:* ____________________ m3

---

### PART D: MULTIPLE-CHOICE QUESTIONS
1. Which PPE is most critical to protect you from stepping on rusty site nails?
   * A) Safety goggles
   * B) Hard hat
   * C) Steel-toed boots
   * D) High-visibility vest
2. What concrete mix ratio is standard for structural reinforced column pads?
   * A) 1:5:10
   * B) 1:2:4
   * C) 1:4:8
   * D) 1:3:6

---

### COMPLETE ANSWER KEY & TEACHER GUIDE
#### Part B Answers:
1. Soil / Earth / Ground
2. Masonry / Brick / Block
3. Columns / Pillars
4. Shoring / Timbering

#### Part C Answers:
1. Volume = 1.2m x 1.2m x 1.5m = 2.16 m3 per footing.
2. Total Volume = 2.16 m3 x 10 = 21.6 m3.

#### Part D Answers:
1. C) Steel-toed boots
2. B) 1:2:4`;

    const quizMarkdown = `# Topic Quiz & Marks Allocation
## Topic: ${actualTopic}
### Subject: ${actualSubject} | Grade Level: ${actualGrade}

**Time Allowed:** 20 Minutes  |  **Total Marks:** 20 Marks

---

### QUESTIONS

#### 1. Multiple-Choice Questions (5 Questions x 1 Mark each = 5 Marks)
1. **What is the primary structural function of a building foundation?** [1 Mark]
   - A) To prevent rain water from entering the building walls
   - B) To transmit structural dead and live loads safely to the soil
   - C) To make the building look taller and grander
   - D) To facilitate soil erosion control around the columns

2. **For standard continuous load-bearing sandcrete block walls, which foundation type is most appropriate?** [1 Mark]
   - A) Pad foundation
   - B) Pile foundation
   - C) Strip foundation
   - D) Raft foundation

3. **What is the minimum excavation depth at which structural timber shoring (timbering) becomes legally mandatory under MINESEC safety guidelines?** [1 Mark]
   - A) 0.5 meters
   - B) 1.0 meters
   - C) 1.5 meters
   - D) 3.0 meters

4. **Which concrete mix ratio is standard for pouring structural reinforced concrete foundations?** [1 Mark]
   - A) 1:2:4
   - B) 1:3:6
   - C) 1:4:8
   - D) 1:5:10

5. **In wet clay soils (like some swampy regions of Douala), what is the main hazard when digging deep foundation trenches?** [1 Mark]
   - A) Soil hardening
   - B) Trench wall cave-ins
   - C) Air pollution
   - D) Excessive dust

#### 2. Technical Short-Answer Questions (3 Questions x 2 Marks each = 6 Marks)
1. State two main physical differences between a **Strip Foundation** and a **Pad Foundation**. [2 Marks]
2. Explain the purpose of checking the diagonals of a foundation excavation footprint using the **3-4-5 rule**. [2 Marks]
3. Define the term **Blinding Layer** (blinding concrete) and explain its primary function before placing reinforcing steel bars. [2 Marks]

#### 3. Practical Scenario-Based Problem (1 Question x 9 Marks)
*Scenario:* You are the site supervisor for a new classroom block construction in Yaounde. The design requires isolated reinforced concrete columns.
1. Determine which type of foundation is needed for these columns. [2 Marks]
2. Calculate the exact soil volume to be excavated for 8 pad foundations, where each pad trench measures 1.2m x 1.2m with a depth of 1.0m. [4 Marks]
3. State three mandatory Personal Protective Equipment (PPE) items your workers must wear during this excavation phase. [3 Marks]

---

### DETAILED ANSWER KEY & CBA GRADING MATRIX

#### Part 1 (MCQ Answers)
1. **B** - Foundations transfer structural loads to the load-bearing soil strata.
2. **C** - Strip foundations run continuously under continuous blockwork.
3. **C** - 1.5 meters is the safety limit before shoring is mandatory to prevent trench wall collapse.
4. **A** - 1:2:4 (Cement : Sand : Gravel) is the standard structural concrete mix ratio.
5. **B** - Wet clay loses its cohesion, leading to high risks of sudden cave-ins.

#### Part 2 (Short-Answer Answers)
1. **Differences:** Strip foundations are continuous linear concrete trenches under masonry walls, whereas Pad foundations are isolated square/rectangular concrete blocks under structural column pillars. (2 Marks, 1 per valid point)
2. **3-4-5 Rule:** To ensure that all layout corners are perfectly square (at exactly 90 degrees), preventing skewed walls during superstructure construction. (2 Marks)
3. **Blinding Layer:** A thin layer of concrete (typically 50mm-75mm, 1:3:6 mix) poured over the excavated soil to create a clean, level working surface and prevent dirt from contaminating structural footing concrete/reinforcement. (2 Marks)

#### Part 3 (Scenario Answers)
1. **Foundation Type:** Isolated Pad Foundation. (2 Marks)
2. **Calculation:** 
   - Volume of one pad = L x W x D = 1.2m x 1.2m x 1.0m = 1.44 m3 (2 Marks)
   - Total Volume = 1.44 m3 x 8 pads = 11.52 m3 (2 Marks)
3. **PPE:** Hard hat (helmet), steel-toed safety boots, and high-visibility vest or gloves. (3 Marks, 1 Mark per item)`;

    return {
      content: contentMarkdown,
      presentation: presentationJSON,
      worksheet: worksheetMarkdown,
      quiz: quizMarkdown,
      metadata: {
        lessonId: `LES-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
        subjectId: 'SUB-CIVIL',
        teacherId: 'TCH-001',
        departmentId: 'DEPT-CONSTR',
        academicYear: '2026/2027',
        term: 'Term 1',
        sequence: 'Sequence 1',
        week: 'Week 2',
        lessonDuration: '100 Minutes',
        gradeLevel: actualGrade,
        topic: actualTopic,
        keywords: 'foundation, strip, pad, shoring, excavation, safety',
        competency: 'Foundation Types and Excavation site safety',
        learningOutcomes: 'Learners can differentiate pad/strip footings and calculate soil volumes.',
        versionNumber: '1.0.0',
        status: 'Published'
      }
    };
  }

  function getFallbackLecture(topic: string, gradeLevel: string, subject: string): string {
    const actualTopic = topic || 'Introduction to Building Foundations & Excavation Safety';
    const actualGrade = gradeLevel || 'Form Four Building Construction (F4BA)';
    const actualSubject = subject || 'Building Construction';
    
    return `# READY-TO-TEACH LECTURE: ${actualTopic}
    
## 1. LECTURE TIMELINE & PACE (Total: 90 Minutes)
* **00:00 - 00:15 (15 mins) | The Hook & Prior Knowledge Check:** Connecting excavation to daily life in Cameroon (e.g. building collapse events due to poor soil checks).
* **00:15 - 00:55 (40 mins) | Direct Instruction:** Explaining structural mechanics, soil behaviors, and foundation selection rules.
* **00:55 - 01:15 (20 mins) | Active Classroom Engagement Check:** Interactive group question-and-answer cycle with simulated site issues.
* **01:15 - 01:30 (15 mins) | Pacing Wrap-up, Safety Verification & Assignment:** Reinforcing PPE practices and concluding.

---

## 2. PEDAGOGICAL OBJECTIVES
By the end of this lecture, students will be able to:
1. Explain the primary load-bearing functions of foundations in ${actualSubject}.
2. Compare soil bearing capacities in Douala (coastal marine clays) versus Yaounde (lateritic clay-loams).
3. Demonstrate correct PPE and hazard mitigation techniques on site.

---

## 3. TEACHER SCRIPT / DIRECT INSTRUCTION

### Introduction & The Hook (15 minutes)
"Good morning, future builders and civil engineers. Welcome back to our **${actualSubject}** lecture. Today we are tackling a critical topic under the MINESEC curriculum: **${actualTopic}**. 

Before we write anything on the board, let me ask you: Have you walked down the streets of Yaounde or Douala and seen some walls with wide, diagonal cracks? Why does that happen? 
Yes, because the foundation was not adapted to the soil, or the excavation depth was insufficient! 
A building is only as safe as its base. If you construct a multi-story building in the clayey wetlands of Bonaberi in Douala without a raft foundation, it will sink. If you build on the rocky slopes of Mount Messa in Yaounde without anchoring, it will slide. Today, you will learn the exact science to prevent this!"

### Core Concept: Soil Profiles in Cameroon (20 minutes)
"Let's look at soil bearing capacity. 
* In **Douala (coastal zones)**, we have fine, sandy, marine clays. The bearing capacity is extremely low (often below 50 kN/m2). High water table means we must pump out water continuously.
* In **Yaounde (high plateau)**, we have lateritic soils. These are red clay-loams with good bearing capacity (up to 150-200 kN/m2) when dry, but they become highly slippery when wet.
* In **Maroua / Garoua (sahelian/northern zones)**, we have swell-shrink black cotton soils (vertisols). When it rains, they expand; in the dry season, they crack deeply.

*Teacher Action: Draw a vertical profile of soil on the blackboard showing topsoil, subsoil, and bedrocks.*"

### Structural Mechanics of Foundations (20 minutes)
"We have two main categories of foundations:
1. **Shallow Foundations (Fondations Superficielles):** 
   - **Strip Foundations (Semelles filantes):** Continuous strip under walls. Used for load-bearing blockwork.
   - **Pad Foundations (Semelles isolees):** Single concrete pads under reinforced concrete columns. Perfect for framed structures in solid Yaounde clays.
   - **Raft/Mat Foundations (Radiers):** A continuous reinforced concrete slab covering the entire build area. Used for soft soils like Douala wetlands to distribute loads evenly.
2. **Deep Foundations (Fondations Profondes):**
   - **Piles (Pieux):** Concrete columns driven deep down to solid bedrock (e.g. used for major ports in Kribi)."

---

## 4. CLASSROOM INTERACTIVE PARTICIPATION CHECKPOINTS

### Checkpoint 1: Soil Selection
* **Teacher:** "If you are hired to supervise a construction site in Limbe, near the volcanic coast, and you find muddy black sandy soil, which foundation would you propose for a 2-story family villa?"
* **Expected Student Answer:** "A raft foundation (radier general) or short piles, because the soil is too weak for single pad foundations and might settle unevenly."
* **Follow-up:** "Excellent! Why not strip? Because strip foundations will settle unevenly and tear the walls apart."

### Checkpoint 2: Excavation Hazard Mitigation
* **Teacher:** "You are digging a strip foundation trench 1.8 meters deep. What is the immediate safety hazard, especially during the heavy rain season in May?"
* **Expected Student Answer:** "Cave-in of the trench walls due to soil water saturation. We must use timber timbering and strutting (blindage) to support the sides."

---

## 5. COMMON STUDENT MISCONCEPTIONS
1. *Misconception:* "All concrete is the same."
   - *Clarification:* Absolutely not! Foundation concrete must be highly durable and dense, typically using **CIMENCAM or CIMAF CPA-45 (Class 42.5 or 52.5) cement** with a batching ratio of 350 kg/m3 for reinforced elements (1 bag cement, 2 wheelbarrows sand, 3 wheelbarrows gravel/concasse).
2. *Misconception:* "Water in a trench is fine; just pour concrete in."
   - *Clarification:* Water dilutes the cement-to-water ratio of the fresh concrete, destroying its compressive strength. The trench must be completely dewatered (pumped dry) or a lean concrete blinding layer (beton de proprete) poured first.

---

## 6. TEACHING TIPS & CLASSROOM PACING ADVICE
* **Tip 1:** Use local wood terms (Iroko or Bubinga) when explaining timber struts to make it instantly recognizable to students who see carpentry workshops daily.
* **Tip 2:** If students are slow to respond, ask them to imagine they are the lead Site Inspector for the Minister of Housing and Urban Development (MINDHU). This raises professional pride and engagement immediately!`;
  }

  function getFallbackQuiz(topic: string, gradeLevel: string, subject: string): string {
    const actualTopic = topic || 'Introduction to Building Foundations & Excavation Safety';
    const actualGrade = gradeLevel || 'Form Four Building Construction (F4BA)';
    const actualSubject = subject || 'Building Construction';

    return `# COMPETENCY-BASED ASSESSMENT: ${actualTopic}

**Class:** ${actualGrade}
**Discipline:** ${actualSubject} (Civil Engineering Specialty)
**Time Allowed:** 2 Hours
**Total Marks:** 20 Marks

---

## SECTION A: COMPLEX MULTIPLE-CHOICE QUESTIONS (MCQs) [5 Marks]
*Instructions: Select the single most accurate, technically sound option. Write your answer clearly.*

### Question 1 [1 Mark]
In coastal Douala regions (e.g. Akwa, Bonaberi) characterized by waterlogged sandy-clay soils, which foundation type is most technically and economically sound to prevent differential settlement for a residential villa?
- A) Standard concrete strip foundation (semelle filante)
- B) Independent pad foundations (semelles isolees) without ground beams
- C) Reinforced concrete raft foundation (radier general) [1 Mark]
- D) Direct blockwork on compacted soil
*Answer:* **C**
*Explanation:* Raft foundations act as a continuous slab that distributes structural loads evenly across a large surface area, neutralizing localized weak spots in clay/sand.

### Question 2 [1 Mark]
What is the standard cement batching ratio prescribed by Cameroon MINESEC civil engineering guidelines for reinforced concrete foundation columns and pads?
- A) 150 kg/m3 (light concrete)
- B) 350 kg/m3 using Class 42.5R cement (e.g. CIMENCAM/CIMAF) [1 Mark]
- C) 500 kg/m3 (highly rich mortar)
- D) 250 kg/m3 without gravel
*Answer:* **B**
*Explanation:* 350 kg/m3 is the structural standard for reinforced foundations, ensuring optimal compressive strength and durability against moisture.

### Question 3 [1 Mark]
During the excavation of a trench deeper than 1.5 meters in muddy Yaounde laterite, what technique MUST be used to prevent landslides and cave-ins of the trench walls?
- A) Watering the walls to keep them wet
- B) Timbering and strutting (blindage et etayage) [1 Mark]
- C) Speeding up the hand digging process
- D) Leaving the trench completely open without warning signs
*Answer:* **B**
*Explanation:* Timbering provides mechanical support to unstable trench faces, preventing collapsing forces from trapping workers.

### Question 4 [1 Mark]
What is the primary function of "Lean Concrete" (Beton de proprete) poured at the bottom of an excavated foundation trench?
- A) To carry the main weight of the columns
- B) To provide a level, clean surface and prevent soil from mixing with structural concrete [1 Mark]
- C) To act as a waterproof barrier without cement
- D) To replace reinforcement bars
*Answer:* **B**
*Explanation:* Blinding concrete prevents clean structural concrete from being contaminated with dirt, mud, and groundwater.

### Question 5 [1 Mark]
Which of the following describes a "differential settlement" hazard in civil engineering?
- A) An equal sinking of the entire building
- B) An uneven sinking of different structural supports, leading to severe diagonal shear cracks [1 Mark]
- C) The normal drying process of cement paste
- D) The process of sorting aggregates by size
*Answer:* **B**
*Explanation:* Differential settlement causes massive tension forces in blockwork, creating vertical or diagonal structural failure cracks.

---

## SECTION B: TECHNICAL SHORT-ANSWER QUESTIONS [6 Marks]

### Question 6 [2 Marks]
Explain the difference in soil bearing capacity between a dry lateritic clay soil (common in Yaounde) and a water-saturated marine clay soil (common in Douala). Mention how water saturation affects shear strength.
*Answer Key & Marks Allocation:*
- **1 Mark:** Explaining that dry lateritic soil has high bearing capacity/shear strength because cohesive particles are compact and dry, while marine clay is fine and saturated with water.
- **1 Mark:** Explaining that water acts as a lubricant between clay mineral plates, increasing pore water pressure, which dramatically reduces the soil's effective shear strength and bearing capacity.

### Question 7 [2 Marks]
Sketch and label a standard reinforced concrete **Pad Foundation (Semelle Isolee)** showing:
1. Ground Blinding Layer (Beton de proprete)
2. Column Reinforcement Starter Bars (Attentes)
3. Reinforced Concrete Base Pad
*Answer Key & Marks Allocation:*
- **1 Mark:** For correct drawing structure (pad base under column starter bars).
- **1 Mark:** For accurate labeling of all 3 mandatory components [0.33 Mark per label].

### Question 8 [2 Marks]
State two safety checks a Site Supervisor must perform before authorizing laborers to enter an open trench for foundation formwork installation.
*Answer Key & Marks Allocation:*
- **1 Mark:** Check for wall stability, presence of cracks, or signs of earth sliding.
- **1 Mark:** Verification that excavated soil piles (deblais) are stored at least 1.0 meter away from the trench edge to prevent collapse.

---

## SECTION C: PRACTICAL CBA PROBLEM-SOLVING CASE STUDY [9 Marks]

### Scenario
You are appointed as the Lead Site Superintendent for a community health center project in Bafoussam. The design calls for **12 independent concrete pad foundations**, each measuring **1.2m x 1.2m with a thickness of 0.3m**. The soil is stable clayey-silt. 

#### Task 1: Materials Calculation [4.5 Marks]
Calculate the total volume of structural concrete required to pour all 12 pads. Then, using standard Cameroon batching of **350 kg/m3** (where 1 m3 concrete requires: 7 bags of cement, 400 liters of sand, 800 liters of gravel), determine the exact quantities of:
1. Volume of concrete (m3)
2. Bags of cement (50kg bags)
3. Volume of sand required (m3)
4. Volume of gravel required (m3)

*Answer Key & Marks Allocation:*
1. **Concrete Volume calculation:** 
   - Volume of 1 pad = 1.2 x 1.2 x 0.3 = 0.432 m3 [1 Mark]
   - Total volume for 12 pads = 0.432 x 12 = 5.184 m3 [0.5 Mark]
2. **Cement bags:**
   - 5.184 m3 x 7 bags/m3 = 36.288 bags ~ 37 bags (rounded up) [1 Mark]
3. **Sand volume:**
   - 5.184 m3 x 0.4 m3 = 2.074 m3 [1 Mark]
4. **Gravel volume:**
   - 5.184 m3 x 0.8 m3 = 4.147 m3 [1 Mark]

#### Task 2: Site Layout & Safety Plan [4.5 Marks]
Explain the specific layout procedure for these pad foundations, and write down 3 critical PPE items that all excavation laborers must wear on site, explaining the structural hazard each item protects against.

*Answer Key & Marks Allocation:*
- **1.5 Marks:** Layout procedure: Establish profile boards (chaises d'implantation), run alignment lines (cordeaux) along column grids, drop plumb bob (fil a plomb) to mark center points, and trace pit borders using lime powder (chaux).
- **3.0 Marks:** 3 PPE Items & Hazards protected:
  1. **Safety Helmet (Casque):** Protects against falling stones, soil clods, or timber struts collapsing from above into the pit. [1 Mark]
  2. **Steel-Toed Boots (Chaussures de securite a coque):** Protects feet against sharp reinforcement wires, stepping on nails from formwork, or impact from heavy excavation spades. [1 Mark]
  3. **High-Visibility Vest (Gilet de haute visibilite):** Protects workers inside deep pits by making them clearly visible to excavator or wheelbarrow operators. [1 Mark]

---

## GRADING CRITERIA RUBRIC TABLE (MINESEC CBA Standard)
| Competency Criteria | Excellent (4.5 - 5 Marks) | Satisfactory (2.5 - 4 Marks) | Needs Improvement (0 - 2 Marks) |
| :--- | :--- | :--- | :--- |
| **Material Estimation (Task 1)** | Accurate mathematical calculations with perfect metric rounding of cements, sands, and gravels. | Minor mathematical slip; correct formulas used but rounding was off. | Inability to calculate volume or relate to Cameroon cement bag standards. |
| **Safety Plan (Task 2)** | Identified exact site safety procedures, grid alignments, and paired correct PPE with structural hazards. | Named PPE but lacked clear explanation of structural excavation hazards. | Listed generic terms without secondary school technical focus. |`;
  }

export function setupLessonRoutes(app: express.Express) {
  app.post('/api/lessons/upload-syllabus', upload.single('syllabusFile'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
      }

      const filePath = req.file.path;
      const originalName = req.file.originalname.toLowerCase();
      let extractedText = '';

      if (originalName.endsWith('.pdf')) {
        console.log(`[PDF Parser] Processing PDF file: ${originalName}`);
        try {
          const fileBuffer = fs.readFileSync(filePath);
          const pdfParseModule: any = await import('pdf-parse');
          const PDFParseClass = pdfParseModule.PDFParse || (pdfParseModule.default && pdfParseModule.default.PDFParse) || pdfParseModule.default;
          if (!PDFParseClass) {
            throw new Error(`PDFParse class not found in the imported module. Keys: ${Object.keys(pdfParseModule).join(', ')}`);
          }
          console.log(`[PDF Parser] Initializing PDFParse instance...`);
          const parser = new PDFParseClass({ data: fileBuffer });
          const parsed = await parser.getText();
          extractedText = parsed.text;
          console.log(`[PDF Parser] Successfully extracted ${extractedText.length} characters of text.`);
        } catch (parseError: any) {
          console.error(`[PDF Parser] Critical failure during PDF parsing of ${originalName}:`, {
            message: parseError.message,
            stack: parseError.stack,
            parser: 'pdf-parse (Mehmet Kozan TypeScript version)',
            filePath
          });
          throw new Error(`Failed to parse syllabus PDF: ${parseError.message}`);
        }
      } else if (originalName.endsWith('.docx')) {
        const fileBuffer = fs.readFileSync(filePath);
        const mammothModule = await import('mammoth');
        const result = await mammothModule.extractRawText({ buffer: fileBuffer });
        extractedText = result.value;
      } else if (originalName.endsWith('.doc')) {
        const text = fs.readFileSync(filePath, 'utf-8');
        extractedText = text.replace(/[^\x20-\x7E\n]/g, '');
      } else if (originalName.endsWith('.txt')) {
        extractedText = fs.readFileSync(filePath, 'utf-8');
      } else {
        return res.status(400).json({ error: 'Unsupported file format. Please upload PDF, Word (.docx), or TXT.' });
      }

      // Cleanup uploaded temp file safely
      try {
        fs.unlinkSync(filePath);
      } catch (unlinkErr) {
        console.error('Error unlinking temp file:', unlinkErr);
      }

      const maxChars = 20000;
      if (extractedText.length > maxChars) {
        extractedText = extractedText.substring(0, maxChars) + '\n... [Content truncated due to size limit]';
      }

      res.json({
        filename: req.file.originalname,
        text: extractedText.trim()
      });
    } catch (err: any) {
      console.error('Error parsing syllabus:', err);
      res.status(500).json({ error: `Failed to parse syllabus: ${err.message}` });
    }
  });

  // Syllabus documents database CRUD
  app.get('/api/syllabus-documents', async (req, res) => {
    try {
      let docs = await db.select().from(syllabusDocuments).orderBy(desc(syllabusDocuments.uploadedAt));
      
      // Filter dynamically
      const { search, subject, gradeLevel, academicYear, category, status } = req.query;
      
      if (search) {
        const query = String(search).toLowerCase();
        docs = docs.filter(doc => 
          (doc.filename && doc.filename.toLowerCase().includes(query)) ||
          (doc.subject && doc.subject.toLowerCase().includes(query)) ||
          (doc.keyTopics && doc.keyTopics.toLowerCase().includes(query)) ||
          (doc.learningObjectives && doc.learningObjectives.toLowerCase().includes(query))
        );
      }
      
      if (subject) {
        const query = String(subject).toLowerCase();
        docs = docs.filter(doc => doc.subject && doc.subject.toLowerCase() === query);
      }
      
      if (gradeLevel) {
        const query = String(gradeLevel).toLowerCase();
        docs = docs.filter(doc => doc.gradeLevel && doc.gradeLevel.toLowerCase() === query);
      }
      
      if (academicYear) {
        const query = String(academicYear).toLowerCase();
        docs = docs.filter(doc => doc.academicYear && doc.academicYear.toLowerCase() === query);
      }
      
      if (category) {
        const query = String(category).toLowerCase();
        docs = docs.filter(doc => doc.category && doc.category.toLowerCase() === query);
      }
      
      if (status) {
        const query = String(status).toLowerCase();
        docs = docs.filter(doc => doc.status && doc.status.toLowerCase() === query);
      }

      res.json(docs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/syllabus-documents/upload', upload.single('syllabusFile'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
      }

      const filePath = req.file.path;
      const originalName = req.file.originalname;
      const ext = path.extname(originalName).toLowerCase().replace('.', '');
      let extractedText = '';

      if (ext === 'pdf') {
        console.log(`[PDF Parser] Processing PDF file in upload: ${originalName}`);
        try {
          const fileBuffer = fs.readFileSync(filePath);
          const pdfParseModule: any = await import('pdf-parse');
          const PDFParseClass = pdfParseModule.PDFParse || (pdfParseModule.default && pdfParseModule.default.PDFParse) || pdfParseModule.default;
          if (!PDFParseClass) {
            throw new Error(`PDFParse class not found in the imported module. Keys: ${Object.keys(pdfParseModule).join(', ')}`);
          }
          console.log(`[PDF Parser] Initializing PDFParse instance...`);
          const parser = new PDFParseClass({ data: fileBuffer });
          const parsed = await parser.getText();
          extractedText = parsed.text;
          console.log(`[PDF Parser] Successfully extracted ${extractedText.length} characters of text.`);
        } catch (parseError: any) {
          console.error(`[PDF Parser] Critical failure during PDF parsing of ${originalName}:`, {
            message: parseError.message,
            stack: parseError.stack,
            parser: 'pdf-parse (Mehmet Kozan TypeScript version)',
            filePath
          });
          throw new Error(`Failed to parse syllabus PDF: ${parseError.message}`);
        }
      } else if (ext === 'docx') {
        const fileBuffer = fs.readFileSync(filePath);
        const mammothModule = await import('mammoth');
        const result = await mammothModule.extractRawText({ buffer: fileBuffer });
        extractedText = result.value;
      } else if (ext === 'doc') {
        const text = fs.readFileSync(filePath, 'utf-8');
        extractedText = text.replace(/[^\x20-\x7E\n]/g, '');
      } else if (ext === 'txt') {
        extractedText = fs.readFileSync(filePath, 'utf-8');
      } else {
        return res.status(400).json({ error: 'Unsupported file format. Please upload PDF, Word, or TXT.' });
      }

      // Cleanup uploaded temp file safely
      try {
        fs.unlinkSync(filePath);
      } catch (unlinkErr) {
        console.error('Error unlinking temp file:', unlinkErr);
      }

      const maxChars = 20000;
      const originalExtractedText = extractedText;
      if (extractedText.length > maxChars) {
        extractedText = extractedText.substring(0, maxChars) + '\n... [Content truncated due to size limit]';
      }

      // Extract metadata with Gemini AI
      let learningObjectives = '';
      let curriculumStandards = '';
      let keyTopics = '';
      let subject = req.body.subject || 'Building Construction';
      let gradeLevel = req.body.gradeLevel || 'Form Five Technical';
      let academicYear = req.body.academicYear || '2025/2026';
      let category = req.body.category || 'CIVIL_WORKS';
      let versionNumber = req.body.versionNumber || '1.0.0';

      const ai = getGeminiClient();
      if (ai) {
        try {
          const prompt = `Analyze this technical school syllabus document content. Extract the following metadata:
1. Specific Learning Objectives (overall expected outcomes, competencies)
2. Curriculum Standards / Ministry of Secondary Education (MINESEC) references
3. Key technical topics / modules covered
4. Standard subject area (e.g. Building Construction, Building Materials, Technical Drawing, soils mechanics, etc.)
5. Grade level targeted (Form One Technical, Form Two Technical, Form Three Technical, Form Four, Form Five, Lower Sixth, Upper Sixth)

Syllabus Content:
${originalExtractedText.substring(0, 10000)}

Return the extracted values as a JSON object matching this schema. Be highly descriptive and precise.`;

          const { text: aiResponseText } = await generateGeminiContentWithRetry(prompt, {
            model: "gemini-3.7-flash",
            fallbackModels: ["gemini-flash-latest", "gemini-3.1-flash-lite"],
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  learningObjectives: { type: Type.STRING },
                  curriculumStandards: { type: Type.STRING },
                  keyTopics: { type: Type.STRING },
                  subject: { type: Type.STRING },
                  gradeLevel: { type: Type.STRING }
                },
                required: ["learningObjectives", "curriculumStandards", "keyTopics", "subject", "gradeLevel"]
              }
            },
            maxRetries: 2,
            retryDelayMs: 600,
          });

          if (aiResponseText && aiResponseText.trim()) {
            const data = JSON.parse(aiResponseText.trim());
            learningObjectives = data.learningObjectives || '';
            curriculumStandards = data.curriculumStandards || '';
            keyTopics = data.keyTopics || '';
            if (!req.body.subject) subject = data.subject || 'Building Construction';
            if (!req.body.gradeLevel) gradeLevel = data.gradeLevel || 'Form Five Technical';
          }
        } catch (aiErr) {
          console.error("AI extraction error:", aiErr);
          // Fallback parsing from text lines
          const lines = originalExtractedText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
          learningObjectives = lines.slice(1, 4).join(', ').substring(0, 400) || 'Extracted from file content';
          curriculumStandards = 'MINESEC Cameroon CBA';
          keyTopics = lines.slice(4, 8).join(', ').substring(0, 400) || 'Technical subject area';
        }
      } else {
        // Fallback when no AI client is available
        const lines = originalExtractedText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        learningObjectives = lines.slice(1, 4).join(', ').substring(0, 400) || 'Extracted from file content';
        curriculumStandards = 'MINESEC Cameroon CBA';
        keyTopics = lines.slice(4, 8).join(', ').substring(0, 400) || 'Technical subject area';
      }

      const [newDoc] = await db.insert(syllabusDocuments).values({
        filename: originalName,
        fileType: ext,
        extractedText: extractedText.trim(),
        learningObjectives: learningObjectives.trim() || null,
        curriculumStandards: curriculumStandards.trim() || null,
        keyTopics: keyTopics.trim() || null,
        subject: subject.trim() || null,
        gradeLevel: gradeLevel.trim() || null,
        academicYear: academicYear.trim() || null,
        category: category.trim() || null,
        versionNumber: versionNumber.trim() || null,
        status: 'processed'
      }).returning();

      res.json(newDoc);
    } catch (err: any) {
      console.error('Error saving/parsing syllabus document:', err);
      res.status(500).json({ error: `Failed to save/parse syllabus document: ${err.message}` });
    }
  });

  // Edit metadata of a syllabus document
  app.put('/api/syllabus-documents/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID' });
      }

      const { subject, gradeLevel, academicYear, category, learningObjectives, curriculumStandards, keyTopics, status, versionNumber } = req.body;

      const updated = await db.update(syllabusDocuments)
        .set({
          subject: subject !== undefined ? subject : null,
          gradeLevel: gradeLevel !== undefined ? gradeLevel : null,
          academicYear: academicYear !== undefined ? academicYear : null,
          category: category !== undefined ? category : null,
          learningObjectives: learningObjectives !== undefined ? learningObjectives : null,
          curriculumStandards: curriculumStandards !== undefined ? curriculumStandards : null,
          keyTopics: keyTopics !== undefined ? keyTopics : null,
          status: status !== undefined ? status : null,
          versionNumber: versionNumber !== undefined ? versionNumber : null,
        })
        .where(eq(syllabusDocuments.id, id))
        .returning();

      res.json(updated[0] || { success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Replace file content of an existing syllabus document
  app.post('/api/syllabus-documents/replace/:id', upload.single('syllabusFile'), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
      }

      const filePath = req.file.path;
      const originalName = req.file.originalname;
      const ext = path.extname(originalName).toLowerCase().replace('.', '');
      let extractedText = '';

      if (ext === 'pdf') {
        console.log(`[PDF Parser] Processing PDF file in replace: ${originalName}`);
        try {
          const fileBuffer = fs.readFileSync(filePath);
          const pdfParseModule: any = await import('pdf-parse');
          const PDFParseClass = pdfParseModule.PDFParse || (pdfParseModule.default && pdfParseModule.default.PDFParse) || pdfParseModule.default;
          if (!PDFParseClass) {
            throw new Error(`PDFParse class not found in the imported module. Keys: ${Object.keys(pdfParseModule).join(', ')}`);
          }
          console.log(`[PDF Parser] Initializing PDFParse instance...`);
          const parser = new PDFParseClass({ data: fileBuffer });
          const parsed = await parser.getText();
          extractedText = parsed.text;
          console.log(`[PDF Parser] Successfully extracted ${extractedText.length} characters of text.`);
        } catch (parseError: any) {
          console.error(`[PDF Parser] Critical failure during PDF parsing of ${originalName}:`, {
            message: parseError.message,
            stack: parseError.stack,
            parser: 'pdf-parse (Mehmet Kozan TypeScript version)',
            filePath
          });
          throw new Error(`Failed to parse syllabus PDF: ${parseError.message}`);
        }
      } else if (ext === 'docx') {
        const fileBuffer = fs.readFileSync(filePath);
        const mammothModule = await import('mammoth');
        const result = await mammothModule.extractRawText({ buffer: fileBuffer });
        extractedText = result.value;
      } else if (ext === 'doc') {
        const text = fs.readFileSync(filePath, 'utf-8');
        extractedText = text.replace(/[^\x20-\x7E\n]/g, '');
      } else if (ext === 'txt') {
        extractedText = fs.readFileSync(filePath, 'utf-8');
      } else {
        return res.status(400).json({ error: 'Unsupported file format. Please upload PDF, Word, or TXT.' });
      }

      // Cleanup uploaded temp file safely
      try {
        fs.unlinkSync(filePath);
      } catch (unlinkErr) {
        console.error('Error unlinking temp file:', unlinkErr);
      }

      const maxChars = 20000;
      if (extractedText.length > maxChars) {
        extractedText = extractedText.substring(0, maxChars) + '\n... [Content truncated due to size limit]';
      }

      // Update file content, status and increment version
      const existing = await db.select().from(syllabusDocuments).where(eq(syllabusDocuments.id, id));
      let currentVersion = '1.0.0';
      if (existing && existing.length > 0) {
        const currentNum = parseFloat(existing[0].versionNumber || '1.0.0');
        currentVersion = isNaN(currentNum) ? '1.1.0' : (currentNum + 0.1).toFixed(1);
      }

      const updated = await db.update(syllabusDocuments)
        .set({
          filename: originalName,
          fileType: ext,
          extractedText: extractedText.trim(),
          versionNumber: currentVersion,
          status: 'processed'
        })
        .where(eq(syllabusDocuments.id, id))
        .returning();

      res.json(updated[0] || { success: true });
    } catch (err: any) {
      console.error('Error replacing syllabus document:', err);
      res.status(500).json({ error: `Failed to replace syllabus: ${err.message}` });
    }
  });

  // Archive a syllabus document
  app.post('/api/syllabus-documents/archive/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });
      const updated = await db.update(syllabusDocuments)
        .set({ status: 'archived' })
        .where(eq(syllabusDocuments.id, id))
        .returning();
      res.json(updated[0] || { success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Publish a syllabus document
  app.post('/api/syllabus-documents/publish/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });
      const updated = await db.update(syllabusDocuments)
        .set({ status: 'published' })
        .where(eq(syllabusDocuments.id, id))
        .returning();
      res.json(updated[0] || { success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/syllabus-documents/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID' });
      }
      const deleted = await db.delete(syllabusDocuments).where(eq(syllabusDocuments.id, id)).returning();
      res.json(deleted[0] || { success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });


}
