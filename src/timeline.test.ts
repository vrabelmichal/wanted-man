import { describe, expect, it } from 'vitest'
import { stateAt } from './timeline'

describe('stateAt', () => {
  it('starts with an empty case file', () => {
    const state = stateAt(0)
    expect(state.wantedStates).toHaveLength(0)
    expect(state.people).toHaveLength(0)
  })

  it('reveals California at about 14 seconds', () => {
    expect(stateAt(13.9).wantedStates).toHaveLength(0)
    expect(stateAt(14).wantedStates.map((cue) => cue.key)).toEqual(['california'])
  })

  it('reconstructs state from a timestamp', () => {
    const state = stateAt(63)
    expect(state.people.map((cue) => cue.label)).toEqual([
      'Lucy Watson',
      'Jeannie Brown',
      'Nellie Johnson',
    ])
    expect(state.wantedStates.map((cue) => cue.label)).toContain('California')
  })

  it('naturally rewinds when given an earlier timestamp', () => {
    expect(stateAt(129).wantedCities.some((cue) => cue.key === 'baton-rouge')).toBe(true)
    expect(stateAt(108).wantedCities.some((cue) => cue.key === 'baton-rouge')).toBe(false)
  })

  it('deduplicates repeated refrain locations', () => {
    const final = stateAt(170)
    expect(final.wantedStates.filter((cue) => cue.key === 'california')).toHaveLength(1)
    expect(final.wantedCities.filter((cue) => cue.key === 'buffalo')).toHaveLength(1)
  })
})
