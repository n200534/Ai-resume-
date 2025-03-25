const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

function parseResumeData(text) {
    // Remove extra whitespaces and split into lines
    const lines = text.split('\n')
        .map(line => line.trim())
        .filter(line => line);

    // Structured data object with default empty values
    const resumeData = {
        personalInfo: {
            fullName: '',
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            location: ''
        },
        workExperience: [],
        education: {
            degree: '',
            major: '',
            institution: '',
            period: '',
            location: ''
        },
        skills: [],
        certifications: []
    };

    // Personal Info Extraction
    resumeData.personalInfo = {
        fullName: lines[0] || '',
        firstName: lines[0]?.split(' ')[0] || '',
        lastName: lines[0]?.split(' ').pop() || '',
        email: lines.find(line => line.includes('@'))?.match(/[\w\.-]+@[\w\.-]+\.\w+/)?.[0] || '',
        phone: lines.find(line => /\(\d{3}\)\s*\d{3}-\d{4}/.test(line))?.match(/\(\d{3}\)\s*\d{3}-\d{4}/)?.[0] || '',
        location: lines.find(line => line.includes('TN') || line.includes('Nashville'))?.trim() || ''
    };

    // Work Experience Extraction
    const workStartIndex = lines.findIndex(line => line === 'WORK EXPERIENCE');
    const educationStartIndex = lines.findIndex(line => line === 'EDUCATION');

    if (workStartIndex !== -1 && educationStartIndex !== -1) {
        const workLines = lines.slice(workStartIndex + 1, educationStartIndex);
        
        // More robust work experience parsing
        for (let i = 0; i < workLines.length; i += 3) {
            if (i + 2 < workLines.length) {
                const job = {
                    title: workLines[i] || '',
                    company: workLines[i + 1]?.split(/\s+(?=\d{4})/)[0] || '',
                    period: workLines[i + 1]?.match(/\w+\s+\d{4}\s*-\s*\w+\s*\d{4}|current/)?.[0] || '',
                    location: workLines[i + 1]?.split(/\s+/).pop() || '',
                    responsibilities: []
                };

                // Collect responsibilities
                let j = i + 2;
                while (j < workLines.length && !workLines[j].match(/^[A-Z]/)) {
                    job.responsibilities.push(workLines[j]);
                    j++;
                }

                if (job.title && job.company) {
                    resumeData.workExperience.push(job);
                }
            }
        }
    }

    // Education Extraction
    const skillsStartIndex = lines.findIndex(line => line === 'SKILLS');
    if (educationStartIndex !== -1 && skillsStartIndex !== -1) {
        const eduLines = lines.slice(educationStartIndex + 1, skillsStartIndex);
        resumeData.education = {
            degree: eduLines[0] || '',
            major: eduLines[1] || '',
            institution: eduLines[2]?.split(/\s+(?=\d{4})/)[0] || '',
            period: eduLines[2]?.match(/\d{4}\s*-\s*\d{4}/)?.[0] || '',
            location: eduLines[2]?.split(/\s+/).pop() || ''
        };
    }

    // Skills Extraction
    const certStartIndex = lines.findIndex(line => line === 'CERTIFICATIONS');
    if (skillsStartIndex !== -1 && certStartIndex !== -1) {
        resumeData.skills = lines.slice(skillsStartIndex + 1, certStartIndex);
    }

    // Certifications Extraction
    if (certStartIndex !== -1) {
        resumeData.certifications = lines.slice(certStartIndex + 1);
    }

    return resumeData;
}

router.post('/upload', async (req, res) => {
    try {
        // Check if file was uploaded
        if (!req.files || !req.files.resume) {
            return res.status(400).json({ error: 'No resume file uploaded' });
        }

        const resumeFile = req.files.resume;
        const uploadPath = path.join(__dirname, '../uploads', resumeFile.name);

        // Ensure uploads directory exists
        const uploadsDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        // Save the file
        await resumeFile.mv(uploadPath);

        // Read PDF
        const dataBuffer = fs.readFileSync(uploadPath);
        const pdfData = await pdf(dataBuffer);

        // Parse resume data
        const structuredResumeData = parseResumeData(pdfData.text);

        // Optional: Delete the uploaded file after processing
        fs.unlinkSync(uploadPath);

        // Return structured resume data
        res.json({
            message: 'Resume uploaded and processed successfully',
            resumeData: structuredResumeData,
            rawText: pdfData.text
        });

    } catch (error) {
        console.error('Resume upload error:', error);
        res.status(500).json({ 
            error: 'Failed to process resume', 
            details: error.message 
        });
    }
});

module.exports = router;