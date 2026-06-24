import { useState, useRef, useEffect } from "react";

const PSYCHOLOGISTS = [
  {
    id: 1,
    name: "Анна Соколова",
    title: "Психолог, КПТ-терапевт",
    experience: 8,
    specializations: ["тревога", "панические атаки", "депрессия", "самооценка", "стресс"],
    about: "Работаю с тревожными расстройствами и депрессией. Использую доказательные методы.",
    price: 3500,
    avatar: "АС",
    color: "#7C6FAB",
  },
  {
    id: 2,
    name: "Михаил Орлов",
    title: "Психотерапевт",
    experience: 12,
    specializations: ["травма", "ПТСР", "потеря", "отношения", "семья"],
    about: "Специализируюсь на травме и сложных жизненных ситуациях.",
    price: 4500,
    avatar: "МО",
    color: "#4A90A4",
  },
  {
    id: 3,
    name: "Елена Краснова",
    title: "Психолог, семейный терапевт",
    experience: 6,
    specializations: ["пары", "развод", "семья", "дети", "родительство"],
    about: "Помогаю парам и семьям найти взаимопонимание.",
    price: 3800,
    avatar: "ЕК",
    color: "#E8836A",
  },
  {
    id: 4,
    name: "Дмитрий Волков",
    title: "Психиатр, психотерапевт",
    experience: 15,
    specializations: ["депрессия", "биполярное", "ОКР", "СДВГ", "медикаменты"],
    about: "Психиатр с правом медикаментозного лечения. Работаю со сложными состояниями.",
    price: 5500,
    avatar: "ДВ",
    color: "#2D6A4F",
  },
  {
    id: 5,
    name: "Ксения Белова",
    title: "Психолог",
    experience: 4,
    specializations: ["тревога", "самооценка", "выгорание", "карьера", "смысл жизни"],
    about: "Работаю с молодёжью и вопросами поиска себя, выгорания и жизненных кризисов.",
    price: 2800,
    avatar: "КБ",
    color: "#B5838D",
  },
  {
    id: 6,
    name: "Максим Коцюба",
    title: "Психолог",
    experience: 20,
    specializations: ["депрессия", "тревога", "ПТСР", "стресс", "травма"],
    about: "20 лет практики. Помогаю людям выйти из тёмных периодов жизни.",
    price: 4000,
    avatar: "МК",
    photo: null,
    color: "#3D7A5E",
  },
];

const QUICK_CHIPS = [
  { label: "😟 Тревога и стресс", text: "Меня беспокоит постоянная тревога и стресс" },
  { label: "😔 Депрессия", text: "У меня подавленное настроение, возможно депрессия" },
  { label: "💔 Проблемы в отношениях", text: "Есть проблемы в отношениях или с партнёром" },
  { label: "😴 Выгорание", text: "Чувствую выгорание, нет сил и мотивации" },
  { label: "😨 Травма или ПТСР", text: "Пережил(а) травматичные события, не могу справиться" },
  { label: "👨‍👩‍👧 Семья и дети", text: "Сложности в семье или с воспитанием детей" },
];

const SYSTEM_PROMPT = `Ты — ИИ-ассистент сервиса PsyMatch для подбора психологов. Отвечай коротко и тепло — не более 3-4 предложений.

База специалистов:
${JSON.stringify(PSYCHOLOGISTS)}

Правила:
1. Поприветствуй кратко и спроси о проблеме
2. Задавай по 1-2 уточняющих вопроса
3. После 2-3 обменов — порекомендуй специалиста
4. При рекомендации добавь тег: <MATCH>{"ids": [ID]}</MATCH>
5. Не ставь диагнозы. Будь тёплым.
6. Отвечай только на русском языке`;

export default function PsyMatch() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [matchedIds, setMatchedIds] = useState([]);
  const [started, setStarted] = useState(false);
  const [view, setView] = useState("chat");
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const callClaude = async (msgs) => {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: msgs, system: SYSTEM_PROMPT }),
    });
    const data = await res.json();
    const text = data.content?.map(b => b.text || "").join("") || "";
    const matchResult = text.match(/<MATCH>(.*?)<\/MATCH>/s);
    if (matchResult) {
      try {
        const parsed = JSON.parse(matchResult[1]);
        setMatchedIds(parsed.ids || []);
        setTimeout(() => setView("results"), 600);
      } catch {}
    }
    return text.replace(/<MATCH>.*?<\/MATCH>/s, "").trim();
  };

  const runChat = async (history, userContent) => {
    setLoading(true);
    const msgs = [...history, { role: "user", content: userContent }];
    try {
      const reply = await callClaude(msgs);
      setMessages(prev => [...prev, { role: "user", content: userContent }, { role: "assistant", content: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: "user", content: userContent }, { role: "assistant", content: "Упс, что-то пошло не так. Попробуй ещё раз 🙏" }]);
    }
    setLoading(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const startChat = () => {
    setStarted(true);
    setLoading(true);
    callClaude([{ role: "user", content: "Привет" }])
      .then(reply => { setMessages([{ role: "assistant", content: reply }]); setLoading(false); })
      .catch(() => { setMessages([{ role: "assistant", content: "Привет! Расскажи, что тебя беспокоит 🌿" }]); setLoading(false); });
  };

  const sendMessage = (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput("");
    const history = messages.map(m => ({ role: m.role, content: m.content }));
    runChat(history, msg);
  };

  const matched = PSYCHOLOGISTS.filter(p => matchedIds.includes(p.id));

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", minHeight: "100vh", background: "#F7F5F2" }}>
      <header style={{
        background: "white", borderBottom: "1px solid #EBEBEB",
        padding: "0 24px", height: 60,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, background: "linear-gradient(135deg, #7C6FAB, #4A90A4)",
            borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
            color: "white", fontSize: 16,
          }}>🌿</div>
          <span style={{ fontWeight: 700, fontSize: 18, color: "#1A1A2E" }}>PsyMatch</span>
        </div>
        {view === "results" && (
          <button onClick={() => setView("chat")} style={{
            background: "none", border: "1px solid #DDDAFF", borderRadius: 8,
            padding: "6px 14px", cursor: "pointer", color: "#7C6FAB", fontSize: 14,
          }}>← Вернуться к чату</button>
        )}
      </header>

      {!started && (
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "70px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🌿</div>
          <h1 style={{ fontSize: 34, fontWeight: 800, color: "#1A1A2E", margin: "0 0 14px", lineHeight: 1.2 }}>
            Найди своего<br />психолога
          </h1>
          <p style={{ color: "#6B7280", fontSize: 16, lineHeight: 1.6, marginBottom: 32 }}>
            ИИ задаст несколько вопросов и подберёт специалиста именно для тебя
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", marginBottom: 32 }}>
            {QUICK_CHIPS.map(chip => (
              <button key={chip.label} onClick={() => { setStarted(true); setTimeout(() => runChat([], chip.text), 0); }} style={{
                background: "white", border: "1px solid #E5E7EB", borderRadius: 20,
                padding: "8px 16px", fontSize: 14, cursor: "pointer", color: "#374151",
              }}>{chip.label}</button>
            ))}
          </div>
          <button onClick={startChat} style={{
            background: "linear-gradient(135deg, #7C6FAB, #4A90A4)",
            color: "white", border: "none", borderRadius: 14,
            padding: "14px 32px", fontSize: 16, fontWeight: 600,
            cursor: "pointer", boxShadow: "0 4px 20px rgba(124,111,171,0.3)",
          }}>Описать своё состояние →</button>
          <p style={{ color: "#9CA3AF", fontSize: 13, marginTop: 12 }}>Бесплатно · Анонимно · 2 минуты</p>
        </div>
      )}

      {started && view === "chat" && (
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "20px 16px 0", display: "flex", flexDirection: "column", height: "calc(100vh - 60px)" }}>
          <div style={{ flex: 1, overflowY: "auto", paddingBottom: 12 }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", marginBottom: 10 }}>
                <div style={{
                  maxWidth: "78%",
                  background: msg.role === "user" ? "linear-gradient(135deg, #7C6FAB, #4A90A4)" : "white",
                  color: msg.role === "user" ? "white" : "#1A1A2E",
                  padding: "11px 15px",
                  borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  fontSize: 15, lineHeight: 1.55, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", whiteSpace: "pre-wrap",
                }}>{msg.content}</div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 10 }}>
                <div style={{ background: "white", padding: "14px 18px", borderRadius: "18px 18px 18px 4px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", display: "flex", gap: 5 }}>
                  {[0,1,2].map(i => (
                    <span key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#C4B5FD", display: "inline-block", animation: `bounce 1s ease-in-out ${i*0.2}s infinite` }}/>
                  ))}
                </div>
              </div>
            )}
            {messages.length === 1 && !loading && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                {QUICK_CHIPS.map(chip => (
                  <button key={chip.label} onClick={() => sendMessage(chip.text)} style={{
                    background: "white", border: "1px solid #E5E7EB", borderRadius: 20,
                    padding: "7px 14px", fontSize: 13, cursor: "pointer", color: "#6B7280",
                  }}>{chip.label}</button>
                ))}
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <div style={{ paddingTop: 10, paddingBottom: 16, borderTop: "1px solid #EBEBEB" }}>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendMessage()}
                placeholder="Напиши что тебя беспокоит..."
                disabled={loading}
                style={{ flex: 1, padding: "12px 16px", borderRadius: 12, border: "1px solid #E5E7EB", fontSize: 15, outline: "none", background: "white", opacity: loading ? 0.6 : 1 }}
              />
              <button onClick={() => sendMessage()} disabled={!input.trim() || loading} style={{
                background: "linear-gradient(135deg, #7C6FAB, #4A90A4)",
                color: "white", border: "none", borderRadius: 12, width: 48,
                cursor: "pointer", fontSize: 20, opacity: !input.trim() || loading ? 0.4 : 1,
              }}>→</button>
            </div>
          </div>
        </div>
      )}

      {view === "results" && (
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "32px 16px" }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: "#1A1A2E", marginBottom: 8 }}>Мы подобрали для тебя</h2>
          <p style={{ color: "#6B7280", marginBottom: 24 }}>ИИ выбрал подходящих специалистов на основе твоего запроса</p>
          {matched.map(p => (
            <div key={p.id} style={{ background: "white", borderRadius: 20, padding: 24, marginBottom: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "2px solid transparent", transition: "border-color 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = p.color}
              onMouseLeave={e => e.currentTarget.style.borderColor = "transparent"}
            >
              <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: p.color, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16, flexShrink: 0, overflow: "hidden" }}>
                  {p.photo ? <img src={p.photo} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : p.avatar}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 17, color: "#1A1A2E" }}>{p.name}</div>
                      <div style={{ color: "#6B7280", fontSize: 14 }}>{p.title} · {p.experience} лет опыта</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 700, color: p.color, fontSize: 16 }}>{p.price.toLocaleString()} ₽</div>
                      <div style={{ color: "#9CA3AF", fontSize: 12 }}>за сессию</div>
                    </div>
                  </div>
                  <p style={{ color: "#4B5563", fontSize: 14, margin: "10px 0", lineHeight: 1.5 }}>{p.about}</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                    {p.specializations.slice(0, 4).map(s => (
                      <span key={s} style={{ background: `${p.color}15`, color: p.color, padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 500 }}>{s}</span>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button style={{ background: p.color, color: "white", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer", flex: 1 }}>Записаться</button>
                    <button style={{ background: "none", border: `1px solid ${p.color}`, color: p.color, borderRadius: 10, padding: "10px 16px", fontSize: 14, cursor: "pointer" }}>Профиль</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          <button onClick={() => { setView("chat"); setMatchedIds([]); }} style={{ width: "100%", padding: "14px", borderRadius: 12, border: "1px dashed #D1D5DB", background: "none", color: "#6B7280", fontSize: 15, cursor: "pointer", marginTop: 8 }}>
            Не подошло? Уточнить запрос
          </button>
        </div>
      )}

      <style>{`
        @keyframes bounce { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-5px); } }
        * { box-sizing: border-box; }
        body { margin: 0; }
      `}</style>
    </div>
  );
}
