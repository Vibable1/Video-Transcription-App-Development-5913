import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';

/**
 * Generate a summary from transcription data
 * @param {Array} transcriptionData - Array of transcription segments
 * @returns {string} - Generated summary
 */
export const generateSummary = (transcriptionData) => {
  if (!transcriptionData || transcriptionData.length === 0) {
    return 'No transcription data available for summary.';
  }

  const fullText = transcriptionData.map(segment => segment.text).join(' ');
  const sentences = fullText.split(/[.!?]+/).filter(s => s.trim().length > 10);
  
  // Simple extractive summarization - take key sentences
  const keyWords = ['important', 'key', 'main', 'significant', 'conclusion', 'summary', 'result', 'findings', 'recommend', 'suggest', 'critical', 'essential', 'primary', 'focus', 'goal', 'objective', 'solution', 'problem', 'issue', 'challenge'];
  
  let scoredSentences = sentences.map(sentence => {
    let score = 0;
    const lowerSentence = sentence.toLowerCase();
    
    // Score based on keywords
    keyWords.forEach(word => {
      if (lowerSentence.includes(word)) {
        score += 2;
      }
    });
    
    // Prefer sentences of moderate length
    if (sentence.length > 50 && sentence.length < 200) {
      score += 1;
    }
    
    // Prefer sentences with numbers (often contain facts)
    if (/\d/.test(sentence)) {
      score += 1;
    }
    
    return { sentence: sentence.trim(), score };
  });

  // Sort by score and take top sentences (max 30% of original)
  const summaryLength = Math.min(Math.ceil(sentences.length * 0.3), 10);
  const topSentences = scoredSentences
    .sort((a, b) => b.score - a.score)
    .slice(0, summaryLength)
    .map(item => item.sentence)
    .filter(s => s.length > 0);

  return topSentences.join('. ') + '.';
};

/**
 * Generate key points from transcription data
 * @param {Array} transcriptionData - Array of transcription segments
 * @returns {Array} - Array of key points
 */
export const generateKeyPoints = (transcriptionData) => {
  if (!transcriptionData || transcriptionData.length === 0) {
    return ['No transcription data available for key points.'];
  }

  const fullText = transcriptionData.map(segment => segment.text).join(' ');
  const sentences = fullText.split(/[.!?]+/).filter(s => s.trim().length > 15);
  
  // Keywords that often indicate important points
  const importantPhrases = [
    'the main point', 'key takeaway', 'important to note', 'remember that',
    'first', 'second', 'third', 'finally', 'in conclusion', 'to summarize',
    'the goal is', 'we need to', 'it\'s crucial', 'essential that',
    'the problem is', 'the solution', 'we recommend', 'next steps',
    'action items', 'deliverables', 'timeline', 'deadline',
    'budget', 'cost', 'revenue', 'profit', 'loss',
    'increase', 'decrease', 'improve', 'optimize', 'enhance'
  ];

  let keyPoints = [];
  
  // Find sentences with important phrases
  sentences.forEach(sentence => {
    const lowerSentence = sentence.toLowerCase();
    let score = 0;
    
    importantPhrases.forEach(phrase => {
      if (lowerSentence.includes(phrase)) {
        score += 3;
      }
    });
    
    // Look for numbered points - FIX: Removed the unnecessary escape characters
    if (/^\s*\d+[.)]/.test(sentence) || /first|second|third|fourth|fifth|next|then|also|additionally|furthermore|moreover/i.test(sentence)) {
      score += 2;
    }
    
    // Look for questions (often highlight important topics)
    if (sentence.includes('?')) {
      score += 1;
    }
    
    // Prefer sentences with specific metrics or data
    if (/\d+%|\$\d+|\d+\s*(minutes|hours|days|weeks|months|years)/i.test(sentence)) {
      score += 2;
    }
    
    if (score > 0) {
      keyPoints.push({ text: sentence.trim(), score });
    }
  });

  // If we don't have enough scored points, add some general important sentences
  if (keyPoints.length < 5) {
    const additionalSentences = sentences
      .filter(s => s.length > 30 && s.length < 150)
      .slice(0, 8 - keyPoints.length)
      .map(s => ({ text: s.trim(), score: 1 }));
    
    keyPoints = [...keyPoints, ...additionalSentences];
  }

  // Sort by score and clean up
  return keyPoints
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(item => item.text)
    .filter(point => point.length > 0);
};

/**
 * Export content as TXT file
 * @param {string} content - Content to export
 * @param {string} filename - Filename for the export
 */
export const exportAsTxt = (content, filename) => {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  saveAs(blob, `${filename}.txt`);
};

/**
 * Export content as HTML file
 * @param {string} content - Content to export
 * @param {string} filename - Filename for the export
 * @param {string} title - Title for the HTML document
 * @param {string} type - Type of export (full, summary, keypoints)
 */
export const exportAsHtml = (content, filename, title, type = 'full') => {
  let htmlContent;
  
  if (type === 'keypoints') {
    // Content is an array for key points
    const keyPointsList = Array.isArray(content) ? content : [content];
    const listItems = keyPointsList.map(point => `<li>${point}</li>`).join('\n');
    
    htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Key Points</title>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px;
            background-color: #f9fafb;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 { 
            color: #1f2937; 
            border-bottom: 3px solid #0ea5e9; 
            padding-bottom: 10px;
            margin-bottom: 30px;
        }
        ul { 
            list-style-type: none; 
            padding: 0; 
        }
        li { 
            background: #f0f9ff;
            margin: 10px 0; 
            padding: 15px; 
            border-left: 4px solid #0ea5e9;
            border-radius: 5px;
        }
        li:before {
            content: "▸ ";
            color: #0ea5e9;
            font-weight: bold;
            margin-right: 8px;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>${title} - Key Points</h1>
        <ul>
            ${listItems}
        </ul>
        <div class="footer">
            <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
        </div>
    </div>
</body>
</html>`;
  } else {
    // Regular content for full transcript or summary
    const formattedContent = content.replace(/\n/g, '</p><p>');
    
    htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - ${type === 'summary' ? 'Summary' : 'Full Transcript'}</title>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.8; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px;
            background-color: #f9fafb;
            color: #374151;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 { 
            color: #1f2937; 
            border-bottom: 3px solid #0ea5e9; 
            padding-bottom: 10px;
            margin-bottom: 30px;
        }
        p { 
            margin-bottom: 15px; 
            text-align: justify;
        }
        .summary-tag {
            background: #dbeafe;
            color: #1e40af;
            padding: 5px 10px;
            border-radius: 15px;
            font-size: 12px;
            font-weight: bold;
            display: inline-block;
            margin-bottom: 20px;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>${title}</h1>
        ${type === 'summary' ? '<span class="summary-tag">SUMMARY</span>' : ''}
        <p>${formattedContent}</p>
        <div class="footer">
            <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
        </div>
    </div>
</body>
</html>`;
  }
  
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  saveAs(blob, `${filename}.html`);
};

/**
 * Export content as DOCX file
 * @param {string|Array} content - Content to export
 * @param {string} filename - Filename for the export
 * @param {string} title - Title for the document
 * @param {string} type - Type of export (full, summary, keypoints)
 */
export const exportAsDocx = async (content, filename, title, type = 'full') => {
  try {
    let documentChildren = [];
    
    // Add title
    documentChildren.push(
      new Paragraph({
        children: [
          new TextRun({
            text: title,
            bold: true,
            size: 32,
            color: '1f2937'
          })
        ],
        heading: HeadingLevel.TITLE,
        spacing: { after: 400 }
      })
    );

    // Add type indicator
    if (type === 'summary') {
      documentChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'SUMMARY',
              bold: true,
              size: 20,
              color: '0ea5e9'
            })
          ],
          spacing: { after: 200 }
        })
      );
    } else if (type === 'keypoints') {
      documentChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'KEY POINTS',
              bold: true,
              size: 20,
              color: '0ea5e9'
            })
          ],
          spacing: { after: 200 }
        })
      );
    }

    // Add content
    if (type === 'keypoints' && Array.isArray(content)) {
      // Handle key points as a bulleted list
      content.forEach(point => {
        documentChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `• ${point}`,
                size: 22
              })
            ],
            spacing: { after: 120 }
          })
        );
      });
    } else {
      // Handle regular text content
      const textContent = Array.isArray(content) ? content.join(' ') : content;
      const paragraphs = textContent.split('\n').filter(p => p.trim());
      
      paragraphs.forEach(paragraph => {
        documentChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: paragraph.trim(),
                size: 22
              })
            ],
            spacing: { after: 120 }
          })
        );
      });
    }

    // Add footer with generation date
    documentChildren.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`,
            size: 18,
            color: '6b7280',
            italics: true
          })
        ],
        spacing: { before: 400 }
      })
    );

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: documentChildren
        }
      ]
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${filename}.docx`);
  } catch (error) {
    console.error('Error creating DOCX file:', error);
    throw new Error('Failed to create DOCX file. Please try a different format.');
  }
};

/**
 * Main export function that handles all export types and formats
 * @param {Array} transcriptionData - Array of transcription segments
 * @param {string} exportType - Type of export (full, summary, keypoints)
 * @param {string} fileFormat - File format (txt, html, docx)
 * @param {string} baseFilename - Base filename without extension
 */
export const exportTranscription = async (transcriptionData, exportType, fileFormat, baseFilename) => {
  try {
    if (!transcriptionData || transcriptionData.length === 0) {
      throw new Error('No transcription data available for export.');
    }

    let content;
    let filename;
    let title = baseFilename;

    // Generate content based on export type
    switch (exportType) {
      case 'full':
        content = transcriptionData.map(segment => segment.text).join('\n\n');
        filename = `${baseFilename}_full_transcript`;
        title = `${baseFilename} - Full Transcript`;
        break;
      
      case 'summary':
        content = generateSummary(transcriptionData);
        filename = `${baseFilename}_summary`;
        title = `${baseFilename} - Summary`;
        break;
      
      case 'keypoints':
        content = generateKeyPoints(transcriptionData);
        filename = `${baseFilename}_key_points`;
        title = `${baseFilename} - Key Points`;
        break;
      
      default:
        throw new Error('Invalid export type specified.');
    }

    // Export based on file format
    switch (fileFormat.toLowerCase()) {
      case 'txt':
        const txtContent = exportType === 'keypoints' 
          ? content.map((point, index) => `${index + 1}. ${point}`).join('\n\n')
          : content;
        exportAsTxt(txtContent, filename);
        break;
      
      case 'html':
        exportAsHtml(content, filename, title, exportType);
        break;
      
      case 'docx':
        await exportAsDocx(content, filename, title, exportType);
        break;
      
      default:
        throw new Error('Invalid file format specified.');
    }

    return { success: true, filename: `${filename}.${fileFormat}` };
  } catch (error) {
    console.error('Export error:', error);
    throw error;
  }
};