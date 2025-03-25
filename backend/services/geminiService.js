const axios = require("axios");

const parseGeminiResponse = (response) => {
  try {
    return response.data.candidates[0].content.parts[0].text.trim();
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
- Exactly 5 top skills
- Experience summary in single paragraph
- Constructive feedback
- NO additional text outside JSON
- If no clear information, use placeholder values

Resume Text:
${resumeText}
`;

    const response = await axios.post(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024
        }
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GEMINI_API_KEY}`
        },
      }
    );

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
        skills: ["Communication", "Problem Solving", "Teamwork", "Adaptability", "Technical Skills"],
        experience: "Unable to extract specific experience details from the resume.",
        feedback: "Consider adding more specific professional achievements and using clear, concise language."
      };
    }

    return {
      skills: parsedResponse.skills || ["Communication", "Problem Solving", "Teamwork", "Adaptability", "Technical Skills"],
      experience: parsedResponse.experience || "Unable to extract specific experience details from the resume.",
      feedback: parsedResponse.feedback || "Consider adding more specific professional achievements and using clear, concise language."
    };
  } catch (err) {
    console.error("Gemini API Error:", err.response ? err.response.data : err.message);
    return {
      skills: ["Communication", "Problem Solving", "Teamwork", "Adaptability", "Technical Skills"],
      experience: "Analysis failed due to an unexpected error.",
      feedback: "Unable to process resume analysis. Please review and resubmit."
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

    const response = await axios.post(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: 256
        }
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GEMINI_API_KEY}`
        },
      }
    );

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
        .replace(/[\[\]"]/g, '')
        .split(/[,\n]/)
        .map(skill => skill.trim())
        .filter(skill => skill.length > 0);
    }

    return skills.slice(0, 10).length > 0 
      ? skills.slice(0, 10) 
      : ["Communication", "Problem Solving", "Teamwork", "Project Management", "Technical Skills"];
  } catch (err) {
    console.error("Gemini API Error:", err.response ? err.response.data : err.message);
    return ["Communication", "Problem Solving", "Teamwork", "Project Management", "Technical Skills"];
  }
};

module.exports = { 
  analyzeResumeWithGemini,
  extractSkillsFromResume
};