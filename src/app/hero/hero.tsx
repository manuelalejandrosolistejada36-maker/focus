'use client';

import { useState, useEffect, useRef } from 'react';

// Tipos para las metas
type Goal = {
  id: string;
  text: string;
  time?: string;
  completed: boolean;
};

// Mapa de días a lista de metas
type MonthGoals = Record<number, Goal[]>;

export default function Hero() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [goalsMap, setGoalsMap] = useState<MonthGoals>({});
  const [selectedDay, setSelectedDay] = useState<number | null>(null); // Día seleccionado para el modal
  const [isClient, setIsClient] = useState(false);
  
  // Estado para la nueva meta en el modal
  const [newGoalText, setNewGoalText] = useState('');
  const [newGoalTime, setNewGoalTime] = useState('');

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const modalInputRef = useRef<HTMLInputElement>(null);

  // Calcular días en el mes actual
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  
  // Helper para persistencia (clave por mes)
  const getStorageKey = (date: Date) => `goals-${date.getFullYear()}-${date.getMonth()}`;

  // Verificar si es el día actual del sistema
  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Cargar metas cuando cambia la fecha
  useEffect(() => {
    if (!isClient) return;
    const key = getStorageKey(currentDate);
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        setGoalsMap(JSON.parse(saved));
      } catch (e) {
        setGoalsMap({});
      }
    } else {
        setGoalsMap({});
    }
  }, [currentDate, isClient]);

  // Guardar metas
  const saveGoals = (newGoalsMap: MonthGoals) => {
      setGoalsMap(newGoalsMap);
      localStorage.setItem(getStorageKey(currentDate), JSON.stringify(newGoalsMap));
  };

  // Manejo de Fechas
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.value) return;
      const [year, month] = e.target.value.split('-').map(Number);
      setCurrentDate(new Date(year, month - 1, 1));
  };

  // --- Lógica del Modal / Metas ---

  const openDayModal = (day: number) => {
    setSelectedDay(day);
    setTimeout(() => {
        modalInputRef.current?.focus();
    }, 100);
  };

  const closeModal = () => {
    setSelectedDay(null);
    setNewGoalText('');
    setNewGoalTime('');
  };

  const addGoal = () => {
    if (!newGoalText.trim() || selectedDay === null) return;
    
    const newGoal: Goal = {
        id: crypto.randomUUID(),
        text: newGoalText.trim(),
        time: newGoalTime,
        completed: false
    };

    const currentDayGoals = goalsMap[selectedDay] || [];
    const newGoalsMap = {
        ...goalsMap,
        [selectedDay]: [...currentDayGoals, newGoal]
    };

    saveGoals(newGoalsMap);
    setNewGoalText('');
    setNewGoalTime('');
  };

  const toggleGoal = (day: number, goalId: string) => {
      const currentDayGoals = goalsMap[day] || [];
      const updatedGoals = currentDayGoals.map(g => 
          g.id === goalId ? { ...g, completed: !g.completed } : g
      );
      
      saveGoals({
          ...goalsMap,
          [day]: updatedGoals
      });
  };

  const deleteGoal = (day: number, goalId: string) => {
      const currentDayGoals = goalsMap[day] || [];
      const updatedGoals = currentDayGoals.filter(g => g.id !== goalId);
      
      saveGoals({
          ...goalsMap,
          [day]: updatedGoals
      });
  };

  const getDayProgress = (day: number) => {
      const goals = goalsMap[day];
      if (!goals || goals.length === 0) return 'empty';
      if (goals.every(g => g.completed)) return 'completed';
      return 'in-progress';
  };

  // Textos y formatos
  const monthInputValue = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  const displayDate = currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  const capitalizedDate = displayDate.charAt(0).toUpperCase() + displayDate.slice(1);

  if (!isClient) return <div className="min-h-screen bg-black" />;

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-[#30D158] selection:text-black flex flex-col items-center pt-10 sm:pt-20 px-4 pb-10">
      
      {/* Header */}
      <header className="w-full max-w-[400px] mb-8 flex flex-col items-center text-center">
        <div 
            className="relative group cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-full hover:bg-[#1C1C1E] transition-all duration-300"
            onClick={() => inputRef.current?.showPicker()}
        >
          <h1 className="text-2xl font-semibold tracking-tight">{capitalizedDate}</h1>
          <span className="text-[#666666] text-xs">▼</span>
          <input 
              ref={inputRef}
              type="month" 
              value={monthInputValue}
              onChange={handleDateChange}
              className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
          />
        </div>
        <p className="text-[#666666] text-sm mt-2 font-medium tracking-wide">Tus hábitos, día a día.</p>
      </header>

      {/* Calendar Grid */}
      <div className="w-full max-w-[400px] grid grid-cols-7 gap-2 sm:gap-3">
        {/* Días de la semana (opcional, solo iniciales) */}
        {['D', 'L', 'M', 'X', 'J', 'V', 'S'].map(d => (
            <div key={d} className="text-center text-[#3a3a3c] text-xs font-bold mb-2">{d}</div>
        ))}

        {/* Padding para el primer día del mes */}
        {Array.from({ length: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay() }).map((_, i) => (
            <div key={`empty-${i}`} />
        ))}

        {/* Días */}
        {Array.from({ length: daysInMonth }).map((_, index) => {
            const day = index + 1;
            const status = getDayProgress(day);
            const isTodayDay = isToday(day);
            
            return (
                <div
                    key={day}
                    onClick={() => openDayModal(day)}
                    className={`
                        aspect-square 
                        relative
                        rounded-full sm:rounded-2xl
                        flex flex-col items-center justify-center 
                        cursor-pointer 
                        transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]
                        select-none
                        group
                        ${status === 'completed' ? 'bg-[#30D158] text-black shadow-[0_0_20px_rgba(48,209,88,0.3)]' : ''}
                        ${status === 'in-progress' ? 'bg-[#1C1C1E] border border-[#30D158]/30 text-white' : ''}
                        ${status === 'empty' ? 'bg-[#1C1C1E] text-[#8E8E93] hover:bg-[#2C2C2E]' : ''}
                        ${isTodayDay && status === 'empty' ? 'ring-1 ring-white text-white bg-[#2C2C2E]' : ''}
                    `}
                >
                    <span className={`text-sm sm:text-base font-medium ${status === 'completed' ? 'font-bold' : ''}`}>{day}</span>
                    
                    {/* Indicadores miniatura si hay metas activas */}
                    {status === 'in-progress' && (
                         <div className="absolute bottom-2 w-1 h-1 bg-[#30D158] rounded-full" />
                    )}
                </div>
            );
        })}
      </div>

      {/* iOS Style Modal / Bottom Sheet */}
      {selectedDay !== null && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            {/* Backdrop con Blur intenso */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300"
                onClick={closeModal}
            />
            
            {/* Modal Card */}
            <div className="
                relative 
                w-full max-w-sm 
                bg-[#1C1C1E] 
                rounded-t-3xl sm:rounded-3xl 
                p-6 
                shadow-2xl 
                border-t sm:border border-[#38383A]
                animate-in slide-in-from-bottom-10 fade-in duration-300
            ">
                
                {/* Drag Handle (Visual only) */}
                <div className="w-12 h-1 bg-[#38383A] rounded-full mx-auto mb-6 sm:hidden" />

                <div className="flex justify-between items-center mb-6">
                    <div className="flex flex-col">
                        <span className="text-[#8E8E93] text-xs font-semibold uppercase tracking-wider">Metas del día</span>
                        <h2 className="text-2xl font-bold text-white">
                            {selectedDay} de {currentDate.toLocaleDateString('es-ES', { month: 'long' })}
                        </h2>
                    </div>
                    <button 
                        onClick={closeModal}
                        className="w-8 h-8 rounded-full bg-[#2C2C2E] flex items-center justify-center text-[#8E8E93] hover:bg-[#3A3A3C] transition-colors"
                    >
                        <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                            {/* Simplificado X icon */}
                            <path d="M1 1L13 13M1 13L13 1" />
                        </svg>
                    </button>
                </div>

                {/* Input Area */}
                <div className="flex flex-col gap-3 mb-6">
                    <div className="flex gap-2">
                        <input 
                            ref={modalInputRef}
                            type="text" 
                            value={newGoalText}
                            onChange={(e) => setNewGoalText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addGoal()}
                            placeholder="Nueva meta..."
                            className="
                                flex-1 bg-[#2C2C2E] text-white 
                                rounded-xl px-4 py-3 
                                text-base placeholder-[#636366]
                                focus:outline-none focus:ring-2 focus:ring-[#30D158]/50
                                transition-all
                            "
                        />
                        <input 
                            type="time" 
                            value={newGoalTime}
                            onChange={(e) => setNewGoalTime(e.target.value)}
                            className="
                                bg-[#2C2C2E] text-white 
                                rounded-xl px-3 py-3 
                                text-base
                                focus:outline-none focus:ring-2 focus:ring-[#30D158]/50
                                [color-scheme:dark]
                                transition-all
                            "
                        />
                    </div>
                    <button 
                        onClick={addGoal}
                        disabled={!newGoalText.trim()}
                        className="
                            w-full
                            bg-[#30D158] text-black 
                            rounded-xl px-4 py-3 font-bold text-sm uppercase tracking-wide
                            disabled:opacity-30 disabled:cursor-not-allowed
                            hover:bg-[#28b84d] transition-colors
                            flex items-center justify-center gap-2
                        "
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Añadir Meta
                    </button>
                </div>

                {/* Goal List */}
                <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1 custom-scrollbar">
                    {(!goalsMap[selectedDay] || goalsMap[selectedDay].length === 0) && (
                        <div className="text-center py-8 text-[#636366] text-sm">
                            Sin metas para este día
                        </div>
                    )}

                    {goalsMap[selectedDay]?.map(goal => (
                        <div 
                            key={goal.id} 
                            className="group flex items-center gap-3 bg-[#2C2C2E]/50 p-3 rounded-xl border border-transparent hover:border-[#38383A] transition-all"
                        >
                            <button
                                onClick={() => toggleGoal(selectedDay, goal.id)}
                                className={`
                                    w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200
                                    ${goal.completed 
                                        ? 'bg-[#30D158] border-[#30D158] text-black' 
                                        : 'border-[#48484A] hover:border-[#30D158]'
                                    }
                                `}
                            >
                                {goal.completed && (
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                )}
                            </button>
                            
                            <div className="flex-1 flex flex-col">
                                <span className={`text-sm ${goal.completed ? 'text-[#636366] line-through' : 'text-white'}`}>
                                    {goal.text}
                                </span>
                                {goal.time && (
                                    <span className={`text-xs flex items-center gap-1 mt-0.5 ${goal.completed ? 'text-[#636366]/50' : 'text-[#30D158]'}`}>
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="10"></circle>
                                            <polyline points="12 6 12 12 16 14"></polyline>
                                        </svg>
                                        {goal.time}
                                    </span>
                                )}
                            </div>

                            <button 
                                onClick={() => deleteGoal(selectedDay, goal.id)}
                                className="opacity-0 group-hover:opacity-100 p-2 text-[#FF453A] hover:bg-[#FF453A]/10 rounded-lg transition-all"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 6h18"></path>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
