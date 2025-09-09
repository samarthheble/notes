import { useState, useRef } from 'react';
import { jsPDF } from 'jspdf';
import { 
  FaRobot, FaFilePdf, FaQuestionCircle, FaSlidersH, 
  FaComment, FaPaintBrush, FaMagic, FaHeart, 
  FaCheckCircle, FaTimes, FaLightbulb, FaCopy,
  FaChevronDown, FaChevronUp, FaDownload
} from 'react-icons/fa';

const NotesGenerator = () => {
  const [filename, setFilename] = useState('ai-study-notes.pdf');
  const [questions, setQuestions] = useState('');
  const [detailLevel, setDetailLevel] = useState('balanced');
  const [tone, setTone] = useState('academic');
  const [formattingOptions, setFormattingOptions] = useState({
    highlightPoints: true,
    useBulletPoints: true,
    addExamples: true,
    addSummary: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [statusType, setStatusType] = useState('');
  const [progress, setProgress] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  
  const toastTimer = useRef(null);

  // Example questions
  const exampleQuestions = `Explain the concept of machine learning
What are the benefits of renewable energy?
Describe the process of photosynthesis
How does the internet work?`;

  const loadExampleQuestions = () => {
    setQuestions(exampleQuestions);
    showToastMessage("Example questions loaded!");
  };

  const copyExampleQuestions = () => {
    navigator.clipboard.writeText(exampleQuestions);
    showToastMessage("Example questions copied to clipboard!");
  };

  const handleFormattingOptionChange = (option) => {
    setFormattingOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  // Enhanced prompt engineering based on user selections
  const createPrompt = (question, detailLevel, tone, formattingOptions) => {
    let detailInstruction, toneInstruction;
    
    // Set detail level
    switch(detailLevel) {
      case 'concise':
        detailInstruction = "Provide a clear and concise explanation with only the most essential information. Use brief bullet points and keep it under 150 words.";
        break;
      case 'detailed':
        detailInstruction = "Provide a comprehensive, in-depth explanation with multiple sections, detailed examples, and thorough coverage of the topic. Aim for 300-400 words.";
        break;
      default: // balanced
        detailInstruction = "Provide a well-structured explanation with key points, examples, and a logical flow. Use headings and bullet points where appropriate. Aim for 200-300 words.";
    }
    
    // Set tone
    switch(tone) {
      case 'professional':
        toneInstruction = "Use a professional, formal tone suitable for business or technical documentation.";
        break;
      case 'explainlike5':
        toneInstruction = "Explain in very simple terms as if to a 5-year-old, using analogies and simple language. Avoid jargon.";
        break;
      case 'enthusiastic':
        toneInstruction = "Use an enthusiastic, engaging tone that makes the topic exciting and interesting.";
        break;
      default: // academic
        toneInstruction = "Use an academic, formal tone suitable for educational materials with proper terminology.";
    }
    
    // Add formatting instructions
    let formatInstruction = "Structure your response with clear sections: Introduction, Key Points, Detailed Explanation, Examples, and Summary. ";
    
    if (formattingOptions.highlightPoints) {
      formatInstruction += "Highlight key points by making them bold. ";
    }
    
    if (formattingOptions.useBulletPoints) {
      formatInstruction += "Use bullet points for listing information. ";
    }
    
    if (formattingOptions.addExamples) {
      formatInstruction += "Include practical examples where relevant. ";
    }
    
    if (formattingOptions.addSummary) {
      formatInstruction += "End with a concise summary. ";
    }
    
    return `You are a subject matter expert and skilled educator. Create comprehensive notes on the following topic. ${detailInstruction} ${toneInstruction}
    
    ${formatInstruction}
    
    Format your response using these exact section headings:
    # [Topic Title]
    ## Introduction
    ## Key Points
    ## Detailed Explanation
    ## Examples
    ## Summary
    
    Topic: ${question}`;
  };

  const fetchAnswer = async (question, detailLevel, tone, formattingOptions) => {
    const prompt = createPrompt(question, detailLevel, tone, formattingOptions);
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { 
            role: "system", 
            content: "You are a professional and highly knowledgeable subject matter expert with excellent teaching skills. Format your responses with clear section headings and structure." 
          },
          { role: "user", content: prompt }
        ],
        max_tokens: 2000,
        temperature: 0.7
      })
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API error: ${res.status}`);
    }
    
    const data = await res.json();
    return data.choices[0].message.content;
  };

  const formatAnswer = (text) => {
    // Remove HTML tags from the text to prevent them from showing in PDF
    return text
      .replace(/<b>(.*?)<\/b>/g, '$1') // Remove bold tags but keep content
      .replace(/<i>(.*?)<\/i>/g, '$1') // Remove italic tags but keep content
      .replace(/<[^>]*>/g, '') // Remove any remaining HTML tags
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove markdown bold
      .replace(/\*(.*?)\*/g, '$1'); // Remove markdown italic
  };

  const addFormattedText = (doc, text, x, y, maxWidth) => {
    // Split text into lines
    const lines = text.split('\n');
    let currentY = y;
    
    for (const line of lines) {
      if (line.trim() === '') {
        currentY += 5; // Add extra space for empty lines
        continue;
      }
      
      // Check if we need a new page
      if (currentY > 270) {
        doc.addPage();
        currentY = 20;
      }
      
      // Handle section headings
      if (line.startsWith('# ')) {
        // Main heading
        const headingText = line.substring(2).trim();
        doc.setFont(undefined, 'bold');
        doc.setFontSize(16);
        doc.text(headingText, x, currentY);
        currentY += 10;
        doc.setFont(undefined, 'normal');
        doc.setFontSize(12);
      } else if (line.startsWith('## ')) {
        // Subheading
        const headingText = line.substring(3).trim();
        doc.setFont(undefined, 'bold');
        doc.setFontSize(14);
        doc.text(headingText, x, currentY);
        currentY += 8;
        doc.setFont(undefined, 'normal');
        doc.setFontSize(12);
      } else if (line.startsWith('• ') || line.startsWith('- ')) {
        // List item
        const itemText = line.substring(2).trim();
        const splitLines = doc.splitTextToSize(itemText, maxWidth - 10);
        doc.text(splitLines, x + 5, currentY);
        currentY += (splitLines.length * 7);
      } else {
        // Regular text - use jsPDF's built-in text wrapping
        const splitLines = doc.splitTextToSize(line, maxWidth);
        doc.text(splitLines, x, currentY);
        currentY += (splitLines.length * 7);
      }
      
      // Add spacing between lines
      currentY += 2;
    }
    
    return currentY;
  };

  const generatePDF = async (filename, qnaList) => {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const maxLineWidth = pageWidth - margin * 2;
    let y = 20;

    // Set default font
    doc.setFont(undefined, 'normal');
    doc.setFontSize(12);

    // Add a title page
    doc.setFontSize(22);
    doc.setFont(undefined, 'bold');
    doc.text("AI-Generated Study Notes", pageWidth / 2, 100, { align: 'center' });
    doc.setFontSize(16);
    doc.setFont(undefined, 'normal');
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, 120, { align: 'center' });
    doc.addPage();

    for (const { q, a } of qnaList) {
      // Check if we need a new page before adding a new question
      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      // Question title (bold and slightly larger)
      doc.setFont(undefined, 'bold');
      doc.setFontSize(14);
      
      // Split question text if it's too long
      const questionLines = doc.splitTextToSize(q, maxLineWidth);
      doc.text(questionLines, margin, y);
      
      // Calculate height of question text and update y position
      y += (questionLines.length * 6) + 5;
      
      // Answer text
      doc.setFont(undefined, 'normal');
      doc.setFontSize(12);
      
      const formattedAnswer = formatAnswer(a);
      y = addFormattedText(doc, formattedAnswer, margin, y, maxLineWidth) + 15;
    }

    // Add footer with page numbers
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Page ${i} of ${totalPages} • Generated by AI Notes Generator`, pageWidth / 2, 290, { align: 'center' });
    }

    doc.save(filename);
  };

  const showToastMessage = (message, type = 'success') => {
    setToastMessage(message);
    setStatusType(type);
    setShowToast(true);
    
    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
    }
    
    toastTimer.current = setTimeout(() => {
      setShowToast(false);
    }, 5000);
  };

  const hideToast = () => {
    setShowToast(false);
    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
    }
  };

  const handleGenerate = async () => {
    const text = questions.trim();
    let fname = filename.trim();
    const questionsList = text.split("\n").map(q => q.trim()).filter(Boolean);
    
    if (!fname) fname = "ai-notes.pdf";
    if (!fname.toLowerCase().endsWith(".pdf")) fname += ".pdf";

    if (!text) {
      showToastMessage('Please enter at least one question.', 'error');
      return;
    }

    // Show progress UI
    setIsLoading(true);
    setTotalQuestions(questionsList.length);
    setCurrentQuestion(1);
    setProgress(0);
    setStatus('Initializing...');
    setStatusType('');

    try {
      const qnaList = [];
      
      for (let i = 0; i < questionsList.length; i++) {
        const q = questionsList[i];
        
        // Update progress
        const newProgress = ((i) / questionsList.length) * 100;
        setProgress(newProgress);
        setCurrentQuestion(i + 1);
        setStatus(`Processing: ${q.length > 50 ? q.substring(0, 50) + "..." : q}`);
        
        const ans = await fetchAnswer(q, detailLevel, tone, formattingOptions);
        qnaList.push({ q, a: ans });
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      setProgress(100);
      setStatus('Creating PDF document...');
      
      await generatePDF(fname, qnaList);

      setStatus('PDF successfully generated!');
      setStatusType('success');
      showToastMessage("PDF downloaded successfully!");
      
    } catch (err) {
      console.error(err);
      setStatus(`Error: ${err.message}`);
      setStatusType('error');
      showToastMessage(`Error: ${err.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen  py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden transition-all duration-300 hover:shadow-2xl">
          <div className="p-6 md:p-8">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-5">
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl shadow-lg">
                    <FaRobot className="text-4xl" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm border-2 border-white">
                    <FaDownload />
                  </div>
                </div>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
                AI-Powered Notes Generator
              </h1>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto leading-relaxed">
                Transform your questions into detailed, well-structured PDF notes with our advanced AI
              </p>
            </div>

            <div className="space-y-6">
              <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
                <label htmlFor="filename" className="block font-medium text-blue-800 mb-2 flex items-center gap-2">
                  <FaFilePdf className="text-blue-600 text-lg" /> PDF File Name
                </label>
                <input 
                  id="filename" 
                  type="text" 
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200" 
                  placeholder="e.g., my-study-notes.pdf" 
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                />
              </div>

              <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
                <label htmlFor="questions" className="block font-medium text-blue-800 mb-2 flex items-center gap-2">
                  <FaQuestionCircle className="text-blue-600 text-lg" /> Questions/Topics (one per line)
                </label>
                <textarea 
                  id="questions" 
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 min-h-44" 
                  placeholder="Enter each question or topic on a new line..."
                  value={questions}
                  onChange={(e) => setQuestions(e.target.value)}
                />
                <div className="flex flex-wrap gap-3 mt-3">
                  <button 
                    className="flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg transition-colors duration-200 text-sm font-medium"
                    onClick={loadExampleQuestions}
                  >
                    <FaMagic className="text-sm" /> Load Example Questions
                  </button>
                  <button 
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors duration-200 text-sm font-medium"
                    onClick={copyExampleQuestions}
                  >
                    <FaCopy className="text-sm" /> Copy Examples
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
                  <label htmlFor="detailLevel" className="block font-medium text-blue-800 mb-2 flex items-center gap-2">
                    <FaSlidersH className="text-blue-600 text-lg" /> Detail Level
                  </label>
                  <select 
                    id="detailLevel" 
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white"
                    value={detailLevel}
                    onChange={(e) => setDetailLevel(e.target.value)}
                  >
                    <option value="concise">Concise (Summary)</option>
                    <option value="balanced">Balanced (Recommended)</option>
                    <option value="detailed">Detailed (Comprehensive)</option>
                  </select>
                </div>

                <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
                  <label htmlFor="tone" className="block font-medium text-blue-800 mb-2 flex items-center gap-2">
                    <FaComment className="text-blue-600 text-lg" /> Writing Tone
                  </label>
                  <select 
                    id="tone" 
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white"
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                  >
                    <option value="professional">Professional</option>
                    <option value="academic">Academic</option>
                    <option value="explainlike5">Explain Like I'm 5</option>
                    <option value="enthusiastic">Enthusiastic</option>
                  </select>
                </div>
              </div>
              
              <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
                <button 
                  className="flex items-center justify-between w-full text-left font-medium text-blue-800 mb-2"
                  onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                >
                  <span className="flex items-center gap-2">
                    <FaPaintBrush className="text-blue-600 text-lg" /> Formatting Options
                  </span>
                  {showAdvancedOptions ? <FaChevronUp /> : <FaChevronDown />}
                </button>
                
                {showAdvancedOptions && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <div className="flex items-center">
                      <input 
                        type="checkbox" 
                        id="highlightPoints" 
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        checked={formattingOptions.highlightPoints}
                        onChange={() => handleFormattingOptionChange('highlightPoints')}
                      />
                      <label htmlFor="highlightPoints" className="ml-2 block text-gray-700">
                        Highlight Key Points
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input 
                        type="checkbox" 
                        id="useBulletPoints" 
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        checked={formattingOptions.useBulletPoints}
                        onChange={() => handleFormattingOptionChange('useBulletPoints')}
                      />
                      <label htmlFor="useBulletPoints" className="ml-2 block text-gray-700">
                        Use Bullet Points
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input 
                        type="checkbox" 
                        id="addExamples" 
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        checked={formattingOptions.addExamples}
                        onChange={() => handleFormattingOptionChange('addExamples')}
                      />
                      <label htmlFor="addExamples" className="ml-2 block text-gray-700">
                        Include Examples
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input 
                        type="checkbox" 
                        id="addSummary" 
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        checked={formattingOptions.addSummary}
                        onChange={() => handleFormattingOptionChange('addSummary')}
                      />
                      <label htmlFor="addSummary" className="ml-2 block text-gray-700">
                        Add Summary
                      </label>
                    </div>
                  </div>
                )}
              </div>

              <button 
                className={`w-full py-4 px-6 rounded-xl font-medium text-white transition-all duration-300 flex items-center justify-center gap-2
                  ${isLoading 
                    ? 'bg-blue-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-md hover:shadow-lg transform hover:-translate-y-0.5'}`}
                onClick={handleGenerate}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <FaMagic /> Generate PDF Notes
                  </>
                )}
              </button>

              {isLoading && (
                <div className="bg-gray-100 p-5 rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-700 font-medium">Progress: {Math.round(progress)}%</span>
                    <span className="text-gray-600 text-sm">Question {currentQuestion} of {totalQuestions}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-2.5 rounded-full transition-all duration-500 ease-out" 
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <p className="mt-3 text-gray-600 text-sm">{status}</p>
                </div>
              )}

              <div className="bg-gradient-to-r from-green-500 to-blue-600 text-white p-6 rounded-2xl">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-3">
                  <FaLightbulb className="text-yellow-300" /> Pro Tips
                </h3>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <span className="inline-block bg-white bg-opacity-20 rounded-full w-5 h-5 flex items-center justify-center mr-2 flex-shrink-0">✓</span>
                    <span>Use clear, specific questions for better results</span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-block bg-white bg-opacity-20 rounded-full w-5 h-5 flex items-center justify-center mr-2 flex-shrink-0">✓</span>
                    <span>Group related topics together for cohesive notes</span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-block bg-white bg-opacity-20 rounded-full w-5 h-5 flex items-center justify-center mr-2 flex-shrink-0">✓</span>
                    <span>Try different detail levels based on your needs</span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-block bg-white bg-opacity-20 rounded-full w-5 h-5 flex items-center justify-center mr-2 flex-shrink-0">✓</span>
                    <span>For complex topics, break them into multiple questions</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 px-6 py-4 text-center border-t border-gray-100">
            <p className="text-gray-600 text-sm">
              Powered by Groq AI & LLaMA 3 • Made with <span className="text-red-500 animate-pulse inline-block"><FaHeart /></span> for students and professionals
            </p>
          </div>
        </div>
      </div>

      <div className={`fixed bottom-4 right-4 left-4 sm:left-auto max-w-sm mx-auto transition-all duration-500 transform ${showToast ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
        <div className={`rounded-lg shadow-lg p-4 flex items-start ${statusType === 'error' ? 'bg-red-100 border-l-4 border-red-500' : 'bg-green-100 border-l-4 border-green-500'}`}>
          <div className={`flex-shrink-0 ${statusType === 'error' ? 'text-red-500' : 'text-green-500'} mr-3 text-lg`}>
            {statusType === 'error' ? <FaTimes /> : <FaCheckCircle />}
          </div>
          <div className="flex-1">
            <p className={`font-medium ${statusType === 'error' ? 'text-red-800' : 'text-green-800'}`}>
              {statusType === 'error' ? 'Error' : 'Success!'}
            </p>
            <p className={`text-sm ${statusType === 'error' ? 'text-red-700' : 'text-green-700'} mt-1`}>
              {toastMessage}
            </p>
          </div>
          <button 
            className={`flex-shrink-0 ml-4 ${statusType === 'error' ? 'text-red-500 hover:text-red-700' : 'text-green-500 hover:text-green-700'}`}
            onClick={hideToast}
          >
            <FaTimes />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotesGenerator;