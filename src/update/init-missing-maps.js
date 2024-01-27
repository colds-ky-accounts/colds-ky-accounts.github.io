// @ts-check

import React, { useMemo, useState } from 'react';
import { letters } from '../api/indexed';
import { Button, TextField } from '@mui/material';
import { createOriginalMap, storeNewMap } from '../api/indexed/maps';
import { forAwait } from '../api/forAwait';

/**
 * @param {{
 *  maps: { [letter: string]: import('../api/indexed/maps').LetterMap}
 * }} _
 */
export function InitMissingMaps({ maps }) {
  const mapsState = forAwait(maps, updateMaps);
  const mapCount = useMemo(() => {
    let mapCount = 0;
    for (const letter of letters) {
      if (maps?.[letter]) mapCount++;
    }
    return mapCount;
  }, [maps]);

  const [auth, setAuth] = useState('');

  return (
    <>
      <h2>Account index:
        {
          !mapCount ? undefined : <>{mapCount} maps exist,</>
        }
      {
          !mapsState ? undefined :
            <>{mapsState.pending} to go</>
      }
      </h2>
      <Button variant='contained' onClick={() => {
        mapsState?.applyWithAuth(auth);
      }}>Start</Button>
      <TextField
        label='GitHub auth token'
        autoComplete='on'
        value={auth}
        onChange={e => setAuth(e.target.value)} />
      {!mapsState ? undefined :
        <div>
          {
            mapsState.state.map((map, index) => 
              <span
                className='letter-state'
                title={map.state === 'error' ? map.error.stack : undefined}
                key={map.letter}>{map.letter} <b>{map.state} </b>
              </span>
            )
          }
        </div>
      }
    </>
  );
}

export function AuthEntry({ auth, setAuth, disabled, onStart }) {
  return (
    <>
      <Button variant='contained' onClick={onStart}>Start</Button>
      <TextField
        label='GitHub auth token'
        autoComplete='on'
        value={auth}
        onChange={e => setAuth(e.target.value)} />
    </>
  );
}

/** @param {{ [letter: string]: import('../api/indexed/maps').LetterMap}} maps */
async function* updateMaps(maps) {
  let applyWithAuth = (auth) => { };
  let authPromise = new Promise(resolve => applyWithAuth = resolve);

    let yieldResolve = () => { };
    /** @type {Promise<void>} */
    let yieldPromise = new Promise(resolve => yieldResolve = resolve);

    let pending = 0;

    /**
     * @type {(
     *  (import('../api/indexed/maps').LetterMap & {state?: undefined }) |
     *  (import('../api/indexed/maps').LetterMap & {state: 'new' }) |
     *  (import('../api/indexed/maps').LetterMap & {state: 'error', error: Error }) |
     *  (import('../api/indexed/maps').LetterMap & {state: 'updated' }) |
     *  { letter: string, state: 'fetching' }
     * )[]}
     */
    const state = letters.split('').map(letter =>
      maps[letter] || workLetter(letter));

    while (pending) {
      await yieldPromise;
      yieldPromise = new Promise(resolve => yieldResolve = resolve);

      yield { state, pending, applyWithAuth };
    }


    /** @param {string} letter */
  function workLetter(letter) {
    pending++;
    const index = letters.indexOf(letter);

    const result = { letter, state: 'fetching' };
    startFetching();
    return result;

    async function startFetching() {
      const newMap = await createOriginalMap(letter);
      state[index] = /** @type {*} */({ ...newMap, state: 'new' });
      yieldResolve();

      while (true) {
        const authPromiseToGo = authPromise;
        const auth = await authPromiseToGo;
        try {
          await storeNewMap({ letter, map: newMap, auth });
          state[index] = /** @type {*} */({ ...newMap, state: 'updated' });
          pending--;
          yieldResolve();
          break;
        } catch (error) {
          state[index] = /** @type {*} */({ ...newMap, state: 'error', error });
          if (authPromise === authPromiseToGo)
            authPromise = new Promise(resolve => applyWithAuth = resolve);
          yieldResolve();
        }
      }
    }
  }
}