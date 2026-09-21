import { useEffect, useMemo, useRef, useState } from 'react'
import { geoConicEqualArea, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import statesTopology from 'us-atlas/states-10m.json'
import {
  DEFAULT_CUE_OFFSET,
  DEFAULT_VIDEO_ID,
  NOMINAL_DURATION,
  stateAt,
  timeline,
  type CaseFileState,
  type Coordinates,
  type Cue,
} from './timeline'

type YTPlayer = {
  destroy: () => void
  getCurrentTime: () => number
  getDuration: () => number
  seekTo: (seconds: number, allowSeekAhead: boolean) => void
}

type YTNamespace = {
  Player: new (
    element: HTMLElement,
    options: {
      videoId: string
      playerVars: Record<string, number>
      events: {
        onReady: () => void
        onStateChange: (event: { data: number }) => void
        onError: () => void
      }
    },
  ) => YTPlayer
  PlayerState: { PLAYING: number }
}

declare global {
  interface Window {
    YT?: YTNamespace
    onYouTubeIframeAPIReady?: () => void
  }
}

let youtubeApiPromise: Promise<YTNamespace> | undefined

const loadYouTubeApi = () => {
  if (window.YT?.Player) return Promise.resolve(window.YT)
  if (youtubeApiPromise) return youtubeApiPromise

  youtubeApiPromise = new Promise<YTNamespace>((resolve) => {
    const previous = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      previous?.()
      if (window.YT) resolve(window.YT)
    }

    if (!document.querySelector('script[data-wanted-man-youtube]')) {
      const script = document.createElement('script')
      script.src = 'https://www.youtube.com/iframe_api'
      script.dataset.wantedManYoutube = 'true'
      document.head.appendChild(script)
    }
  })

  return youtubeApiPromise
}

const formatTime = (seconds: number) => {
  const safe = Number.isFinite(seconds) ? Math.max(0, seconds) : 0
  const minutes = Math.floor(safe / 60)
  const remainder = Math.floor(safe % 60)
  return `${minutes}:${remainder.toString().padStart(2, '0')}`
}

const Checklist = ({
  title,
  eyebrow,
  items,
  empty,
}: {
  title: string
  eyebrow: string
  items: Cue[]
  empty: string
}) => (
  <section className="case-card">
    <div className="card-heading">
      <span>{eyebrow}</span>
      <h2>{title}</h2>
    </div>
    {items.length === 0 ? (
      <p className="empty-state">{empty}</p>
    ) : (
      <ul className="checklist">
        {items.map((item) => (
          <li key={item.key ?? item.id} title={item.note}>
            <span className="checkbox" aria-hidden="true">✓</span>
            <span>{item.label}</span>
          </li>
        ))}
      </ul>
    )}
  </section>
)

const WantedChecklist = ({ caseFile }: { caseFile: CaseFileState }) => {
  const items = [...caseFile.wantedStates, ...caseFile.wantedCities]
  if (caseFile.mysteryTown) items.push(caseFile.mysteryTown)

  return (
    <Checklist
      title="Wanted here"
      eyebrow={`${items.length.toString().padStart(2, '0')} jurisdictions alarmed`}
      items={items}
      empty="No jurisdictions have filed anything yet. Suspiciously peaceful."
    />
  )
}

const MapPanel = ({ caseFile }: { caseFile: CaseFileState }) => {
  const width = 960
  const height = 610
  const projection = useMemo(
    () =>
      geoConicEqualArea()
        .parallels([29.5, 45.5])
        .rotate([96, 0])
        .center([0, 38.7])
        .scale(1160)
        .translate([width / 2, height / 2]),
    [],
  )

  const states = useMemo(() => {
    const topology = statesTopology as unknown as {
      type: 'Topology'
      objects: { states: unknown }
      arcs: unknown[]
      transform?: unknown
    }
    return feature(topology as never, topology.objects.states as never) as unknown as {
      features: Array<{ id?: string | number; type: 'Feature'; properties: Record<string, unknown>; geometry: never }>
    }
  }, [])

  const path = useMemo(() => geoPath(projection), [projection])
  const wantedStateIds = new Set(caseFile.wantedStates.map((cue) => cue.stateFips))
  const possibleStateIds = new Set(caseFile.possibleStates.map((cue) => cue.stateFips))
  const currentKey = caseFile.currentCue?.key

  const project = (coordinates?: Coordinates) => (coordinates ? projection(coordinates) : null)
  const shreveport = projection([-93.7502, 32.5252])
  const abilene = projection([-99.7331, 32.4487])
  const midpoint = shreveport && abilene
    ? [(shreveport[0] + abilene[0]) / 2, (shreveport[1] + abilene[1]) / 2] as const
    : null

  const markers = [...caseFile.wantedCities, ...caseFile.travelCities]
  if (caseFile.uncertainTravel) markers.push(caseFile.uncertainTravel)

  return (
    <section className={`map-panel ${caseFile.wideAlert ? 'wide-alert' : ''}`}>
      <div className="map-header">
        <div>
          <span className="kicker">Interstate fugitive situation map</span>
          <h2>Known extent of the Johnny Cash problem</h2>
        </div>
        <div className="legend" aria-label="Map legend">
          <span><i className="legend-swatch wanted" />Wanted</span>
          <span><i className="legend-swatch possible" />Possible whereabouts</span>
          <span><i className="legend-dot" />Travel history</span>
        </div>
      </div>

      <div className="map-stage">
        {caseFile.wideAlert && <div className="search-area-stamp">SEARCH AREA: BASICALLY EVERYWHERE</div>}
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Map of places mentioned in Wanted Man">
          <g className="states-layer">
            {states.features.map((state) => {
              const id = String(state.id ?? '').padStart(2, '0')
              const isWanted = wantedStateIds.has(id)
              const isPossible = possibleStateIds.has(id)
              const current = caseFile.currentCue?.stateFips === id
              return (
                <path
                  key={id}
                  d={path(state as never) ?? undefined}
                  className={[
                    'state-shape',
                    isWanted ? 'state-wanted' : '',
                    isPossible ? 'state-possible' : '',
                    current ? 'is-current' : '',
                  ].join(' ')}
                />
              )
            })}
          </g>

          {caseFile.halfway && shreveport && abilene && midpoint && (
            <g className="halfway-group">
              <line x1={shreveport[0]} y1={shreveport[1]} x2={abilene[0]} y2={abilene[1]} />
              <circle cx={midpoint[0]} cy={midpoint[1]} r="24" />
              <text x={midpoint[0]} y={midpoint[1] + 9} textAnchor="middle">?</text>
              <text className="halfway-caption" x={midpoint[0]} y={midpoint[1] - 34} textAnchor="middle">SOME TOWN HALF WAY IN BETWEEN</text>
            </g>
          )}

          {markers.map((cue) => {
            const point = project(cue.coordinates)
            if (!point) return null
            const isWanted = cue.kind === 'wanted-city'
            const isUncertain = cue.kind === 'travel-uncertain'
            const current = currentKey === cue.key
            return (
              <g
                className={`city-marker ${isWanted ? 'wanted-marker' : 'travel-marker'} ${isUncertain ? 'uncertain-marker' : ''} ${current ? 'is-current' : ''}`}
                key={cue.key ?? cue.id}
                transform={`translate(${point[0]} ${point[1]})`}
              >
                <circle className="marker-pulse" r="17" />
                <circle className="marker-core" r="6" />
                <text x="11" y="-10">{cue.label}</text>
              </g>
            )
          })}

          {caseFile.mysteryTown && (
            <g className={`mystery-town ${currentKey === caseFile.mysteryTown.key ? 'is-current' : ''}`} transform="translate(704 264)">
              <circle r="26" />
              <text y="9" textAnchor="middle">?</text>
              <text className="mystery-label" x="36" y="5">THIS NEXT TOWN</text>
            </g>
          )}
        </svg>
      </div>

      <div className="map-footer">
        <span>Confirmed complaints: {caseFile.wantedStates.length + caseFile.wantedCities.length + (caseFile.mysteryTown ? 1 : 0)}</span>
        <span>Possible whereabouts: {caseFile.possibleStates.length}</span>
        <span>Location confidence: {caseFile.halfway ? 'poor' : caseFile.possibleStates.length ? 'questionable' : 'pending'}</span>
      </div>
    </section>
  )
}

const Player = ({
  videoId,
  onTime,
  onDuration,
  onController,
}: {
  videoId: string
  onTime: (time: number) => void
  onDuration: (duration: number) => void
  onController: (player: YTPlayer | null) => void
}) => {
  const hostRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let player: YTPlayer | null = null
    let timer: number | undefined
    let cancelled = false

    loadYouTubeApi().then((YT) => {
      if (cancelled || !hostRef.current) return
      player = new YT.Player(hostRef.current, {
        videoId,
        playerVars: { rel: 0, modestbranding: 1 },
        events: {
          onReady: () => {
            if (!player) return
            onController(player)
            onDuration(player.getDuration() || NOMINAL_DURATION)
            onTime(player.getCurrentTime())
          },
          onStateChange: (event) => {
            if (!player) return
            window.clearInterval(timer)
            if (event.data === YT.PlayerState.PLAYING) {
              timer = window.setInterval(() => {
                if (!player) return
                onTime(player.getCurrentTime())
                onDuration(player.getDuration() || NOMINAL_DURATION)
              }, 120)
            } else {
              onTime(player.getCurrentTime())
            }
          },
          onError: () => setError(true),
        },
      })
    })

    return () => {
      cancelled = true
      window.clearInterval(timer)
      onController(null)
      player?.destroy()
    }
  }, [onController, onDuration, onTime, videoId])

  return (
    <div className="player-frame">
      <div ref={hostRef} className="youtube-host" />
      {error && (
        <div className="player-error">
          YouTube declined to load this recording. The timeline scrubber still works for previewing the case file.
        </div>
      )}
    </div>
  )
}

function App() {
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(NOMINAL_DURATION)
  const [player, setPlayer] = useState<YTPlayer | null>(null)
  const [cueOffset, setCueOffset] = useState(DEFAULT_CUE_OFFSET)
  const [showCalibration, setShowCalibration] = useState(false)
  const caseFile = useMemo(() => stateAt(time, cueOffset), [cueOffset, time])

  const stableSetTime = useMemo(() => (value: number) => setTime(value), [])
  const stableSetDuration = useMemo(() => (value: number) => setDuration(value), [])
  const stableSetPlayer = useMemo(() => (value: YTPlayer | null) => setPlayer(value), [])

  const seek = (next: number) => {
    const value = Math.max(0, Math.min(duration, next))
    setTime(value)
    player?.seekTo(value, true)
  }

  const allFacts = caseFile.facts
  const currentLabel = caseFile.currentCue?.label ?? 'Awaiting first report'
  const nextCue = timeline.find((cue) => cue.at > time + cueOffset)

  return (
    <main className="app-shell">
      <header className="masthead">
        <div className="badge">CASE # JC-01</div>
        <div className="title-lockup">
          <span className="kicker">Fugitive tracking system · musical intelligence division</span>
          <h1>WANTED MAN</h1>
          <p>A needlessly serious geographic investigation of Johnny Cash.</p>
        </div>
        <div className="status-block">
          <span>Fugitive status</span>
          <strong><i /> WANTED</strong>
          <small>Last intelligence: {currentLabel}</small>
        </div>
      </header>

      <div className="dashboard-grid">
        <MapPanel caseFile={caseFile} />

        <aside className="case-sidebar">
          <WantedChecklist caseFile={caseFile} />
          <Checklist
            title="Who wants Johnny"
            eyebrow="Persons of interest"
            items={caseFile.people}
            empty="No named individuals have entered the case yet."
          />
          <Checklist
            title="Good to know"
            eyebrow="Operational intelligence"
            items={allFacts}
            empty="Intelligence analysts are sharpening their pencils."
          />
        </aside>
      </div>

      <section className="player-dock">
        <Player
          videoId={DEFAULT_VIDEO_ID}
          onTime={stableSetTime}
          onDuration={stableSetDuration}
          onController={stableSetPlayer}
        />
        <div className="transport-panel">
          <div className="now-reporting">
            <span>Now reporting</span>
            <strong>{currentLabel}</strong>
            <small>{nextCue ? `Next case update around ${formatTime(Math.max(0, nextCue.at - cueOffset))}` : 'No further reports filed.'}</small>
          </div>

          <div className="scrubber-row">
            <span>{formatTime(time)}</span>
            <input
              aria-label="Song position"
              type="range"
              min="0"
              max={Math.max(duration, 1)}
              step="0.1"
              value={Math.min(time, duration)}
              onChange={(event) => seek(Number(event.target.value))}
            />
            <span>{formatTime(duration)}</span>
          </div>

          <button className="calibration-toggle" type="button" onClick={() => setShowCalibration((value) => !value)}>
            {showCalibration ? 'Hide sync calibration' : 'Sync a little off? Calibrate'}
          </button>
          {showCalibration && (
            <div className="calibration-panel">
              <label>
                Cue offset
                <input
                  type="number"
                  step="0.1"
                  value={cueOffset}
                  onChange={(event) => setCueOffset(Number(event.target.value))}
                />
                <span>seconds</span>
              </label>
              <p>Positive values make map/checklist cues happen earlier relative to the audio; negative values make them happen later.</p>
            </div>
          )}
        </div>
      </section>

      <footer>
        Built as a visual joke and geography experiment. Audio/video is played by YouTube; this page does not reproduce the song lyrics.
      </footer>
    </main>
  )
}

export default App
