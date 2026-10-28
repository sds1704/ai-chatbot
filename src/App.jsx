
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
          timeout: 30000,
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
