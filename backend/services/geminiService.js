const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const parseGeminiResponse = (response) => {
  try {
    return response.text().trim();
  } catch (error) {
    console.error("Error parsing Gemini response:", error);
    return null;
  }
};

const extractJsonFromText = (text) => {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error("Failed to parse extracted JSON:", error);
  }
  return null;
};

const analyzeResumeWithGemini = async (resumeText) => {
  try {
    const prompt = `
Analyze this resume and provide a STRICTLY FORMATTED JSON response:

{
  "skills": ["Skill1", "Skill2", "Skill3", "Skill4", "Skill5"],
  "experience": "Concise summary of professional background (max 100 words)",
  "feedback": "Specific recommendations for resume improvement (max 100 words)"
}

REQUIREMENTS:
- The skills should be technical skills
- Exactly 5 top skills
- Experience summary in single paragraph
- Constructive feedback
- NO additional text outside JSON
- If no clear information, use placeholder values

Resume Text:
${resumeText}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = parseGeminiResponse(response);

    if (!responseText) {
      throw new Error("No response text from Gemini");
    }

    let parsedResponse = null;

    try {
      parsedResponse = JSON.parse(responseText);
    } catch {
      parsedResponse = extractJsonFromText(responseText);
    }

    if (!parsedResponse) {
      return {
        skills: [
          "Communication",
          "Problem Solving",
          "Teamwork",
          "Adaptability",
          "Technical Skills",
        ],
        experience:
          "Unable to extract specific experience details from the resume.",
        feedback:
          "Consider adding more specific professional achievements and using clear, concise language.",
      };
    }

    return {
      skills: parsedResponse.skills || [
        "Communication",
        "Problem Solving",
        "Teamwork",
        "Adaptability",
        "Technical Skills",
      ],
      experience:
        parsedResponse.experience ||
        "Unable to extract specific experience details from the resume.",
      feedback:
        parsedResponse.feedback ||
        "Consider adding more specific professional achievements and using clear, concise language.",
    };
  } catch (err) {
    console.error("Gemini API Error:", err);
    return {
      skills: [
        "Communication",
        "Problem Solving",
        "Teamwork",
        "Adaptability",
        "Technical Skills",
      ],
      experience: "Analysis failed due to an unexpected error.",
      feedback:
        "Unable to process resume analysis. Please review and resubmit.",
    };
  }
};

const extractSkillsFromResume = async (resumeText) => {
  try {
    const prompt = `
Extract top 10 professional skills from this resume text as a STRICT JSON array:

REQUIREMENTS:
- Exactly 10 skills or fewer
- Skills must be specific and professional
- No generic terms
- Return ONLY a JSON array of strings

Example:
["Python Programming", "Data Analysis", "Machine Learning"]

Resume Text:
${resumeText}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = parseGeminiResponse(response);

    let skills = [];

    try {
      skills = JSON.parse(responseText);
    } catch {
      const extractedSkills = extractJsonFromText(responseText);
      skills = extractedSkills || [];
    }

    if (!Array.isArray(skills)) {
      skills = responseText
        .replace(/[\[\]"]/g, "")
        .split(/[,\n]/)
        .map((skill) => skill.trim())
        .filter((skill) => skill.length > 0);
    }

    return skills.slice(0, 10).length > 0
      ? skills.slice(0, 10)
      : [
          "Communication",
          "Problem Solving",
          "Teamwork",
          "Project Management",
          "Technical Skills",
        ];
  } catch (err) {
    console.error("Gemini API Error:", err);
    return [
      "Communication",
      "Problem Solving",
      "Teamwork",
      "Project Management",
      "Technical Skills",
    ];
  }
};

const calculateATSScore = async (resumeText, jobDescription) => {
  try {
    const prompt = `
Perform a comprehensive ATS (Applicant Tracking System) analysis of the resume against the job description. 
Provide a STRICTLY FORMATTED JSON response:

{
  "atsScore": 85,
  "keywordMatch": {
    "totalKeywords": 20,
    "matchedKeywords": 15,
    "matchPercentage": 75
  },
  "strengths": ["Top 3 strengths matching job requirements"],
  "improvementAreas": ["Top 3 areas to enhance for better job fit"],
  "recommendedChanges": ["Specific resume modification suggestions"]
}

REQUIREMENTS:
- ATS Score: 0-100 scale (higher is better)
- Detailed keyword matching analysis
- Actionable improvement recommendations
- Focus on professional alignment
- NO additional text outside JSON

Resume Text:
${resumeText}

Job Description:
${jobDescription}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = parseGeminiResponse(response);

    let atsAnalysis = null;

    try {
      atsAnalysis = JSON.parse(responseText);
    } catch {
      atsAnalysis = extractJsonFromText(responseText);
    }

    // Fallback if parsing fails
    if (!atsAnalysis) {
      return {
        atsScore: 50,
        keywordMatch: {
          totalKeywords: 10,
          matchedKeywords: 5,
          matchPercentage: 50,
        },
        strengths: [
          "Basic professional skills",
          "General work experience",
          "Potential for growth",
        ],
        improvementAreas: [
          "Resume specificity",
          "Keyword optimization",
          "Job description alignment",
        ],
        recommendedChanges: [
          "Tailor resume to job description",
          "Use more specific industry terms",
          "Highlight relevant achievements",
        ],
      };
    }

    return {
      atsScore: atsAnalysis.atsScore || 50,
      keywordMatch: atsAnalysis.keywordMatch || {
        totalKeywords: 10,
        matchedKeywords: 5,
        matchPercentage: 50,
      },
      strengths: atsAnalysis.strengths || [
        "Basic professional skills",
        "General work experience",
        "Potential for growth",
      ],
      improvementAreas: atsAnalysis.improvementAreas || [
        "Resume specificity",
        "Keyword optimization",
        "Job description alignment",
      ],
      recommendedChanges: atsAnalysis.recommendedChanges || [
        "Tailor resume to job description",
        "Use more specific industry terms",
        "Highlight relevant achievements",
      ],
    };
  } catch (err) {
    console.error("Gemini ATS Score Calculation Error:", err);
    return {
      atsScore: 50,
      keywordMatch: {
        totalKeywords: 10,
        matchedKeywords: 5,
        matchPercentage: 50,
      },
      strengths: [
        "Basic professional skills",
        "General work experience",
        "Potential for growth",
      ],
      improvementAreas: [
        "Resume specificity",
        "Keyword optimization",
        "Job description alignment",
      ],
      recommendedChanges: [
        "Tailor resume to job description",
        "Use more specific industry terms",
        "Highlight relevant achievements",
      ],
    };
  }
};

module.exports = {
  analyzeResumeWithGemini,
  extractSkillsFromResume,
  calculateATSScore,
};
