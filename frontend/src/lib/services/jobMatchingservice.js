// Improved jobMatchingService.js
const natural = require('natural');
const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;

/**
 * Predicts job success score based on resume and job matching
 * @param {Object} resume - The user's resume object
 * @param {Object} job - The job posting object
 * @returns {Number} - A score between 0-100 representing match percentage
 */
const predictJobSuccess = (resume, job) => {
  try {
    if (!resume || !job) {
      console.error("Missing resume or job object");
      return 0;
    }
    
    // Extract skills from resume and job
    const resumeSkills = resume.skills || [];
    const jobSkills = job.skills || [];
    
    if (resumeSkills.length === 0 || jobSkills.length === 0) {
      return 0;
    }
    
    // Normalize all skills to lowercase and stem them for better matching
    const normalizedResumeSkills = resumeSkills.map(skill => 
      stemmer.stem(skill.toLowerCase().trim())
    );
    
    const normalizedJobSkills = jobSkills.map(skill => 
      stemmer.stem(skill.toLowerCase().trim())
    );
    
    // Count how many job skills are found in the resume
    let matchedSkillsCount = 0;
    
    normalizedJobSkills.forEach(jobSkill => {
      if (normalizedResumeSkills.some(resumeSkill => 
        resumeSkill === jobSkill || 
        resumeSkill.includes(jobSkill) || 
        jobSkill.includes(resumeSkill)
      )) {
        matchedSkillsCount++;
      }
    });
    
    // Calculate match percentage based on how many job skills are found in the resume
    // If all job skills are found, score is 100%
    const matchPercentage = Math.round((matchedSkillsCount / jobSkills.length) * 100);
    
    return matchPercentage;
  } catch (error) {
    console.error("Error calculating job match:", error);
    return 0;
  }
};

/**
 * Helper function to parse experience years from text
 * @param {String} experienceText - Text describing experience
 * @returns {Number} - Estimated years of experience
 */
const parseExperienceYears = (experienceText) => {
  if (!experienceText) return 0;
  
  // Simple regex to find numbers followed by "year" or "years"
  const yearsMatch = experienceText.match(/(\d+)\s*(?:year|years)/i);
  if (yearsMatch && yearsMatch[1]) {
    return parseInt(yearsMatch[1], 10);
  }
  
  // Fallback estimation based on text length and content
  const words = experienceText.split(/\s+/).length;
  if (words > 200) return 5; // Extensive experience description
  if (words > 100) return 3; // Moderate experience description
  return 1; // Limited experience description
};

/**
 * Performs semantic matching between resume text and job description
 * @param {String} resumeText - The full text of the resume
 * @param {String} jobDescription - The job description text
 * @returns {Object} - Detailed match analysis
 */
const semanticJobMatching = (resumeText, jobDescription) => {
  if (!resumeText || !jobDescription) {
    console.error("Missing resume text or job description");
    return {
      score: 0,
      matchPercentage: 0,
      matchedKeywords: [],
      missingKeywords: [],
      feedback: "Could not analyze due to missing data."
    };
  }

  try {
    // Tokenize texts
    const resumeTokens = tokenizer.tokenize(resumeText.toLowerCase());
    const jobTokens = tokenizer.tokenize(jobDescription.toLowerCase());
    
    // Create TF-IDF vectors
    const TfIdf = natural.TfIdf;
    const tfidf = new TfIdf();
    
    tfidf.addDocument(resumeTokens);
    tfidf.addDocument(jobTokens);
    
    // Extract important keywords from job description
    const commonWords = ['and', 'the', 'for', 'with', 'this', 'that', 'have', 'will', 'from', 'your'];
    
    const jobKeywords = jobTokens.filter(token => 
      token.length > 3 && 
      !commonWords.includes(token)
    );
    
    // Remove duplicates
    const uniqueJobKeywords = [...new Set(jobKeywords)];
    
    // Check which keywords are found in resume
    const keywordMatches = [];
    const missingKeywords = [];
    
    uniqueJobKeywords.forEach(keyword => {
      // Check for exact or stemmed matches
      const stemmedKeyword = stemmer.stem(keyword);
      const foundMatch = resumeTokens.some(token => 
        token === keyword || stemmer.stem(token) === stemmedKeyword
      );
      
      if (foundMatch) {
        keywordMatches.push(keyword);
      } else {
        missingKeywords.push(keyword);
      }
    });
    
    // Calculate similarity score
    const matchPercentage = Math.round((keywordMatches.length / uniqueJobKeywords.length) * 100);
    
    return {
      score: matchPercentage,
      matchPercentage: matchPercentage,
      matchedKeywords: keywordMatches,
      missingKeywords: missingKeywords.slice(0, 10), // Limit to top 10 missing keywords
      feedback: generateFeedback(matchPercentage, missingKeywords)
    };
  } catch (error) {
    console.error("Error in semantic job matching:", error);
    return {
      score: 0,
      matchPercentage: 0,
      matchedKeywords: [],
      missingKeywords: [],
      feedback: "An error occurred during analysis."
    };
  }
};

/**
 * Generates feedback based on match score and missing keywords
 * @param {Number} score - Match score percentage
 * @param {Array} missingKeywords - List of missing keywords
 * @returns {String} - Feedback message
 */
const generateFeedback = (score, missingKeywords) => {
  let feedback = '';
  
  if (score >= 90) {
    feedback = "Excellent match! Your profile strongly aligns with this job's requirements.";
  } else if (score >= 75) {
    feedback = "Good match. You have most of the skills required for this position.";
  } else if (score >= 50) {
    feedback = "Moderate match. Consider emphasizing relevant skills in your application.";
  } else if (score >= 30) {
    feedback = "Basic match. This role may require additional skills not prominent in your resume.";
  } else {
    feedback = "Lower match. This position may be seeking a different skill set than what's highlighted in your resume.";
  }
  
  if (missingKeywords.length > 0) {
    const topKeywords = missingKeywords.slice(0, 5).join(', ');
    feedback += ` Consider adding these keywords to your resume: ${topKeywords}.`;
  }
  
  return feedback;
};

module.exports = {
  predictJobSuccess,
  semanticJobMatching
};