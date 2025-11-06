// Kanban-CRM-Deals.jsx
// Single-file React component (default export) built for a Tailwind-based app.
// Dependencies you should install in your project to run this file:
// - react
// - react-dom
// - tailwindcss (already configured)
// - @hello-pangea/dnd  (or react-beautiful-dnd; code uses @hello-pangea/dnd API)
// - framer-motion (optional, included for subtle animations)

// Features:
// - Kanban columns (Prospects, Negotiation, Won, Lost)
// - Drag & drop to move deals between columns
// - Add/Edit deals, quick inline edit
// - Confetti animation when a deal is moved to "Won"
// - Fancy shimmering CSS, hover card effects, animated badges
// - Search, filters, and sorting controls

import React, { useState, useEffect, useRef } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { motion } from "framer-motion";

const initialData = {
  columns: {
    prospects: {
      id: "prospects",
      title: "Prospects",
      deals: [
        { id: "d1", title: "Acme Corp", value: 5200, owner: "Meera", note: "Follow up after demo" },
        { id: "d2", title: "BlueWave", value: 12000, owner: "Arjun", note: "Pricing discussion" },
      ],
    },
    negotiation: {
      id: "negotiation",
      title: "Negotiation",
      deals: [
        { id: "d3", title: "GreenFields", value: 4200, owner: "Ravi", note: "Send revised proposal" },
      ],
    },
    won: {
      id: "won",
      title: "Won",
      deals: [],
    },
    lost: {
      id: "lost",
      title: "Lost",
      deals: [],
    },
  },
};

export default function KanbanCRM() {
  const [data, setData] = useState(initialData);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("value_desc");
  const [newDeal, setNewDeal] = useState({ title: "", value: "", owner: "", col: "prospects" });
  const confettiRef = useRef(null);

  useEffect(() => {
    // small mount shimmer
    document.title = "Kanban CRM — Deals";
  }, []);

  function addDeal(e) {
    e.preventDefault();
    if (!newDeal.title.trim()) return;
    const id = "d" + Math.random().toString(36).slice(2, 9);
    const deal = { id, title: newDeal.title.trim(), value: parseFloat(newDeal.value) || 0, owner: newDeal.owner || "—", note: "" };
    setData((prev) => {
      const col = prev.columns[newDeal.col];
      return { ...prev, columns: { ...prev.columns, [newDeal.col]: { ...col, deals: [deal, ...col.deals] } } };
    });
    setNewDeal({ title: "", value: "", owner: "", col: "prospects" });
  }

  function onDragEnd(result) {
    const { source, destination } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    setData((prev) => {
      const sourceCol = prev.columns[source.droppableId];
      const destCol = prev.columns[destination.droppableId];
      const sourceDeals = Array.from(sourceCol.deals);
      const [moved] = sourceDeals.splice(source.index, 1);
      const destDeals = Array.from(destCol.deals);
      destDeals.splice(destination.index, 0, moved);

      const newColumns = {
        ...prev.columns,
        [source.droppableId]: { ...sourceCol, deals: sourceDeals },
        [destination.droppableId]: { ...destCol, deals: destDeals },
      };

      // trigger confetti if moved to won
      if (destination.droppableId === "won" && source.droppableId !== "won") {
        triggerConfetti();
      }

      return { ...prev, columns: newColumns };
    });
  }

  function triggerConfetti() {
    // Simple DOM confetti — creates colorful span elements and animates them
    const colors = ["#FF577F", "#FFD166", "#06D6A0", "#4D96FF", "#C77DFF"];
    const count = 80;
    const container = document.createElement("div");
    container.className = "fixed inset-0 pointer-events-none z-50 overflow-hidden";
    document.body.appendChild(container);

    for (let i = 0; i < count; i++) {
      const el = document.createElement("span");
      const size = Math.random() * 10 + 6;
      el.style.width = size + "px";
      el.style.height = size + "px";
      el.style.background = colors[Math.floor(Math.random() * colors.length)];
      el.style.position = "absolute";
      el.style.left = Math.random() * 100 + "%";
      el.style.top = "-10%";
      el.style.opacity = Math.random() * 0.9 + 0.4;
      el.style.transform = `translateY(0) rotate(${Math.random() * 360}deg)`;
      el.style.borderRadius = Math.random() > 0.5 ? "2px" : "50%";
      el.style.transition = `transform 1.6s cubic-bezier(.2,.8,.2,1), top 1.6s cubic-bezier(.2,.8,.2,1), opacity 1.8s`;
      container.appendChild(el);
      // force layout then animate
      requestAnimationFrame(() => {
        const travel = window.innerHeight + Math.random() * 300;
        el.style.top = travel + "px";
        el.style.transform = `translateY(0) rotate(${(Math.random() - 0.5) * 720}deg) translateX(${(Math.random() - 0.5) * 200}px)`;
        el.style.opacity = "0";
      });
    }

    setTimeout(() => {
      container.remove();
    }, 1800);
  }

  function quickEdit(colId, idx, key, value) {
    setData((prev) => {
      const col = prev.columns[colId];
      const deals = col.deals.map((d, i) => (i === idx ? { ...d, [key]: value } : d));
      return { ...prev, columns: { ...prev.columns, [colId]: { ...col, deals } } };
    });
  }

  function deleteDeal(colId, idx) {
    setData((prev) => {
      const col = prev.columns[colId];
      const deals = col.deals.filter((_, i) => i !== idx);
      return { ...prev, columns: { ...prev.columns, [colId]: { ...col, deals } } };
    });
  }

  function filteredDeals(col) {
    let deals = [...col.deals];
    if (query.trim()) {
      const q = query.toLowerCase();
      deals = deals.filter((d) => d.title.toLowerCase().includes(q) || (d.owner || "").toLowerCase().includes(q));
    }
    if (sortBy === "value_asc") deals.sort((a, b) => a.value - b.value);
    if (sortBy === "value_desc") deals.sort((a, b) => b.value - a.value);
    if (sortBy === "title_asc") deals.sort((a, b) => a.title.localeCompare(b.title));
    return deals;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100 p-6">
      <style>{`
        /* extra local CSS for shiny effects and confetti animations */
        .glow {
          background: linear-gradient(90deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02));
          box-shadow: 0 8px 30px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.02);
        }
        .shimmer {
          background-image: linear-gradient(90deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.02) 100%);
          background-size: 200% 100%;
          animation: shimmer 3s linear infinite;
        }
        @keyframes shimmer { 0% { background-position: -200% 0 } 100% { background-position: 200% 0 } }
        .card-float { transform: translateZ(0); transition: transform 220ms cubic-bezier(.2,.9,.3,1), box-shadow 220ms; }
        .card-float:hover { transform: translateY(-8px) scale(1.01); box-shadow: 0 20px 50px rgba(2,6,23,0.6); }
      `}</style>

      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-3">
            <span className="inline-block w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 via-fuchsia-500 to-rose-400 shadow-xl flex items-center justify-center transform-gpu animate-[spin_10s_linear_infinite]">🤝</span>
            Kanban CRM — Deals
          </h1>
          <p className="text-sm text-slate-300 mt-1">Drag & drop deals between stages. Move to "Won" for confetti 🎉</p>
        </div>

        <div className="flex items-center gap-3">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search deals or owners..." className="px-3 py-2 rounded-md bg-slate-800 border border-slate-700 placeholder:text-slate-400 focus:outline-none" />
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-3 py-2 rounded-md bg-slate-800 border border-slate-700">
            <option value="value_desc">Sort: Value ↓</option>
            <option value="value_asc">Sort: Value ↑</option>
            <option value="title_asc">Sort: Title A→Z</option>
          </select>
        </div>
      </header>

      <main>
  <section className="mb-4 grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
    {/* 📝 Left Side — Add Deal Form */}
    <form
      onSubmit={addDeal}
      className="p-4 rounded-2xl glow shimmer border border-slate-700 flex flex-wrap lg:flex-nowrap gap-3 items-center col-span-2 w-full"
    >
      <input
        className="px-3 py-2 rounded-md bg-transparent border border-slate-700 flex-1 min-w-[120px]"
        placeholder="Deal title"
        value={newDeal.title}
        onChange={(e) =>
          setNewDeal((s) => ({ ...s, title: e.target.value }))
        }
      />
      <input
        className="px-3 py-2 rounded-md bg-transparent border border-slate-700 w-28"
        placeholder="Value"
        value={newDeal.value}
        onChange={(e) =>
          setNewDeal((s) => ({ ...s, value: e.target.value }))
        }
      />
      <input
        className="px-3 py-2 rounded-md bg-transparent border border-slate-700 w-32"
        placeholder="Owner"
        value={newDeal.owner}
        onChange={(e) =>
          setNewDeal((s) => ({ ...s, owner: e.target.value }))
        }
      />
      <select
        className="px-3 py-2 rounded-md bg-transparent border border-slate-700"
        value={newDeal.col}
        onChange={(e) =>
          setNewDeal((s) => ({ ...s, col: e.target.value }))
        }
      >
        {Object.values(data.columns).map((c) => (
          <option key={c.id} value={c.id} className="bg-gray-900 text-white">
            {c.title}
          </option>
        ))}
      </select>
      <button className="ml-auto px-4 py-2 rounded-xl bg-emerald-500 text-slate-900 font-semibold shadow hover:scale-105 transition transform">
        Add
      </button>
    </form>

    {/* 📊 Right Side — Total & Pipeline */}
    <div className="p-4 rounded-2xl glow border border-slate-700 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 col-span-1 w-full">
      <div className="text-sm text-slate-300">
        Total:
        <span className="font-semibold text-slate-100 ml-1">
          {Object.values(data.columns).reduce(
            (a, c) => a + c.deals.length,
            0
          )}
        </span>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-xs px-3 py-1 rounded-full bg-slate-800">
          📅 Due soon
        </div>
        <div className="text-xs px-3 py-1 rounded-full bg-slate-800">
          📊 Pipeline health
        </div>
      </div>
    </div>
  </section>

  {/* 🧲 Kanban Board */}
  <DragDropContext onDragEnd={onDragEnd}>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {Object.values(data.columns).map((col) => (
        <Droppable key={col.id} droppableId={col.id}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`p-3 rounded-2xl border ${
                snapshot.isDraggingOver
                  ? "ring-4 ring-indigo-600/30"
                  : "border-slate-700"
              } bg-gradient-to-b from-slate-800/60 to-slate-900/40`}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-700 text-sm">
                    {col.deals.length}
                  </span>
                  {col.title}
                </h3>
                <div className="flex items-center gap-2">
                  {col.id === "won" && (
                    <div className="px-2 py-1 text-xs rounded-full bg-amber-500 text-slate-900">
                      Celebrate
                    </div>
                  )}
                  {col.id === "lost" && (
                    <div className="px-2 py-1 text-xs rounded-full bg-rose-600 text-slate-100">
                      Closed lost
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3 min-h-[120px]">
                {filteredDeals(col).map((deal, idx) => (
                  <Draggable key={deal.id} draggableId={deal.id} index={idx}>
                    {(providedDrag, snapDrag) => (
                      <motion.div
                        layout
                        whileHover={{ scale: 1.01 }}
                        ref={providedDrag.innerRef}
                        {...providedDrag.draggableProps}
                        {...providedDrag.dragHandleProps}
                        className={`card-float p-3 rounded-xl border border-slate-700 bg-gradient-to-r from-slate-800/40 to-slate-900/30 ${
                          snapDrag.isDragging ? "opacity-90 shadow-2xl" : ""
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-indigo-400 to-indigo-600 text-slate-900 font-bold">
                            {deal.title.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between gap-3">
                              <div className="font-semibold">{deal.title}</div>
                              <div className="text-sm font-semibold">
                                ₹ {deal.value.toLocaleString()}
                              </div>
                            </div>
                            <div className="text-xs text-slate-400 mt-1">
                              Owner:{" "}
                              <span className="text-slate-200 font-medium">
                                {deal.owner}
                              </span>
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                              <input
                                className="px-2 py-1 bg-slate-800 rounded-md text-xs border border-slate-700"
                                value={deal.note}
                                onChange={(e) =>
                                  quickEdit(
                                    col.id,
                                    idx,
                                    "note",
                                    e.target.value
                                  )
                                }
                                placeholder="Quick note..."
                              />
                              <button
                                className="px-2 py-1 rounded-md bg-yellow-500 text-slate-900 text-xs"
                                onClick={() => {
                                  quickEdit(
                                    col.id,
                                    idx,
                                    "title",
                                    prompt("Edit title:", deal.title) ||
                                      deal.title
                                  );
                                }}
                              >
                                Edit
                              </button>
                              <button
                                className="px-2 py-1 rounded-md bg-rose-600 text-white text-xs"
                                onClick={() => deleteDeal(col.id, idx)}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </Draggable>
                ))}

                {provided.placeholder}
              </div>
            </div>
          )}
        </Droppable>
      ))}
    </div>
  </DragDropContext>
</main>

      <footer className="mt-8 text-sm text-slate-400">Built with ❤️ — drag cards to try it out. </footer>
    </div>
  );
}
