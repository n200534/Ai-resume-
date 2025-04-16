const PDFDocument = require("pdfkit");
const fs = require("fs");

const generateResumeReport = (resume) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const filePath = `./reports/resume_${resume._id}.pdf`;

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Add Resume Details
    doc.fontSize(20).text("Resume Review Report", { align: "center" });
    doc.moveDown();
    doc.fontSize(14).text(`Candidate: ${resume.name}`);
    doc.text(`Email: ${resume.email}`);
    doc.moveDown();
    doc.text(`Extracted Skills: ${resume.skills.join(", ")}`);
    doc.moveDown();
    doc.text(`AI Feedback: ${resume.aiFeedback}`);
    
    doc.end();

    stream.on("finish", () => resolve(filePath));
    stream.on("error", reject);
  });
};

module.exports = { generateResumeReport };
