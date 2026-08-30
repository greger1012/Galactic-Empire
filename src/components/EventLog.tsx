import { LORE } from '../game/lore'
import type { GameEvent } from '../game/types'
import { useGameStore } from '../store/gameStore'

export function EventLog() {
  const events = useGameStore((s) => s.events)

  return (
    <section className="panel event-log">
      <h2>{LORE.chronicleTitle}</h2>
      <div className="events">
        {events.map((event: GameEvent) => (
          <div key={event.id} className={`event event-${event.type}`}>
            <span className="event-message">{event.message}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
