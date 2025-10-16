"use client"; // <--- ADDED DIRECTIVE: This fixes the useState/useEffect error in Next.js App Router

import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader, ExternalLink, BookOpen, MessageSquare } from 'lucide-react';

// --- Constants and Configuration ---

// Use the recommended model for text generation
const MODEL_NAME = 'gemini-2.5-flash-preview-05-20';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent`;

// IMPORTANT: Leave apiKey as an empty string. The environment will inject the key at runtime.
const apiKey = "AIzaSyCZp2qat1ryJpV3_mkaPJrZYjyL_gaPIjQ";

// Define the persona for Prayu
const SYSTEM_INSTRUCTION = "You are Prayu, a classic, friendly, and helpful AI chatbot. Your primary goal is to assist the user by providing informative and concise responses. Keep your tone light and positive and always refer to yourself as Prayu. Crucially, do NOT use any Markdown formatting characters such as asterisks, hashtags, or lists. Respond in plain, unformatted text. You are equipped with Google Search to provide up-to-date and grounded information.";

// Initial message from the chatbot
const INITIAL_MESSAGE = {
  sender: 'Prayu',
  text: "Hello! I'm Prayu, your friendly AI companion. I can search the web for current information. Try switching to the 'Prompt Guide' if you need tips!"
};

// Helper function to simulate a pause for exponential backoff
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --- Sub-Components ---

// Component for the Prompt Learning Guide (New/Re-added Component)
const PromptLearningGuide = ({ setMode }) => (
    <div className="p-6 overflow-y-auto h-full bg-gray-50">
        <h2 className="text-2xl font-bold text-indigo-700 mb-4">Master the Art of Prompting</h2>
        <p className="text-gray-600 mb-6">
            A good prompt helps the AI understand exactly what you need. Follow these simple steps for better, more accurate results from Prayu.
        </p>
        
        <div className="space-y-6">
            <div className="bg-white p-4 rounded-xl shadow-lg border-l-4 border-indigo-500">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">1. Be Clear and Specific (Goal)</h3>
                <p className="text-sm text-gray-600">
                    Always state the goal clearly. Avoid vague phrases.
                </p>
                <div className="mt-3 text-xs bg-gray-100 p-2 rounded-lg">
                    <p className="font-mono">❌ Bad Prompt: Tell me about machine learning.</p>
                    <p className="font-mono mt-1 text-green-700">✅ Good Prompt: Explain the difference between supervised and unsupervised learning for a high school student.</p>
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-lg border-l-4 border-indigo-500">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">2. Provide Context (Role & Topic)</h3>
                <p className="text-sm text-gray-600">
                    Tell the AI who you are (or who the AI should pretend to be) and what information it should use.
                </p>
                <div className="mt-3 text-xs bg-gray-100 p-2 rounded-lg">
                    <p className="font-mono">❌ Bad Prompt: Write a summary of the latest space news.</p>
                    <p className="font-mono mt-1 text-green-700">✅ Good Prompt: Act as a NASA scientist and write a one-paragraph summary of the Artemis program's latest milestone.</p>
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-lg border-l-4 border-indigo-500">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">3. Set Constraints (Format & Length)</h3>
                <p className="text-sm text-gray-600">
                    Tell the AI exactly how the answer should look.
                </p>
                <div className="mt-3 text-xs bg-gray-100 p-2 rounded-lg">
                    <p className="font-mono">❌ Bad Prompt: Give me some ideas for a blog post.</p>
                    <p className="font-mono mt-1 text-green-700">✅ Good Prompt: List three blog post titles about Python, each under 10 words, followed by a one-sentence hook for each.</p>
                </div>
            </div>
        </div>
        
        {/* --- Advanced Prompting Tips (Correctly escaped) --- */}
        <div className="mt-10 pt-4 border-t border-gray-300">
            <h3 className="text-xl font-bold text-indigo-700 mb-4">Top 10 Advanced Prompting Strategies</h3>
            <ul className="space-y-3 text-gray-700 list-disc list-inside">
                <li>Chain-of-Thought (CoT) Prompting: Ask the AI to "Think step-by-step" before answering to improve logical reasoning and accuracy.</li>
                <li>Few-Shot Learning: Provide 2-3 examples of the input/output format you want before asking your main question.</li>
                <li>Specify Output Format: Demand the response in a specific format (e.g., JSON, table, bulleted list, or a LaTeX equation).</li>
                <li>Define the Role/Persona: Start with "Act as an expert historian..." or "You are a senior software engineer..." to improve the quality of the answer.</li>
                <li>Use Delimiters: Use triple quotes (`"""`), XML tags (`&lt;query&gt;`), or brackets to clearly separate your instructions from your context/data.</li>
                <li>Iterative Refinement: If the first answer is poor, tell the AI specifically what you want to change (e.g., "The tone is too formal, make it casual").</li>
                <li>Temperature Control (Conceptually): Ask the AI to be either "creative and unconventional" (high temperature) or "precise and factual" (low temperature).</li>
                <li>Negative Constraint: Explicitly state what the AI should NOT do (e.g., "Do not use any technical jargon").</li>
                <li>Hypothetical Scenarios: Ask "What if..." questions to explore edge cases and test boundaries of a topic.</li>
                <li>Audience Specification: Tell the AI who the final output is for (e.g., "Explain this to a five-year-old," or "Write a report for the CEO").</li>
            </ul>
        </div>
        
        <p className="text-gray-600 mt-6 pt-4 border-t border-gray-200">
            Now, switch back to AI Chat and try your improved prompts!
        </p>
    </div>
);


// Component for a single message bubble
const MessageBubble = ({ sender, text }) => {
    const isPrayu = sender === 'Prayu';
    const bubbleClass = isPrayu
      ? 'bg-emerald-50 text-emerald-900 self-start rounded-tl-none' // FIXED: New attractive emerald color for Prayu's messages
      : 'bg-indigo-600 text-white self-end rounded-br-none';

    return (
      <div className={`flex flex-col max-w-xs md:max-w-md ${isPrayu ? 'items-start' : 'items-end'} mb-3`}>
        <div className="text-xs text-gray-500 mb-1 px-1 font-medium">{isPrayu ? 'Prayu' : 'You'}</div>
        <div
          className={`px-4 py-2 shadow-lg rounded-xl transition-all duration-300 ${bubbleClass} whitespace-pre-wrap`}
        >
          {text}
        </div>
      </div>
    );
};

// --- Main App Component (Renamed for Next.js App Router) ---
export default function PrayuChatbotPage() {
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [citationSources, setCitationSources] = useState([]); // State for citations
  const [mode, setMode] = useState('chat'); // Added 'mode' state back
  const messagesEndRef = useRef(null);

  // Scroll to the bottom of the chat window whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Function to call the Gemini API with exponential backoff
  const fetchWithRetry = async (url, options, retries = 3) => {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, options);
        if (response.ok) {
          return response;
        }
        // If not OK (e.g., 429 rate limit), proceed to retry
        throw new Error(`API call failed with status: ${response.status}`);
      } catch (error) {
        if (i < retries - 1) {
          const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
          console.warn(`Attempt ${i + 1} failed. Retrying in ${delay.toFixed(0)}ms...`);
          await sleep(delay);
        } else {
          throw error; // Re-throw if it's the last attempt
        }
      }
    }
    throw new Error('All API retries failed.');
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const cleanInput = input.trim();
    if (!cleanInput || isLoading) return;

    // --- Added Prompt Guide Intent Check back ---
    const promptKeywords = ["how to prompt", "better prompt", "prompt guide", "learn prompt", "prompting"];
    const inputLower = cleanInput.toLowerCase();

    const isPromptingQuestion = promptKeywords.some(keyword => inputLower.includes(keyword));

    if (isPromptingQuestion) {
        setMessages(prev => [...prev, 
            { sender: 'user', text: cleanInput },
            { sender: 'Prayu', text: "That's a fantastic question! To help you master prompting, I'm switching you over to our dedicated Prompt Guide now. Take a look at the tips on Clarity, Context, and Constraints." }
        ]);
        setInput('');
        setMode('learning'); // Switch the view mode
        return;
    }
    // --- End of Prompt Guide Intent Check ---

    const newUserMessage = { sender: 'user', text: cleanInput };
    setMessages(prev => [...prev, newUserMessage]);
    setInput('');
    setIsLoading(true);
    setCitationSources([]); // IMPORTANT: Reset sources for the new query

    try {
      // 1. Prepare chat history for the API payload
      const chatHistory = [...messages, newUserMessage].map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));

      const payload = {
        contents: chatHistory,
        systemInstruction: {
          parts: [{ text: SYSTEM_INSTRUCTION }]
        },
        // Include Google Search as a tool for grounding
        tools: [{ "google_search": {} }],
      };

      const response = await fetchWithRetry(`${API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      const candidate = result.candidates?.[0];

      let aiText = candidate?.content?.parts?.[0]?.text ||
                     "Sorry, I couldn't generate a response right now.";
      
      // Client-side cleanup to remove any remaining asterisks
      aiText = aiText.replace(/\*\*/g, '').replace(/\*/g, '');

      // Extract grounding sources from the response metadata
      let sources = [];
      const groundingMetadata = candidate?.groundingMetadata;
      if (groundingMetadata && groundingMetadata.groundingAttributions) {
          sources = groundingMetadata.groundingAttributions
              .map(attribution => ({
                  uri: attribution.web?.uri,
                  title: attribution.web?.title,
              }))
              .filter(source => source.uri && source.title); // Ensure sources are valid
      }
      setCitationSources(sources);

      const newAiMessage = { sender: 'Prayu', text: aiText };
      setMessages(prev => [...prev, newAiMessage]);

    } catch (error) {
      console.error('Error fetching from Gemini API:', error);
      setMessages(prev => [...prev, {
        sender: 'Prayu',
        text: "I'm having trouble connecting right now. Please try again soon."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = () => {
    if (mode === 'learning') {
      // Pass setMode down so the PromptGuide can potentially switch back (though we don't use it now)
      return <PromptLearningGuide setMode={setMode} />;
    }

    return (
      <>
        {/* Message Area */}
        <main className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {messages.map((msg, index) => (
            <MessageBubble key={index} sender={msg.sender} text={msg.text} />
          ))}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex items-center self-start mb-3">
              <div className="text-xs text-gray-500 mb-1 px-1 font-medium">Prayu</div>
              <div className="px-4 py-2 bg-emerald-50 text-emerald-900 rounded-xl rounded-tl-none shadow-lg">
                <Loader className="w-6 h-6 animate-spin text-indigo-600" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </main>

        {/* Citations Area */}
        {citationSources.length > 0 && (
          <div className="p-4 border-t border-gray-200 bg-gray-50 max-h-28 overflow-y-auto">
            <p className="text-xs font-semibold text-gray-700 mb-2">Sources:</p>
            <ul className="space-y-1">
              {citationSources.map((source, index) => (
                <li key={index} className="text-xs text-indigo-700 hover:text-indigo-900 truncate">
                  <a href={source.uri} target="_blank" rel="noopener noreferrer" className="flex items-center">
                    <ExternalLink className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate" title={source.title}>{source.title}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Input Area */}
        <footer className="p-4 bg-gray-100 border-t border-gray-200">
          <form onSubmit={handleSend} className="flex space-x-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              placeholder="Ask Prayu anything..."
              className="flex-1 p-3 border border-indigo-400 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 shadow-inner disabled:bg-gray-200 text-gray-900" // FIXED: Added text-gray-900 for visibility
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition duration-150 disabled:bg-indigo-300 disabled:cursor-not-allowed shadow-md"
              aria-label="Send message"
            >
              {isLoading ? (
                <Loader className="w-6 h-6 animate-spin" />
              ) : (
                <Send className="w-6 h-6 transform rotate-45" />
              )}
            </button>
          </form>
        </footer>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white shadow-2xl rounded-2xl flex flex-col h-[90vh] overflow-hidden">
        {/* Header */}
        <header className="p-4 bg-indigo-700 text-white shadow-md flex flex-col rounded-t-2xl">
          <h1 className="text-xl font-bold mb-2 flex items-center">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center mr-2">
              <Send className="w-4 h-4 text-indigo-700 transform rotate-45" />
            </div>
            Prayu: AI Chat
          </h1>
          {/* Mode Switcher Tabs */}
          <div className="flex space-x-2 mt-1">
            <button
              onClick={() => setMode('chat')}
              className={`flex items-center px-3 py-1 text-sm rounded-full transition-colors duration-200 ${
                mode === 'chat'
                  ? 'bg-white text-indigo-700 font-semibold shadow-md'
                  : 'text-indigo-200 hover:text-white hover:bg-indigo-600'
              }`}
            >
              <MessageSquare className="w-4 h-4 mr-1" />
              AI Chat
            </button>
            <button
              onClick={() => setMode('learning')}
              className={`flex items-center px-3 py-1 text-sm rounded-full transition-colors duration-200 ${
                mode === 'learning'
                  ? 'bg-white text-indigo-700 font-semibold shadow-md'
                  : 'text-indigo-200 hover:text-white hover:bg-indigo-600'
              }`}
            >
              <BookOpen className="w-4 h-4 mr-1" />
              Prompt Guide
            </button>
          </div>
        </header>
        
        {/* Content Area (Chat or Guide) */}
        <div className="flex-1 flex flex-col overflow-hidden">
            {renderContent()}
        </div>

      </div>
      {/* NOTE FOR NEXT.JS: 
        In a standard Next.js setup with Tailwind configured via postCSS, 
        you should remove this entire <style> block and rely on your global CSS 
        (e.g., globals.css) for Tailwind loading.
        It is kept here for max compatibility with a basic starter project.
      */}
      <style>{`
        /* Load Tailwind via CDN and inject it. This removes the need for local Tailwind setup. */
        @import url('https://cdn.tailwindcss.com');
        
        /* Custom scrollbar for better aesthetics */
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
        /* Inter font load (optional but good practice) */
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap');
        body {
            font-family: 'Inter', sans-serif;
        }
      `}</style>
    </div>
  );
}
