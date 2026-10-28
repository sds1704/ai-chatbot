import { useEffect, useState, useRef } from "react";
import ChatbotIcon from "./components/ChatbotIcon.jsx";
import ChatForm from "./components/ChatForm.jsx";
import ChatMessage from "./components/ChatMessage.jsx";
import axios from "axios";

const App = () => {
  const [chatHistory, setChatHistory] = useState([]);
  const [showChatbot, setShowChatbot] = useState(false);
  const chatBodyRef = useRef();
  const generateBotResponse = async (history) => {

    const updateHistory =(text) =>{
      setChatHistory((prev) => [...prev.filter(msg=>msg.text !=="Thinking..."),{role:"model",text}]);
    }


    try {

    history = history.map(({ role, text }) => ({role,parts:[{text}]}));

      const response = await axios.post(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
        { contents: history },
        {
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": import.meta.env.VITE_GEMINI_API_KEY,
          },
        }
      );
  
      const botText = response.data.candidates[0]?.content?.parts[0]?.text.trim();
      updateHistory(botText);

    } catch (error) {
      console.error("Error generating bot response:", error);
    }
  };

  useEffect(() => {
    // Scroll to the bottom of the chat body when new messages are added
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTo({
        top: chatBodyRef.current.scrollHeight, 
        behavior: "smooth"
      });
    }
  }, [chatHistory]);

  return (
    <>
      {/* Centered welcome message */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '100%',
        textAlign: 'center',
        fontSize: '2.4rem',
        color: '#6d4fc2',
        fontWeight: 700,
        letterSpacing: '0.5px',
        zIndex: 10,
        pointerEvents: 'none', 
      }}>
        Welcome to the AI ChatBot Demo!<br/>
        Ask anything, get instant answers.
      </div>
      <div className={`container ${showChatbot ? 'show' : ''}`}>
        <button onClick={() => setShowChatbot(!showChatbot)} id="chatbot-toggler">
          <span className="material-symbols-rounded">
            {showChatbot ? 'close' : 'mode_comment'}
          </span>
        </button>
        <div className={`chatbot-popup `}>
          {/* Chatbot Header */}
          <div className="chat-header">
            <div className="header-info">
              <ChatbotIcon />
              <h3>ChatBot</h3>
              <p>Online</p>
            </div>
            <button 
              onClick={() => setShowChatbot(false)} 
              className="material-symbols-rounded"
            >
              close
            </button>
          </div>
          {/* Chatbot Body */}
          <div ref={chatBodyRef} className="chat-body">
            <div className="message bot-message">
              {/* Messages will appear here */}
              <ChatbotIcon></ChatbotIcon>
              <p className="message-text">
                Hey there 🧐 <br /> How can I assist you today?
              </p>
            </div>

            {/* Chat History */}
            {chatHistory.map((chat, index) => (
              <ChatMessage key={index} chat={chat} />
            ))}
          </div>
          {/* Chatbot Footer */}
          <div className="chat-footer">
            <ChatForm
              chatHistory={chatHistory}
              setChatHistory={setChatHistory}
              generateBotResponse={generateBotResponse}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default App;
