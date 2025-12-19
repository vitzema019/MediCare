import React, { useMemo, useState, type JSX } from "react";
import { useNavigate } from "react-router-dom"; 
import Navbar from "@/components/Navbar";

const WEEK_DAYS = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"];
const TIME_SLOTS = [
    "08:00", "09:00", "10:00", "11:00",
    "12:00", "13:00", "14:00", "15:00"
];

function startOfMonth(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}
function endOfMonth(date: Date) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}
function addMonths(date: Date, months:  number) {
    return new Date(date.getFullYear(), date.getMonth() + months, 1);
}
function isSameDay(a?:  Date | null, b?: Date | null) {
    if (!a || !b) return false;
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}
function isBeforeDay(a:  Date, b: Date) {
    const ad = new Date(a.getFullYear(), a.getMonth(), a.getDate());
    const bd = new Date(b.getFullYear(), b.getMonth(), b.getDate());
    return ad.getTime() < bd.getTime();
}
function isWeekend(date: Date) {
    const d = date.getDay();
    return d === 0 || d === 6;
}

export default function Calendar(): JSX.Element {
    const navigate = useNavigate(); 
    
    const today = useMemo(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    }, []);

    const [visibleMonth, setVisibleMonth] = useState<Date>(startOfMonth(today));
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [isConfirming, setIsConfirming] = useState(false); 
    const weeks = useMemo(() => {
        const start = startOfMonth(visibleMonth);
        const end = endOfMonth(visibleMonth);
        const startDay = (start.getDay() + 6) % 7; 
        const totalDays = end.getDate();

        const days: (Date | null)[] = [];

        for (let i = 0; i < startDay; i++) days.push(null);

        for (let d = 1; d <= totalDays; d++) {
            days.push(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), d));
        }

        while (days.length % 7 !== 0) days.push(null);

        const weeksArr:  (Date | null)[][] = [];
        for (let i = 0; i < days.length; i += 7) {
            weeksArr.push(days.slice(i, i + 7));
        }
        return weeksArr;
    }, [visibleMonth]);

    function handlePrevMonth() {
        setVisibleMonth((m) => addMonths(m, -1));
    }

    function handleNextMonth() {
        setVisibleMonth((m) => addMonths(m, 1));
    }

    function handleSelectDate(date: Date) {
        if (isBeforeDay(date, today)) return;
        if (isWeekend(date)) return;
        setSelectedDate(date);
        setSelectedTime(null);
    }

    function handleSelectTime(time: string) {
        setSelectedTime(time);
    }

   
    async function handleConfirm() {
        if (!selectedDate || !selectedTime) return;
        
        setIsConfirming(true);
        
        try {
            // Simulace API volání
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Vytvoření nové rezervace (normálně by se poslala na server)
            const newReservation = {
                id: Date. now(),
                clinic: "Downtown Clinic", // Zde by se použila data z formuláře
                procedure: "General Checkup",
                doctor: "Dr. Alice Smith", 
                datetime: new Date(
                    selectedDate.getFullYear(), 
                    selectedDate.getMonth(), 
                    selectedDate.getDate(),
                    parseInt(selectedTime.split(': ')[0]),
                    parseInt(selectedTime.split(':')[1])
                ).toISOString(),
                status: "potvrzeno" as const,
            };
            
            // Uložení do localStorage (simulace databáze)
            const existingReservations = JSON.parse(localStorage.getItem('reservations') || '[]');
            existingReservations.push(newReservation);
            localStorage.setItem('reservations', JSON.stringify(existingReservations));
            
            
            navigate('/moje-rezervace', { 
                state: { 
                    message: `✅ Rezervace úspěšně vytvořena na ${selectedDate.toLocaleDateString("cs-CZ")} v ${selectedTime}`,
                    newReservation 
                } 
            });
            
        } catch (error) {
            console.error('Chyba při vytváření rezervace:', error);
            alert('❌ Chyba při vytváření rezervace. Zkuste to prosím znovu.');
        } finally {
            setIsConfirming(false);
        }
    }

    const monthName = visibleMonth.toLocaleDateString("cs-CZ", { 
        month: "long", 
        year: "numeric" 
    });

    return (
        <div className="medicare-bg-gray-50" style={{ minHeight: 'calc(100vh - 200px)', padding: '2rem 0' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 1rem' }}>
                <Navbar />
                <br />
                <br />
                {/* Header */}
                <div className="medicare-text-center medicare-mb-8">
                    <h1 className="medicare-h1 medicare-text-primary">
                         Výběr termínu
                    </h1>
                    <p className="medicare-text-gray-600">
                        Vyberte si vhodný datum a čas pro vaši návštěvu
                    </p>
                </div>

                <div className="medicare-card">
                    {/* Calendar Header */}
                    <div className="medicare-card-header">
                        <div className="medicare-flex medicare-justify-between medicare-items-center">
                            <button 
                                className="medicare-btn medicare-btn-secondary"
                                onClick={handlePrevMonth}
                                disabled={isConfirming}
                            >
                                ← Předchozí
                            </button>
                            <h2 className="medicare-h3 medicare-text-primary medicare-m-0" style={{ textTransform: 'capitalize' }}>
                                {monthName}
                            </h2>
                            <button 
                                className="medicare-btn medicare-btn-secondary"
                                onClick={handleNextMonth}
                                disabled={isConfirming}
                            >
                                Další →
                            </button>
                        </div>
                    </div>

                    <div className="medicare-card-body">
                        {/* Week days header */}
                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(7, 1fr)', 
                            gap: '0.5rem',
                            marginBottom: '1rem',
                            padding: '0 0.5rem'
                        }}>
                            {WEEK_DAYS.map((day) => (
                                <div key={day} className="medicare-text-center medicare-text-gray-600" 
                                     style={{ padding: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar grid */}
                        <div style={{ 
                            display:  'grid', 
                            gridTemplateColumns: 'repeat(7, 1fr)', 
                            gap: '0.5rem',
                            marginBottom: '2rem'
                        }}>
                            {weeks.flat().map((date, index) => {
                                if (! date) {
                                    return <div key={index}></div>;
                                }
                                
                                const isPast = isBeforeDay(date, today);
                                const isWeekendDay = isWeekend(date);
                                const isSelected = isSameDay(date, selectedDate);
                                const isToday = isSameDay(date, today);
                                const isDisabled = isPast || isWeekendDay || isConfirming;
                                
                                return (
                                    <button
                                        key={index}
                                        className={`medicare-transition ${
                                            isSelected 
                                                ? 'medicare-btn medicare-btn-primary' 
                                                : isDisabled 
                                                    ? 'medicare-bg-gray-100 medicare-text-gray-400'
                                                    : 'medicare-bg-white medicare-text-gray-700 hover:medicare-bg-gray-100'
                                        }`}
                                        style={{
                                            padding: '0.75rem',
                                            textAlign: 'center',
                                            border: isToday ? '2px solid var(--medicare-primary)' : '1px solid var(--medicare-gray-200)',
                                            borderRadius: 'var(--medicare-rounded-md)',
                                            cursor: isDisabled ? 'not-allowed' : 'pointer',
                                            opacity: isDisabled ? 0.5 :  1,
                                            fontWeight: isToday ? '600' : 'normal'
                                        }}
                                        onClick={() => !isDisabled && handleSelectDate(date)}
                                        disabled={isDisabled}
                                    >
                                        {date. getDate()}
                                        {isToday && <div style={{ fontSize: '0.625rem', color: 'var(--medicare-primary)' }}>Dnes</div>}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Time slots */}
                        {selectedDate && (
                            <div style={{ borderTop: '1px solid var(--medicare-gray-200)', paddingTop: '2rem' }}>
                                <h3 className="medicare-h4 medicare-text-primary medicare-mb-4">
                                    🕐 Dostupné časy pro {selectedDate.toLocaleDateString("cs-CZ")}
                                </h3>
                                <div style={{ 
                                    display: 'grid', 
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
                                    gap: '0.75rem',
                                    marginBottom: '2rem'
                                }}>
                                    {TIME_SLOTS.map((time) => (
                                        <button
                                            key={time}
                                            className={`medicare-btn ${
                                                selectedTime === time 
                                                    ? 'medicare-btn-primary' 
                                                    : 'medicare-btn-secondary'
                                            }`}
                                            onClick={() => handleSelectTime(time)}
                                            disabled={isConfirming}
                                        >
                                            {time}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Confirm button */}
                        {selectedDate && selectedTime && (
                            <div className="medicare-bg-gray-50 medicare-rounded-lg medicare-p-4">
                                <h4 className="medicare-text-gray-800 medicare-mb-2">
                                    📋 Souhrn rezervace: 
                                </h4>
                                <p className="medicare-text-gray-600 medicare-mb-4">
                                    <strong>Datum:</strong> {selectedDate.toLocaleDateString("cs-CZ", { 
                                        weekday: 'long',
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric'
                                    })}<br/>
                                    <strong>Čas:</strong> {selectedTime}
                                </p>
                                <button
                                    className="medicare-btn medicare-btn-success medicare-w-full medicare-btn-lg"
                                    onClick={handleConfirm}
                                    disabled={isConfirming}
                                    style={{ opacity: isConfirming ? 0.7 : 1 }}
                                >
                                    {isConfirming ? '⏳ Potvrzuji rezervaci.. .' : '✅ Potvrdit rezervaci'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}