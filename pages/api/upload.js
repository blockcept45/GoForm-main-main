// pages/api/upload.js
import formidable from "formidable";
import fs from "fs";

export const config = {
  api: {
    bodyParser: false, // Required for formidable to handle file uploads
  },
};

// Helper to parse incoming form using formidable
const parseForm = (req) =>
  new Promise((resolve, reject) => {
    const form = formidable({ keepExtensions: true });
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });

// Function to parse MCQs from the uploaded TXT file
function parseMCQs(text) {
  const lines = text.split(/\r?\n/); // split all lines
  const mcqs = [];
  let i = 0;

  while (i < lines.length) {
    let line = lines[i].trim();

    // Skip empty lines
    if (!line) {
      i++;
      continue;
    }

    // Detect question line starting with number or "Q:"
    const questionMatch = line.match(/^(\d+[:.]|Q:)\s*(.*)/);
    if (!questionMatch) {
      i++;
      continue; // skip lines until question found
    }

    let questionText = questionMatch[2] || "";
    i++;

    // Collect question lines until first option (A-D)
    while (i < lines.length && !/^[A-D][)\.]\s*/.test(lines[i].trim()) && !/^Answer:/i.test(lines[i].trim())) {
      questionText += "\n" + lines[i].trim();
      i++;
    }

    // Collect options
    const options = [];
    while (i < lines.length && /^[A-D][)\.]\s*/.test(lines[i].trim())) {
      const optMatch = lines[i].trim().match(/^[A-D][)\.]\s*(.*)/);
      if (optMatch) options.push(optMatch[1].trim());
      i++;
    }

    // Read answer
    let answer = null;
    if (i < lines.length && /^Answer:/i.test(lines[i].trim())) {
      answer = lines[i].trim().replace(/^Answer:\s*/i, "");
      const letterMatch = answer.match(/^[A-D][)\.]?\s*/);
      if (letterMatch) answer = answer.replace(letterMatch[0], "").trim();
      i++;
    }

    if (options.length === 0) {
      throw new Error("No options found for question:\n" + questionText);
    }

    mcqs.push({ question: questionText, options, answer });
  }

  return mcqs;
}


// Function to generate Google Apps Script code
function generateGoogleAppsScript(mcqs) {
  const mcqString = JSON.stringify(mcqs);
  return `
function createFormFromMCQs() {
  const form = FormApp.create("Auto Generated MCQ Form");
  form.setIsQuiz(true); // Enable quiz mode
  const mcqs = ${mcqString};

  mcqs.forEach(q => {
    if (!q.options || q.options.length === 0) {
      throw new Error("No options found for question: " + q.question);
    }

    const item = form.addMultipleChoiceItem();
    const choices = q.options.map(opt => 
      item.createChoice(opt, q.answer ? opt.trim() === q.answer.trim() : false)
    );
    item.setTitle(q.question).setChoices(choices);
  });

  Logger.log("Form created: " + form.getEditUrl());
}
`;
}

// API handler
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { files } = await parseForm(req);
    const file = Array.isArray(files.file) ? files.file[0] : files.file; // Support multiple versions of formidable
    const text = fs.readFileSync(file.filepath, "utf-8");
    const mcqs = parseMCQs(text);
    const script = generateGoogleAppsScript(mcqs);

    res.status(200).json({ script });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Upload failed", details: err.message });
  }
}
