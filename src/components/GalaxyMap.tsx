import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ENEMY_FACTIONS, PLANET_TYPE_INFO, getPlanetTypeSummary } from '../game/constants'
import { getDeepVoidTierLabel } from '../game/deepVoid'
import { getGalaxyMapBounds, getPlanetMapPosition } from '../game/frontierGeneration'
import { LORE } from '../game/lore'
import { getPlanetEpithet } from '../game/names'
import {
  FOUNDING_SYSTEM_ID,
  getGalacticMapBounds,
  getHyperlanePairs,
  getStarSystem,
  getSystemGalacticPosition,
  planetsInSystem,
} from '../game/starSystems'
import type { Planet, StarSystem } from '../game/types'
import { getGalacticMapCallout, getGalacticMandateFocus } from '../game/galacticMandate'
import { getMandateFocus } from '../game/mandateGuide'
import { useFleetPower, useGameStore } from '../store/gameStore'

const MIN_ZOOM = 0.35
const MAX_ZOOM = 2.75
const DRAG_THRESHOLD_PX = 5

function useMapViewport(
  widthPx: number,
  heightPx: number,
  resetKey: string | number,
) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const dragRef = useRef({ active: false, moved: false, lastX: 0, lastY: 0 })

  const fitMapToViewport = useCallback(() => {
    const viewport = viewportRef.current
    if (!viewport) return
    const vw = viewport.clientWidth
    const vh = viewport.clientHeight
    if (vw <= 0 || vh <= 0 || widthPx <= 0 || heightPx <= 0) return

    const fitZoom = Math.min(vw / widthPx, vh / heightPx, 1) * 0.9
    setZoom(fitZoom)
    setPan({
      x: (vw - widthPx * fitZoom) / 2,
      y: (vh - heightPx * fitZoom) / 2,
    })
  }, [heightPx, widthPx])

  useEffect(() => {
    fitMapToViewport()
  }, [fitMapToViewport, resetKey])

  const applyWheelZoom = useCallback(
    (clientX: number, clientY: number, deltaY: number) => {
      const viewport = viewportRef.current
      if (!viewport) return
      const rect = viewport.getBoundingClientRect()
      const cursorX = clientX - rect.left
      const cursorY = clientY - rect.top
      const zoomFactor = 1 - deltaY * 0.0012

      setZoom((prevZoom) => {
        const nextZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prevZoom * zoomFactor))
        const scale = nextZoom / prevZoom
        setPan((prevPan) => ({
          x: cursorX - scale * (cursorX - prevPan.x),
          y: cursorY - scale * (cursorY - prevPan.y),
        }))
        return nextZoom
      })
    },
    [],
  )

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return
    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      event.stopPropagation()
      applyWheelZoom(event.clientX, event.clientY, event.deltaY)
    }
    viewport.addEventListener('wheel', onWheel, { passive: false })
    return () => viewport.removeEventListener('wheel', onWheel)
  }, [applyWheelZoom, resetKey])

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
      Math.hypot(dx, dy) < DRAG_THRESHOLD_PX
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

  return {
    viewportRef,
    pan,
    zoom,
    fitMapToViewport,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    dragRef,
  }
}

function GalacticChart({
  starSystems,
  selectedSystemId,
  onSelectSystem,
}: {
  starSystems: StarSystem[]
  selectedSystemId: string
  onSelectSystem: (id: string) => void
}) {
  const bounds = useMemo(() => getGalacticMapBounds(starSystems), [starSystems])
  const lanes = useMemo(() => getHyperlanePairs(starSystems), [starSystems])
  const viewport = useMapViewport(bounds.widthPx, bounds.heightPx, 'galaxy')

  const handleSystemClick = (system: StarSystem) => {
    if (viewport.dragRef.current.moved) return
    if (system.charted) onSelectSystem(system.id)
  }

  return (
    <>
      <p className="galaxy-map-hint">Galactic chart · drag to pan · scroll to zoom · select a charted star</p>
      <div
        ref={viewport.viewportRef}
        className="galaxy-map galactic-chart"
        onPointerDown={viewport.handlePointerDown}
        onPointerMove={viewport.handlePointerMove}
        onPointerUp={viewport.handlePointerUp}
        onPointerCancel={viewport.handlePointerUp}
      >
        <div
          className="galaxy-map-canvas galactic-canvas"
          style={{
            width: bounds.widthPx,
            height: bounds.heightPx,
            transform: `translate(${viewport.pan.x}px, ${viewport.pan.y}px) scale(${viewport.zoom})`,
          }}
        >
          <svg className="hyperlane-layer" width={bounds.widthPx} height={bounds.heightPx}>
            {lanes.map(([a, b]) => {
              const sysA = starSystems.find((s) => s.id === a)!
              const sysB = starSystems.find((s) => s.id === b)!
              const posA = getSystemGalacticPosition(sysA, bounds)
              const posB = getSystemGalacticPosition(sysB, bounds)
              return (
                <line
                  key={`${a}-${b}`}
                  x1={posA.x}
                  y1={posA.y}
                  x2={posB.x}
                  y2={posB.y}
                  className="hyperlane"
                />
              )
            })}
          </svg>
          {starSystems.map((system) => {
            const { x, y } = getSystemGalacticPosition(system, bounds)
            const isSelected = system.id === selectedSystemId
            const status = system.charted ? ' · charted' : ' · sensor ghost'
            return (
              <button
                key={system.id}
                type="button"
                className={`star-system-node${system.charted ? ' charted' : ' uncharted'}${system.isFounding ? ' founding' : ''}${isSelected ? ' selected' : ''}`}
                style={{ left: x, top: y }}
                onClick={() => handleSystemClick(system)}
                title={`${system.name} (${system.starLabel})${status}`}
                disabled={!system.charted}
              >
                <span className="star-system-icon">{system.isFounding ? '☀️' : system.charted ? '⭐' : '✦'}</span>
                <span className="star-system-name">{system.name}</span>
              </button>
            )
          })}
        </div>
      </div>
      <button type="button" className="btn btn-ghost galaxy-map-reset" onClick={viewport.fitMapToViewport}>
        Fit galactic chart
      </button>
    </>
  )
}

function SystemChart({
  system,
  planets,
  selectedPlanetId,
  onSelectPlanet,
}: {
  system: StarSystem
  planets: Planet[]
  selectedPlanetId: string
  onSelectPlanet: (id: string) => void
}) {
  const bounds = useMemo(() => getGalaxyMapBounds(planets), [planets])
  const viewport = useMapViewport(bounds.widthPx, bounds.heightPx, system.id)
  const centerX = bounds.toLocalX(50)
  const centerY = bounds.toLocalY(50)

  const handlePlanetClick = (planetId: string) => {
    if (viewport.dragRef.current.moved) return
    onSelectPlanet(planetId)
  }

  return (
    <>
      <p className="galaxy-map-hint">
        {system.name} · {system.starLabel} · drag to pan · scroll to zoom
      </p>
      <div
        ref={viewport.viewportRef}
        className="galaxy-map system-chart"
        onPointerDown={viewport.handlePointerDown}
        onPointerMove={viewport.handlePointerMove}
        onPointerUp={viewport.handlePointerUp}
        onPointerCancel={viewport.handlePointerUp}
      >
        <div
          className="galaxy-map-canvas"
          style={{
            width: bounds.widthPx,
            height: bounds.heightPx,
            transform: `translate(${viewport.pan.x}px, ${viewport.pan.y}px) scale(${viewport.zoom})`,
          }}
        >
          {planets.map((planet) => {
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
                  left: bounds.toLocalX(x),
                  top: bounds.toLocalY(y),
                  borderColor:
                    faction?.color ?? (planet.owner === 'player' ? '#c9a227' : '#c44b4b'),
                }}
                onClick={() => handlePlanetClick(planet.id)}
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
            title={system.starLabel}
          >
            {system.isFounding ? '☀️' : '⭐'}
          </div>
        </div>
      </div>
      <button type="button" className="btn btn-ghost galaxy-map-reset" onClick={viewport.fitMapToViewport}>
        Fit star system
      </button>
    </>
  )
}

export function GalaxyMap() {
  const planets = useGameStore((s) => s.planets)
  const starSystems = useGameStore((s) => s.starSystems)
  const selectedSystemId = useGameStore((s) => s.selectedSystemId)
  const stellarMapView = useGameStore((s) => s.stellarMapView)
  const selectedPlanetId = useGameStore((s) => s.selectedPlanetId)
  const selectPlanet = useGameStore((s) => s.selectPlanet)
  const selectStarSystem = useGameStore((s) => s.selectStarSystem)
  const setStellarMapView = useGameStore((s) => s.setStellarMapView)
  const initiateInvasion = useGameStore((s) => s.initiateInvasion)
  const fleetPower = useFleetPower()
  const mandateFocus = useGameStore((s) => getMandateFocus(s))
  const galacticFocus = useGameStore((s) => getGalacticMandateFocus(s))
  const mapCallout = useGameStore((s) => getGalacticMapCallout(s))
  const frontierWave = useGameStore((s) => s.frontier.wave)

  const chartedCount = starSystems.filter((s) => s.charted).length
  const playerPlanets = planets.filter((p) => p.owner === 'player')
  const enemyPlanets = planets.filter((p) => p.owner === 'enemy')
  const activeSystem = getStarSystem({ starSystems }, selectedSystemId)
  const systemPlanets = planetsInSystem(planets, selectedSystemId)

  const selectedPlanet = planets.find((p) => p.id === selectedPlanetId)
  const selectedFaction = selectedPlanet?.enemyFaction
    ? ENEMY_FACTIONS.find((f) => f.id === selectedPlanet.enemyFaction)
    : undefined

  return (
    <section
      className={`panel galaxy-panel${mandateFocus === 'invasion' || galacticFocus === 'galacticChart' ? ' mandate-focus' : ''}`}
      data-tutorial-id="galaxy-panel"
    >
      <div className="galaxy-panel-header">
        <h2>{LORE.galaxyMapTitle}</h2>
        <div className="map-view-toggle">
          <button
            type="button"
            className={`btn btn-ghost btn-compact${stellarMapView === 'galaxy' ? ' active' : ''}`}
            onClick={() => setStellarMapView('galaxy')}
          >
            Galactic chart
          </button>
          <button
            type="button"
            className={`btn btn-ghost btn-compact${stellarMapView === 'system' ? ' active' : ''}`}
            onClick={() => setStellarMapView('system')}
            disabled={!activeSystem?.charted}
          >
            Star system
          </button>
        </div>
      </div>

      <div className="galaxy-stats">
        <span className="player-count">Star systems charted: {chartedCount}/{starSystems.length}</span>
        <span className="player-count">Throne worlds: {playerPlanets.length}</span>
        <span className="enemy-count">Contested: {enemyPlanets.length}</span>
        {frontierWave > 0 && (
          <span className="frontier-count">Void frontier: {frontierWave}</span>
        )}
      </div>

      {mapCallout && <p className="galactic-progression-callout">{mapCallout}</p>}

      {stellarMapView === 'galaxy' ? (
        <GalacticChart
          starSystems={starSystems}
          selectedSystemId={selectedSystemId}
          onSelectSystem={selectStarSystem}
        />
      ) : activeSystem ? (
        <SystemChart
          system={activeSystem}
          planets={systemPlanets}
          selectedPlanetId={selectedPlanetId}
          onSelectPlanet={selectPlanet}
        />
      ) : (
        <p className="galaxy-map-hint">Chart a star system from the galactic view to inspect worlds.</p>
      )}

      {selectedPlanet && (selectedPlanet.systemId ?? FOUNDING_SYSTEM_ID) === selectedSystemId && (
        <div className="planet-actions">
          <h3>{selectedPlanet.name}</h3>
          {activeSystem && (
            <p className="planet-system-line">
              {activeSystem.name} · {activeSystem.starLabel}
            </p>
          )}
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
            {getPlanetTypeSummary(selectedPlanet.type)} · Aegis rating:{' '}
            {selectedPlanet.defenseRating} · Void armada strength: {fleetPower}
          </p>
          {selectedPlanet.owner === 'enemy' && (
            <button
              className={`btn btn-attack${mandateFocus === 'invasion' ? ' mandate-focus' : ''}${selectedPlanet.isFrontierBoss ? ' boss-assault' : ''}`}
              disabled={fleetPower === 0}
              onClick={() => initiateInvasion(selectedPlanet.id)}
            >
              {selectedPlanet.isFrontierBoss
                ? '👑 Shatter apex bastion'
                : '⚔️ Issue mandate of conquest'}
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
