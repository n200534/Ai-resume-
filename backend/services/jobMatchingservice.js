const predictJobSuccess = (resume, job) => {
    const candidateSkills = new Set(resume.skills);
    const jobSkills = new Set(job.requiredSkills);
    
    const commonSkills = [...candidateSkills].filter(skill => jobSkills.has(skill));
    const matchPercentage = (commonSkills.length / jobSkills.size) * 100;
  
    return Math.round(matchPercentage);
  };
  
  module.exports = { predictJobSuccess };
  