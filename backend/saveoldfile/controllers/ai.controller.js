import axios from "axios";

export const getAIAdvice = async (req, res) => {
  try {
    // 🔹 Frontend dono type bhej sakta hai
    const { prompt, receive = 0, pay = 0 } = req.body;

    const net = receive - pay;

    // 🔴 FIX: Backend me REACT_APP_ ❌
    const API_KEY = process.env.GEMINI_API_KEY;

    /* 🟡 CASE 1: World Question (Chatbot mode) */
    if (prompt) {
      if (!API_KEY) {
        return res.json({
          success: true,
          reply: `Aapne poocha: "${prompt}". Abhi AI connect nahi hai 🙂`
        });
      }

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
        {
          contents: [{ parts: [{ text: prompt }] }]
        }
      );

      const aiReply =
        response.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "AI se jawab nahi mila.";

      return res.json({
        success: true,
        reply: aiReply
      });
    }

    /* 🟢 CASE 2: Business Advice Mode (OLD logic preserved) */
    if (!API_KEY) {
      let staticAdvice = "Business stable hai 🙂";
      if (net < 0) staticAdvice = "⚠️ Payable zyada hai, receivable fast collect karo 💰";
      else if (net > 0) staticAdvice = "✅ Cash flow acha hai, smart reinvestment socho 🚀";

      return res.json({
        success: true,
        reply: staticAdvice,
        net
      });
    }

    const businessPrompt = `
      Business: Dhara Shakti Agro.
      Receivables ₹${receive}, Payables ₹${pay}, Net ₹${net}.
      Task: Hinglish mein short financial advice do (2 lines, emojis).
    `;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
      {
        contents: [{ parts: [{ text: businessPrompt }] }]
      }
    );

    const aiReply =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "AI advice nahi mil pa rahi.";

    return res.json({
      success: true,
      receive,
      pay,
      net,
      reply: aiReply
    });

  } catch (error) {
    console.error("AI Controller Error:", error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      reply: "⚠️ AI service thodi der mein try karein."
    });
  }
};
