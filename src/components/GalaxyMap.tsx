import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ENEMY_FACTIONS, PLANET_TYPE_INFO, getPlanetTypeSummary } from '../game/constants'
import { LORE } from '../game/lore'
import { getDeepVoidTierLabel } from '../game/deepVoid'
import { getGalaxyMapBounds, getPlanetMapPosition } from '../game/frontierGeneration'
import { getPlanetEpithet } from '../game/names'
import type { Planet } from '../game/types'
import { getMandateFocus } from '../game/mandateGuide'
import { useFleetPower, useGameStore } from '../store/gameStore'

const MIN_ZOOM = 0.35
const MAX_ZOOM = 2.75
const DRAG_THRESHOLD_PX = 5

export function GalaxyMap() {
  const planets = useGameStore((s) => s.planets)
  const selectedPlanetId = useGameStore((s) => s.selectedPlanetId)
  const selectPlanet = useGameStore((s) => s.selectPlanet)
  const initiateInvasion = useGameStore((s) => s.initiateInvasion)
  const fleetPower = useFleetPower()
  const mandateFocus = useGameStore((s) => getMandateFocus(s))

  const playerPlanets = planets.filter((p) => p.owner === 'player')
  const enemyPlanets = planets.filter((p) => p.owner === 'enemy')
  const frontierWave = useGameStore((s) => s.frontier.wave)

  const selectedPlanet = planets.find((p) => p.id === selectedPlanetId)
  const selectedFaction = selectedPlanet?.enemyFaction
    ? ENEMY_FACTIONS.find((f) => f.id === selectedPlanet.enemyFaction)
    : undefined

  const mapBounds = useMemo(() => getGalaxyMapBounds(planets), [planets])
  const viewportRef = useRef<HTMLDivElement>(null)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const dragRef = useRef({ active: false, moved: false, lastX: 0, lastY: 0 })
  const fitMapToViewport = useCallback(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    const vw = viewport.clientWidth
    const vh = viewport.clientHeight
    if (vw <= 0 || vh <= 0) return

    const fitZoom = Math.min(
      vw / mapBounds.widthPx,
      vh / mapBounds.heightPx,
      1,
    ) * 0.9

    setZoom(fitZoom)
    setPan({
      x: (vw - mapBounds.widthPx * fitZoom) / 2,
      y: (vh - mapBounds.heightPx * fitZoom) / 2,
    })
  }, [mapBounds.heightPx, mapBounds.widthPx])

  useEffect(() => {
    fitMapToViewport()
  }, [fitMapToViewport, planets.length])

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = {
      active: true,
      moved: false,
      lastX: event.clientX,
      lastY: event.clientY,
    }
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active) return

    const dx = event.clientX - dragRef.current.lastX
    const dy = event.clientY - dragRef.current.lastY

    if (
      !dragRef.current.moved &&
      Math.hypot(event.clientX - dragRef.current.lastX, event.clientY - dragRef.current.lastY) <
        DRAG_THRESHOLD_PX
    ) {
      return
    }

    dragRef.current.moved = true
    dragRef.current.lastX = event.clientX
    dragRef.current.lastY = event.clientY
    setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }))
  }

  const handlePointerUp = () => {
    dragRef.current.active = false
    window.setTimeout(() => {
      dragRef.current.moved = false
    }, 0)
  }

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault()
    const viewport = viewportRef.current
    if (!viewport) return

    const rect = viewport.getBoundingClientRect()
    const cursorX = event.clientX - rect.left
    const cursorY = event.clientY - rect.top

    const zoomFactor = 1 - event.deltaY * 0.0012
    setZoom((prevZoom) => {
      const nextZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prevZoom * zoomFactor))
      const scale = nextZoom / prevZoom

      setPan((prevPan) => ({
        x: cursorX - scale * (cursorX - prevPan.x),
        y: cursorY - scale * (cursorY - prevPan.y),
      }))

      return nextZoom
    })
  }

  const handlePlanetSelect = (planetId: string) => {
    if (dragRef.current.moved) return
    selectPlanet(planetId)
  }

  const centerX = mapBounds.toLocalX(50)
  const centerY = mapBounds.toLocalY(50)

  return (
    <section className="panel galaxy-panel" data-tutorial-id="galaxy-panel">
      <h2>{LORE.galaxyMapTitle}</h2>
      <div className="galaxy-stats">
        <span className="player-count">Throne Worlds: {playerPlanets.length}</span>
        <span className="enemy-count">Contested: {enemyPlanets.length}</span>
        {frontierWave > 0 && (
          <span className="frontier-count">Void Frontier: {frontierWave}</span>
        )}
      </div>

      <p className="galaxy-map-hint">Drag to pan · scroll to zoom</p>

      <div
        ref={viewportRef}
        className="galaxy-map"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
      >
        <div
          className="galaxy-map-canvas"
          style={{
            width: mapBounds.widthPx,
            height: mapBounds.heightPx,
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          }}
        >
          {planets.map((planet: Planet) => {
            const typeInfo = PLANET_TYPE_INFO[planet.type]
            const faction = ENEMY_FACTIONS.find((f) => f.id === planet.enemyFaction)
            const isSelected = planet.id === selectedPlanetId
            const { x, y } = getPlanetMapPosition(planet)

            return (
              <button
                key={planet.id}
                type="button"
                className={`planet-node ${planet.owner}${planet.isFrontierBoss ? ' frontier-boss' : ''} ${isSelected ? 'selected' : ''}`}
                style={{
                  left: mapBounds.toLocalX(x),
                  top: mapBounds.toLocalY(y),
                  borderColor:
                    faction?.color ?? (planet.owner === 'player' ? '#c9a227' : '#c44b4b'),
                }}
                onClick={() => handlePlanetSelect(planet.id)}
                title={`${planet.name}${planet.isFrontierBoss ? ' (Apex Bastion)' : ''} — ${getPlanetTypeSummary(planet.type)}${planet.frontierWave ? ` · ${getDeepVoidTierLabel(planet.frontierWave)}` : ''}`}
              >
                <span className="node-icon">
                  {planet.isFrontierBoss ? '👑' : typeInfo.icon}
                </span>
                <span className="node-name">{planet.name}</span>
              </button>
            )
          })}
          <div
            className="galaxy-center"
            style={{ left: centerX, top: centerY }}
            title="The Iron Sun"
          >
            ☀️
          </div>
        </div>
      </div>

      <button type="button" className="btn btn-ghost galaxy-map-reset" onClick={fitMapToViewport}>
        Fit entire sector
      </button>

      {selectedPlanet && (
        <div className="planet-actions">
          <h3>{selectedPlanet.name}</h3>
          {getPlanetEpithet(selectedPlanet.id, selectedPlanet.epithet) && (
            <p className="planet-epithet">
              {getPlanetEpithet(selectedPlanet.id, selectedPlanet.epithet)}
            </p>
          )}
          {selectedFaction && (
            <p className="faction-lore">
              <strong>{selectedFaction.name}</strong> — "{selectedFaction.motto}"
            </p>
          )}
          <p>
            {getPlanetTypeSummary(selectedPlanet.type)} · Aegis Rating:{' '}
            {selectedPlanet.defenseRating} · Void Armada Strength: {fleetPower}
          </p>
          {selectedPlanet.owner === 'enemy' && (
            <button
              className={`btn btn-attack${mandateFocus === 'invasion' ? ' mandate-focus' : ''}${selectedPlanet.isFrontierBoss ? ' boss-assault' : ''}`}
              disabled={fleetPower === 0}
              onClick={() => initiateInvasion(selectedPlanet.id)}
            >
              {selectedPlanet.isFrontierBoss
                ? '👑 Shatter Apex Bastion'
                : '⚔️ Issue Mandate of Conquest'}
            </button>
          )}
          {selectedPlanet.owner === 'player' && (
            <p className="friendly-note">This world acknowledges the Throne Mandate.</p>
          )}
        </div>
      )}
    </section>
  )
}
