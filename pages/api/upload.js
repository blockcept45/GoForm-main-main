
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

// Function to parse MCQs from uploaded TXT file
function parseMCQs(text) {
  const lines = text.split(/\r?\n/);
  const mcqs = [];
  let i = 0;

  while (i < lines.length) {
    let line = lines[i].trim();
    if (!line) {
      i++;
      continue;
    }

    // Detect question line
    const questionMatch = line.match(/^(\d+[:.]|Q:)\s*(.*)/);
    if (!questionMatch) {
      i++;
      continue;
    }

    let questionText = questionMatch[2] || "";
    i++;

    // Collect multiline question text until first option or Answer
    while (
      i < lines.length &&
      !/^[A-D][)\.]\s*/.test(lines[i].trim()) &&
      !/^Answer:/i.test(lines[i].trim())
    ) {
      questionText += "\n" + lines[i].trim();
      i++;
    }

    // Collect options
    const options = [];
    while (i < lines.length && /^[A-D][)\.]\s*/.test(lines[i].trim())) {
      const optMatch = lines[i].trim().match(/^([A-D][)\.]\s*.*)/);
      if (optMatch) options.push(optMatch[1].trim()); // keep full option with "C) 6 7"
      i++;
    }

    // Collect answer
    let answer = null;
    if (i < lines.length && /^Answer:/i.test(lines[i].trim())) {
      answer = lines[i].trim().replace(/^Answer:\s*/i, "").trim(); // e.g. "C) 6 7"
      i++;
    }

    if (options.length === 0) {
      throw new Error("No options found for question:\n" + questionText);
    }

    mcqs.push({ question: questionText, options, answer });
  }

  return mcqs;
}

// Generate Google Apps Script
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
      item.createChoice(
        opt,
        q.answer ? opt.trim() === q.answer.trim() : false // ✅ correct answer
      )
    );

    item.setTitle(q.question)
        .setChoices(choices)
        .setPoints(1); // ✅ each question worth 1 point
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
    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    const text = fs.readFileSync(file.filepath, "utf-8");
    const mcqs = parseMCQs(text);
    const script = generateGoogleAppsScript(mcqs);

    res.status(200).json({ script });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Upload failed", details: err.message });
  }
}
