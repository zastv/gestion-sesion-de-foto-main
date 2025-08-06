import { useState, useEffect } from "react";
import "./CalendarView.css";

const hours = [
  "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"
];

export default function CalendarView({ reloadFlag }: { reloadFlag?: number }) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    const fetchEvents = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch("http://localhost:4000/api/calendar-events", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setEvents(await res.json());
      }
    };
    fetchEvents();
  }, [reloadFlag]);

  function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
  }
  function getFirstDayOfWeek(year: number, month: number) {
    return new Date(year, month, 1).getDay();
  }
  function getDateString(day: number) {
    return `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  // Map events to busy slots
  const busySlots: Record<string, string[]> = {};
  for (const ev of events) {
    const date = ev.start.slice(0, 10);
    const hour = ev.start.slice(11, 16);
    if (!busySlots[date]) busySlots[date] = [];
    busySlots[date].push(hour);
  }

  return (
    <div className="calendar-full-container">
      <div className="calendar-header">
        <button onClick={() => { if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); } else { setCurrentMonth(currentMonth - 1); } setSelectedDate(null); }}>&lt;</button>
        <span>{["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"][currentMonth]} {currentYear}</span>
        <button onClick={() => { if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); } else { setCurrentMonth(currentMonth + 1); } setSelectedDate(null); }}>&gt;</button>
      </div>
      <div className="calendar-table">
        <div className="calendar-weekdays">
          {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((d) => (
            <div key={d} className="calendar-weekday">{d}</div>
          ))}
        </div>
        <div className="calendar-days">
          {Array(getFirstDayOfWeek(currentYear, currentMonth)).fill(null).map((_, i) => (
            <div key={"empty-" + i} className="calendar-day empty"></div>
          ))}
          {Array(getDaysInMonth(currentYear, currentMonth)).fill(null).map((_, i) => {
            const day = i + 1;
            const dateStr = getDateString(day);
            const isToday =
              day === today.getDate() &&
              currentMonth === today.getMonth() &&
              currentYear === today.getFullYear();
            const isSelected = selectedDate === dateStr;
            const isBusy = busySlots[dateStr]?.length > 0;
            return (
              <div
                key={dateStr}
                className={`calendar-day${isToday ? " today" : ""}${isSelected ? " selected" : ""}${isBusy ? " busy" : ""}`}
                onClick={() => setSelectedDate(dateStr)}
              >
                {day}
              </div>
            );
          })}
        </div>
      </div>
      {selectedDate && (
        <div className="calendar-hours-container">
          <h4>Horas para {selectedDate}</h4>
          <div className="calendar-hours-grid">
            {hours.map((h) => (
              <div
                key={h}
                className={`calendar-hour${busySlots[selectedDate]?.includes(h) ? " busy" : " available"}`}
              >
                {h} {busySlots[selectedDate]?.includes(h) ? "(Ocupado)" : "(Disponible)"}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}