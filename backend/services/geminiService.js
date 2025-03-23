const axios = require("axios");

const analyzeResumeWithGemini = async (resumeText) => {
  try {
    const response = await axios.post(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
      {
        contents: [
          {
            parts: [
              {
                text: `Analyze this resume and provide feedback on skills, experience, and improvement suggestions:\n\n${resumeText}`
              }
            ]
          }
        ]
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GEMINI_API_KEY}`,
        },
      }
    );

    return response.data.candidates[0].content.parts[0].text;
  } catch (err) {
    console.error("Gemini API Error:", err.message);
    return "AI analysis failed. Please try again.";
  }
};

module.exports = { analyzeResumeWithGemini };

const extractSkillsFromResume = async (resumeText) => {
    try {
      const response = await axios.post(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
        {
          contents: [
            {
              parts: [
                {
                  text: `Extract the key skills from this resume:\n\n${resumeText}`
                }
              ]
            }
          ]
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.GEMINI_API_KEY}`,
          },
        }
      );
  
      return response.data.candidates[0].content.parts[0].text.split(", ");
    } catch (err) {
      console.error("Gemini API Error:", err.message);
      return [];
    }
  };
  
  module.exports = { extractSkillsFromResume };
  