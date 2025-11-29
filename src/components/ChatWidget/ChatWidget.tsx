import React, { useEffect, useRef, useState } from "react";
import { FaPaperPlane, FaComments } from "react-icons/fa";
import "./ChatWidget.css";

const ChatWidget: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{ from: string; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const messagesEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ws.current = new WebSocket("ws://localhost:5000");

    ws.current.onmessage = (event) => {
      setIsTyping(false);
      const msg = JSON.parse(event.data);
      setMessages((prev) => [...prev, msg]);
    };

    ws.current.onopen = () => {
      ws.current?.send("👋 Привет! Я ассистент MegaMart, помогу вам с выбором товаров.");
      setMessages([
        { from: "bot", text: "👋 Привет! Я ассистент MegaMart. Чем могу помочь?" },
      ]);
    };

    return () => ws.current?.close();
  }, []);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (input.trim() && ws.current?.readyState === WebSocket.OPEN) {
      const text = input.trim();
      ws.current.send(text);
      setMessages((prev) => [...prev, { from: "user", text }]);
      setInput("");
      setIsTyping(true);
    }
  };

  return (
    <div className="chat-widget">
      {!open && (
        <button className="chat-toggle" onClick={() => setOpen(true)}>
          <FaComments />
        </button>
      )}

      {open && (
        <div className="chat-window">
          <div className="chat-header">
            <div className="bot-info">
              <img src="/bot-avatar.png" alt="AI" className="bot-avatar" />
              <span>MegaBot</span>
            </div>
            <button onClick={() => setOpen(false)}>×</button>
          </div>

          <div className="chat-body">
            {messages.map((m, i) => (
              <div key={i} className={`chat-msg ${m.from}`}>
                <div className="msg-bubble">{m.text}</div>
              </div>
            ))}
            {isTyping && (
              <div className="chat-msg bot typing">
                <div className="typing-indicator">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
            <div ref={messagesEnd} />
          </div>

          <div className="chat-input">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Напишите сообщение..."
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button onClick={sendMessage}>
              <FaPaperPlane />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWidget;
