# Business Statement

## Problem Definition

Job seekers frequently submit resumes that fail to communicate their qualifications effectively. Without expert feedback, candidates cannot objectively evaluate their own resume's professional tone, structural clarity, or formatting quality. Professional resume review services cost between **$50–$200 per session**, creating a significant barrier for recent graduates, career changers, and individuals in lower-income brackets.

Hiring managers spend an average of **6–7 seconds** scanning a resume before deciding whether to move forward. Resumes that lack clear structure, professional language, or quantified achievements are discarded immediately — often regardless of the candidate's actual qualifications.

## Solution

**AI Resume Reviewer** is a web application that accepts resume uploads (PDF or plain text) and returns an instant, structured AI-powered evaluation. The application leverages OpenAI's GPT-4 model to assess three critical dimensions:

| Dimension     | What It Measures                                               |
|---------------|----------------------------------------------------------------|
| **Tone**      | Professional language, confidence level, industry terminology  |
| **Formatting**| Section organization, bullet point usage, logical flow         |
| **Clarity**   | Conciseness, quantified achievements, grammar, scannability    |

Each dimension is scored 1–10. The system also returns a ranked list of strengths, weaknesses, and specific, actionable improvement suggestions, along with an overall score and a detailed narrative paragraph.

All analyses are persisted in a MongoDB database, allowing users to retrieve past results and track improvement over time.

## Business Value

### Quantitative Value
- **Cost reduction:** Provides expert-grade resume feedback at near-zero marginal cost, replacing a $100–$400 service with an instant API call.
- **Time savings:** Delivers analysis in under 10 seconds, versus days of turnaround from human reviewers.
- **Scale:** A single deployment can process thousands of resumes per day without additional staffing.

### Qualitative Value
- **Equity:** Democratizes access to professional career coaching for job seekers who cannot afford human reviewers.
- **Consistency:** AI evaluation eliminates subjective variability inherent in human review.
- **Iterative improvement:** Persistent history enables candidates to compare revisions and measure progress.
- **Institutional use case:** Career centers, universities, and workforce development agencies can deploy this tool at scale to serve their entire user base simultaneously.

## Target Users

- Individual job seekers (students, recent graduates, career changers)
- University and community college career services departments
- Workforce development and reemployment programs
- HR departments offering internal career development resources
