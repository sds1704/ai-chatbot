import { useState, useRef, useEffect } from "react";
import axios from "axios";
import ChatMessage from "./components/ChatMessage";
import ChatForm from "./components/ChatForm";
import ChatbotIcon from "./components/ChatbotIcon";

const App = () => {
  const [chatHistory, setChatHistory] = useState([]);
  const [showChatbot, setShowChatbot] = useState(false);
  const chatBodyRef = useRef();

  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const generateBotResponse = async (history) => {
    const updateHistory = (text) => {
      setChatHistory((prev) => [
        ...prev.filter((msg) => msg.text !== "Thinking..."),
        { role: "model", text },
      ]);
    };

    const contents = history.map(({ role, text }) => ({
      role: role === "model" ? "model" : "user",
      parts: [{ text }],
    }));

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
      updateHistory("Gemini API key is missing. Check your .env file.");
      return;
    }

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await axios.post(
          "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
          { contents },
          {
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": apiKey,
            },
            timeout: 60000,
          }
        );

        const botText = response.data.candidates?.[0]?.content?.parts
          ?.map((part) => part.text || "")
          .join("")
          .trim();

        if (!botText) {
          updateHistory("The API returned no text. Please try again.");
          return;
        }

        updateHistory(botText);
        return;
      } catch (error) {
        const status = error.response?.status;
        const details = error.response?.data?.error?.message;

        console.error("Gemini API error:", {
          status,
          message: details || error.message,
        });

        const retryable =
          !status || status === 429 || status === 500 ||
          status === 502 || status === 503 || status === 504;

        if (!retryable || attempt === 2) {
          updateHistory(
            status === 503
              ? "Gemini is temporarily unavailable. Please try again in a minute."
              : `Unable to get a response: ${details || error.message}`
          );
          return;
        }

        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * 2 ** attempt)
        );
      }
    }
  };

  return (
    <div className={`container ${showChatbot ? "show" : ""}`}>
      <button
        onClick={() => setShowChatbot((prev) => !prev)}
        id="chatbot-toggler"
      >
        <span className="material-symbols-rounded">
          {showChatbot ? "close" : "mode_comment"}
        </span>
      </button>

      <div className="chatbot-popup">
        <div className="chat-header">
          <div className="header-info">
            <ChatbotIcon />
            <div>
              <h3>AI Assistant</h3>
              <p>Online</p>
            </div>
          </div>
          <button onClick={() => setShowChatbot(false)}>
            <span className="material-symbols-rounded">keyboard_arrow_down</span>
          </button>
        </div>

        <div className="chat-body" ref={chatBodyRef}>
          {chatHistory.length === 0 ? (
            <ChatMessage
              chat={{ role: "model", text: "Hello! How can I help you today?" }}
            />
          ) : (
            chatHistory.map((chat, index) => (
              <ChatMessage key={index} chat={chat} />
            ))
          )}
        </div>

        <div className="chat-footer">
          <ChatForm
            chatHistory={chatHistory}
            setChatHistory={setChatHistory}
            generateBotResponse={generateBotResponse}
          />
        </div>
      </div>
    </div>
  );
};

export default App;