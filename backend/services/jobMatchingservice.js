// services/jobMatchingService.js
const natural = require('natural');
const tokenizer = new natural.WordTokenizer();

/**
 * Predicts job success score based on resume and job matching
 * @param {Object} resume - The user's resume object
 * @param {Object} job - The job posting object
 * @returns {Number} - A score between 0-100 representing match percentage
 */
const predictJobSuccess = (resume, job) => {
  try {
    // Extract skills from resume and job
    const resumeSkills = resume.skills || [];
    const jobSkills = job.skills || [];
    
    if (resumeSkills.length === 0 || jobSkills.length === 0) {
      return 0;
    }

    // Calculate basic skills match
    let matchedSkills = 0;
    const normalizedResumeSkills = resumeSkills.map(skill => skill.toLowerCase());
    
    // Count exact matches
    jobSkills.forEach(skill => {
      if (normalizedResumeSkills.includes(skill.toLowerCase())) {
        matchedSkills++;
      }
    });

    // Calculate basic match percentage
    let matchPercentage = Math.round((matchedSkills / jobSkills.length) * 100);
    
    // Adjust for experience if available
    if (resume.experience && job.requiredExperience) {
      const experienceMatch = Math.min(resume.experience / job.requiredExperience, 1.5);
      matchPercentage = Math.round(matchPercentage * experienceMatch);
    }
    
    // Ensure score is between 0-100
    return Math.min(Math.max(matchPercentage, 0), 100);
  } catch (error) {
    console.error("Error calculating job match:", error);
    return 0;
  }
};

/**
 * Performs semantic matching between resume text and job description
 * @param {String} resumeText - The full text of the resume
 * @param {String} jobDescription - The job description text
 * @returns {Object} - Detailed match analysis
 */
const semanticJobMatching = (resumeText, jobDescription) => {
  // Tokenize texts
  const resumeTokens = tokenizer.tokenize(resumeText.toLowerCase());
  const jobTokens = tokenizer.tokenize(jobDescription.toLowerCase());
  
  // Create TF-IDF vectors
  const TfIdf = natural.TfIdf;
  const tfidf = new TfIdf();
  
  tfidf.addDocument(resumeTokens);
  tfidf.addDocument(jobTokens);
  
  // Calculate similarity
  let similarity = 0;
  let keywordMatches = [];
  let missingKeywords = [];
  
  // Extract important keywords from job description (simplified approach)
  const jobKeywords = jobTokens.filter(token => 
    token.length > 3 && 
    !['and', 'the', 'for', 'with'].includes(token)
  );
  
  // Check which keywords are found in resume
  jobKeywords.forEach(keyword => {
    if (resumeTokens.includes(keyword)) {
      keywordMatches.push(keyword);
      similarity += 1;
    } else {
      missingKeywords.push(keyword);
    }
  });
  
  // Normalize similarity score to percentage
  const maxPossibleScore = jobKeywords.length;
  const matchPercentage = Math.round((similarity / maxPossibleScore) * 100);
  
  return {
    score: matchPercentage,
    matchPercentage: matchPercentage,
    matchedKeywords: keywordMatches,
    missingKeywords: missingKeywords.slice(0, 10), // Limit to most important missing keywords
    feedback: generateFeedback(matchPercentage, missingKeywords)
  };
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
    feedback = "Excellent match! Your profile aligns very well with this job.";
  } else if (score >= 75) {
    feedback = "Good match. You have most of the skills required for this position.";
  } else if (score >= 50) {
    feedback = "Moderate match. Consider emphasizing relevant skills in your application.";
  } else {
    feedback = "Lower match. This role may require skills different from your current profile.";
  }
  
  if (missingKeywords.length > 0) {
    feedback += ` Consider adding these keywords to your resume: ${missingKeywords.slice(0, 5).join(', ')}.`;
  }
  
  return feedback;
};

module.exports = {
  predictJobSuccess,
  semanticJobMatching
};





































