export type Coordinates = readonly [longitude: number, latitude: number]

export type CueKind =
  | 'wanted-state'
  | 'wanted-city'
  | 'possible-state'
  | 'person'
  | 'fact'
  | 'mystery-town'
  | 'halfway'
  | 'travel-city'
  | 'travel-uncertain'
  | 'wide-alert'

export type Cue = {
  id: string
  at: number
  kind: CueKind
  label: string
  key?: string
  stateFips?: string
  coordinates?: Coordinates
  note?: string
}

export type CaseFileState = {
  activeCues: Cue[]
  currentCue?: Cue
  wantedStates: Cue[]
  wantedCities: Cue[]
  possibleStates: Cue[]
  people: Cue[]
  facts: Cue[]
  travelCities: Cue[]
  mysteryTown?: Cue
  halfway?: Cue
  uncertainTravel?: Cue
  wideAlert: boolean
}

const city = (longitude: number, latitude: number): Coordinates => [longitude, latitude]

export const DEFAULT_VIDEO_ID = import.meta.env.VITE_YOUTUBE_VIDEO_ID ?? 'O6JWXqE8W9E'
export const DEFAULT_CUE_OFFSET = Number(import.meta.env.VITE_CUE_OFFSET_SECONDS ?? 0)
export const NOMINAL_DURATION = 170

// Approximate cue timings for the 1971 studio recording. The first geographic cue
// is aligned to the end of "California" at about 0:14; later cues preserve the same
// relative spacing. They are centralized so further listen-through tuning stays simple.
export const timeline: Cue[] = [
  { id: 'ca-1', at: 14.0, kind: 'wanted-state', label: 'California', key: 'california', stateFips: '06' },
  { id: 'buffalo-1', at: 17.2, kind: 'wanted-city', label: 'Buffalo, NY', key: 'buffalo', coordinates: city(-78.8784, 42.8864) },
  { id: 'kansas-city-1', at: 20.4, kind: 'wanted-city', label: 'Kansas City', key: 'kansas-city', coordinates: city(-94.5786, 39.0997), note: 'Metro straddles Missouri and Kansas. Johnny declined to clarify.' },
  { id: 'ohio-1', at: 23.6, kind: 'wanted-state', label: 'Ohio', key: 'ohio', stateFips: '39' },
  { id: 'mississippi-1', at: 27.0, kind: 'wanted-state', label: 'Mississippi', key: 'mississippi', stateFips: '28' },
  { id: 'cheyenne-1', at: 30.4, kind: 'wanted-city', label: 'Cheyenne, WY', key: 'cheyenne', coordinates: city(-104.8202, 41.14) },
  { id: 'wide-alert-1', at: 34.8, kind: 'wide-alert', label: 'Search area expanded: wherever you look' },

  { id: 'colorado-possible', at: 41.6, kind: 'possible-state', label: 'Colorado', key: 'colorado', stateFips: '08', note: 'Possible whereabouts, not a confirmed wanted jurisdiction.' },
  { id: 'georgia-possible', at: 44.6, kind: 'possible-state', label: 'Georgia by the sea', key: 'georgia', stateFips: '13', note: 'Possible whereabouts. Coastal specificity: technically useful.' },
  { id: 'unknown-employer', at: 49.1, kind: 'fact', label: 'Possible employer may have no idea who Johnny is', key: 'unknown-employer' },
  { id: 'do-not-report', at: 55.8, kind: 'fact', label: 'Witness cooperation strongly discouraged by suspect', key: 'do-not-report' },
  { id: 'on-the-lam', at: 59.8, kind: 'fact', label: 'Johnny is on the lam', key: 'on-the-lam' },

  { id: 'lucy', at: 64.6, kind: 'person', label: 'Lucy Watson', key: 'lucy-watson' },
  { id: 'jeannie', at: 67.8, kind: 'person', label: 'Jeannie Brown', key: 'jeannie-brown' },
  { id: 'nellie', at: 71.0, kind: 'person', label: 'Nellie Johnson', key: 'nellie-johnson' },
  { id: 'next-town', at: 74.1, kind: 'mystery-town', label: 'This next town', key: 'next-town', note: 'Identity currently unavailable. Probability of trouble: high.' },

  { id: 'bad-decisions', at: 82.6, kind: 'fact', label: 'Some previous acquisitions turned out bad', key: 'bad-decisions' },
  { id: 'el-paso', at: 90.6, kind: 'travel-city', label: 'El Paso, TX', key: 'el-paso', coordinates: city(-106.485, 31.7619) },
  { id: 'has-map', at: 93.8, kind: 'fact', label: 'Johnny has a map', key: 'has-map' },
  { id: 'pleura', at: 97.0, kind: 'travel-uncertain', label: 'Pleura? / Juárez?', key: 'pleura', coordinates: city(-106.485, 31.69), note: 'Travel intelligence is disputed. The map has not improved matters.' },
  { id: 'map-failed', at: 97.8, kind: 'fact', label: 'The map did not improve navigation', key: 'map-failed' },
  { id: 'juanita', at: 99.1, kind: 'fact', label: 'Juanita is involved somehow', key: 'juanita' },
  { id: 'shreveport', at: 103.6, kind: 'travel-city', label: 'Shreveport, LA', key: 'shreveport', coordinates: city(-93.7502, 32.5252) },
  { id: 'abilene', at: 107.1, kind: 'travel-city', label: 'Abilene, TX', key: 'abilene', coordinates: city(-99.7331, 32.4487) },
  { id: 'sleeping-transit', at: 107.6, kind: 'fact', label: 'Johnny can sleep through significant interstate travel', key: 'sleeping-transit' },
  { id: 'halfway', at: 111.6, kind: 'halfway', label: 'Some town halfway in between', key: 'halfway', note: 'Exact municipality unknown. Draw a line and put a question mark on it.' },
  { id: 'why-wanted', at: 112.6, kind: 'fact', label: 'Johnny does not know why he is wanted there', key: 'why-wanted' },

  { id: 'albuquerque', at: 118.1, kind: 'wanted-city', label: 'Albuquerque, NM', key: 'albuquerque', coordinates: city(-106.6504, 35.0844) },
  { id: 'syracuse', at: 121.3, kind: 'wanted-city', label: 'Syracuse, NY', key: 'syracuse', coordinates: city(-76.1474, 43.0481) },
  { id: 'tallahassee', at: 124.5, kind: 'wanted-city', label: 'Tallahassee, FL', key: 'tallahassee', coordinates: city(-84.2807, 30.4383) },
  { id: 'baton-rouge', at: 127.7, kind: 'wanted-city', label: 'Baton Rouge, LA', key: 'baton-rouge', coordinates: city(-91.1403, 30.4515) },
  { id: 'grab-anywhere', at: 131.6, kind: 'fact', label: 'Somebody is apparently set to grab Johnny anywhere', key: 'grab-anywhere' },
  { id: 'confidence-low', at: 137.6, kind: 'fact', label: 'Current-location confidence: deteriorating', key: 'confidence-low' },

  // Final refrain: repeated cues intentionally reuse place keys so the checklist
  // remains deduplicated while the map can still flash each place again.
  { id: 'ca-2', at: 145.6, kind: 'wanted-state', label: 'California', key: 'california', stateFips: '06' },
  { id: 'buffalo-2', at: 148.8, kind: 'wanted-city', label: 'Buffalo, NY', key: 'buffalo', coordinates: city(-78.8784, 42.8864) },
  { id: 'kansas-city-2', at: 152.0, kind: 'wanted-city', label: 'Kansas City', key: 'kansas-city', coordinates: city(-94.5786, 39.0997) },
  { id: 'ohio-2', at: 155.2, kind: 'wanted-state', label: 'Ohio', key: 'ohio', stateFips: '39' },
  { id: 'mississippi-2', at: 158.4, kind: 'wanted-state', label: 'Mississippi', key: 'mississippi', stateFips: '28' },
  { id: 'cheyenne-2', at: 161.6, kind: 'wanted-city', label: 'Cheyenne, WY', key: 'cheyenne', coordinates: city(-104.8202, 41.14) },
  { id: 'wide-alert-2', at: 166.6, kind: 'wide-alert', label: 'Search area remains: basically everywhere' },
]

const uniqueByKey = (cues: Cue[]) => {
  const seen = new Set<string>()
  return cues.filter((cue) => {
    const key = cue.key ?? cue.id
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export const stateAt = (time: number, offset = 0): CaseFileState => {
  const adjustedTime = Math.max(0, time + offset)
  const activeCues = timeline.filter((cue) => cue.at <= adjustedTime)
  const currentCue = [...activeCues].reverse().find((cue) => adjustedTime - cue.at < 2.4)

  return {
    activeCues,
    currentCue,
    wantedStates: uniqueByKey(activeCues.filter((cue) => cue.kind === 'wanted-state')),
    wantedCities: uniqueByKey(activeCues.filter((cue) => cue.kind === 'wanted-city')),
    possibleStates: uniqueByKey(activeCues.filter((cue) => cue.kind === 'possible-state')),
    people: uniqueByKey(activeCues.filter((cue) => cue.kind === 'person')),
    facts: uniqueByKey(activeCues.filter((cue) => cue.kind === 'fact')),
    travelCities: uniqueByKey(activeCues.filter((cue) => cue.kind === 'travel-city')),
    mysteryTown: activeCues.find((cue) => cue.kind === 'mystery-town'),
    halfway: activeCues.find((cue) => cue.kind === 'halfway'),
    uncertainTravel: activeCues.find((cue) => cue.kind === 'travel-uncertain'),
    wideAlert: activeCues.some((cue) => cue.kind === 'wide-alert'),
  }
}
