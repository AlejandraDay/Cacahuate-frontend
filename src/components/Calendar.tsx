import React, { useState } from 'react'

interface CalendarProps {
  onDateSelect: (date: Date) => void
  selectedDate?: Date
  markedDates?: Date[]
  disablePast?: boolean
}

export const Calendar: React.FC<CalendarProps> = ({ onDateSelect, selectedDate, markedDates = [], disablePast = true }) => {
  const [currentDate, setCurrentDate] = useState(new Date())

  const getDaysInMonth = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()

  const getFirstDayOfMonth = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), 1).getDay()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const daysInMonth = getDaysInMonth(currentDate)
  const firstDay = getFirstDayOfMonth(currentDate)

  const days: (Date | null)[] = []
  for (let i = 0; i < firstDay; i++) days.push(null)
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i))
  }

  const prevMonth = () =>
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  const nextMonth = () =>
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))

  const isToday = (date: Date | null) => {
    if (!date) return false
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    return d.getTime() === today.getTime()
  }

  const isSelected = (date: Date | null) => {
    if (!date || !selectedDate) return false
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    )
  }

  const isPast = (date: Date | null) => {
    if (!date) return false
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    return d < today
  }

  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ]
  const weekDays = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá']

  const isMarked = (date: Date | null) => {
    if (!date || markedDates.length === 0) return false
    return markedDates.some(
      (m) =>
        m.getDate() === date.getDate() &&
        m.getMonth() === date.getMonth() &&
        m.getFullYear() === date.getFullYear()
    )
  }

  const getDayClass = (date: Date | null) => {
    if (!date) return 'invisible pointer-events-none'
    if (isSelected(date))
      return 'bg-black text-white font-bold shadow-sm ring-2 ring-slate-400 ring-offset-1'
    if (isToday(date))
      return 'bg-blue-600 text-white font-bold shadow-sm'
    if (isPast(date) && disablePast)
      return 'text-gray-300 cursor-not-allowed'
    return 'text-gray-700 hover:bg-slate-100 hover:text-gray-900 cursor-pointer'
  }

  return (
    <div className="w-full select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-5">
        <button
          onClick={prevMonth}
          className="w-7 sm:w-9 h-7 sm:h-9 flex items-center justify-center rounded-full bg-white border border-gray-200 text-sm sm:text-base text-gray-500 hover:border-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-all duration-200 shadow-sm"
          aria-label="Mes anterior"
        >
          ‹
        </button>
        <h2 className="text-sm sm:text-base font-bold text-gray-800 tracking-tight">
          {months[currentDate.getMonth()]}{' '}
          <span className="text-slate-500">{currentDate.getFullYear()}</span>
        </h2>
        <button
          onClick={nextMonth}
          className="w-7 sm:w-9 h-7 sm:h-9 flex items-center justify-center rounded-full bg-white border border-gray-200 text-sm sm:text-base text-gray-500 hover:border-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-all duration-200 shadow-sm"
          aria-label="Mes siguiente"
        >
          ›
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1 sm:mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-semibold text-gray-400 uppercase tracking-wider py-0.5 sm:py-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-y-0.5 sm:gap-y-1">
        {days.map((date, index) => (
          <div key={index} className="flex flex-col items-center justify-center">
            <button
              onClick={() => date && !(isPast(date) && disablePast) && onDateSelect(date)}
              disabled={!date || (isPast(date) && disablePast)}
              className={`w-6 sm:w-9 h-6 sm:h-9 rounded-full text-xs sm:text-sm transition-all duration-200 flex items-center justify-center ${getDayClass(date)}`}
            >
              {date?.getDate()}
            </button>
            {isMarked(date) && (
              <span className="w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full bg-blue-400 mt-0.5 block" />
            )}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-2 sm:mt-4 pt-2 sm:pt-4 border-t border-gray-100 flex items-center gap-2 sm:gap-4 text-xs text-gray-400">
        <div className="flex items-center gap-1.5">
          <span className="w-2 sm:w-3 h-2 sm:h-3 rounded-full bg-blue-600 inline-block"></span>
          Hoy
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 sm:w-3 h-2 sm:h-3 rounded-full bg-black inline-block"></span>
          Seleccionado
        </div>
      </div>
    </div>
  )
}

export default Calendar
