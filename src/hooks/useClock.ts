import { useState, useEffect } from 'react'

export function useClock() {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  return now
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/** Returns time remaining until shiftEnd (HH:MM) as "Xh Ym" string */
export function shiftTimeRemaining(now: Date, shiftEndHHMM: string): string {
  const [hh, mm] = shiftEndHHMM.split(':').map(Number)
  const end = new Date(now)
  end.setHours(hh, mm, 0, 0)
  if (end <= now) end.setDate(end.getDate() + 1)
  const diffMs = end.getTime() - now.getTime()
  const totalMin = Math.floor(diffMs / 60000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return `${h}h ${m}m`
}
