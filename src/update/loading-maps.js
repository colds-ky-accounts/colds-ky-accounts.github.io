// @ts-check

import React from 'react';

import { LetterLayout } from './letter-layout';

/** @param {{ progress?: import('../api/indexed/maps').Progress<import('../api/indexed/maps').CompactMap> }} _ */
export function LoadingMaps({ progress }) {
  console.log('<LoadingMaps ', progress, '>');
  return (
    <LetterLayout
      title='Account indices...'
      subtitle={
        !progress ? undefined :
          <>{progress.pending.length} to go</>
      }
      status='Loading index maps.'>
      {
        ({ letter }) => {
          const letterProgress = progress?.byLetter[letter];
          return <LetterProgress letterProgress={letterProgress} />;
        }
      }
      </LetterLayout>
  );
}

/** @param {{ letterProgress: import('../api/indexed/maps').LoadingLetterMapProgress<import('../api/indexed/maps').CompactMap> | undefined }} _ */
export function LetterProgress({ letterProgress }) {
  console.log('letterProgress', letterProgress);
  switch (letterProgress?.state) {
    case undefined:
    case 'missing':
      return '?';

    case 'error':
      return <span title={letterProgress.error.stack || letterProgress.error.message}>!</span>;

    case 'loading':
      return '~';

    case 'loaded':
      return (
        <div style={{ writingMode: 'vertical-rl', fontSize: '80%', textShadow: 'none', paddingTop: '1em' }}>
          {Object.keys(letterProgress.map).length.toLocaleString()} entries
        </div>
      );
  }
  return '';
}
