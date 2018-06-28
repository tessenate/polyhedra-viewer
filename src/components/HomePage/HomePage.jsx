// @flow strict
import React from 'react';
import { css, StyleSheet } from 'aphrodite/no-important';

import splash from 'splash.mp4';
import { media, fonts } from 'styles';
import { type TableSection as TableSectionType } from 'constants/polyhedronTables';
import { DeviceTracker } from 'components/DeviceContext';

import Markdown from './Markdown';
import TableSection from './TableSection';
import tableSections from './tableSections';
import * as text from './text';

const videoHeight = 400;

const styles = StyleSheet.create({
  homePage: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },

  main: {
    width: '100%',
  },

  abstract: {
    maxWidth: 600,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },

  masthead: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    boxShadow: 'inset 0 -1px 4px LightGray',
    padding: '20px 50px',

    [media.mobile]: {
      flexDirection: 'column-reverse',
    },
  },

  authorLink: {
    textDecoration: 'none',
    ':hover': {
      textDecoration: 'underline',
    },
  },

  video: {
    marginRight: 10,
    // make smaller to hide weird video artifacts
    height: videoHeight - 2,
    width: videoHeight - 2,
    overflow: 'hidden',
    display: 'flex',
    justifyContent: 'center',
  },

  title: {
    marginTop: 20,
    marginBottom: 15,
    fontSize: 36,
    textAlign: 'center',
    fontWeight: 'bold',
    fontFamily: fonts.andaleMono,

    [media.mobile]: {
      fontSize: 24,
    },
  },

  subtitle: {
    fontSize: 16,
    fontFamily: fonts.andaleMono,
    marginBottom: 20,
    fontColor: 'dimGray',
  },

  sections: {
    paddingTop: 50,
  },

  footer: {
    boxShadow: 'inset 1px 1px 4px LightGray',
    width: '100%',
    padding: '20px 50px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
});

interface Props {
  data: TableSectionType[];
  narrow?: boolean;
}

function HomePage({ data, narrow = false }: Props) {
  return (
    <div className={css(styles.homePage)}>
      <main className={css(styles.main)}>
        <div className={css(styles.masthead)}>
          <div className={css(styles.abstract)}>
            <h1 className={css(styles.title)}>Polyhedra Viewer</h1>
            <p className={css(styles.subtitle)}>
              by{' '}
              <a
                className={css(styles.authorLink)}
                href="https://github.com/tesseralis"
              >
                @tesseralis
              </a>
            </p>
            <Markdown source={text.abstract} />
          </div>
          <div className={css(styles.video)}>
            <video muted autoPlay src={splash} height={videoHeight} />
          </div>
        </div>
        <div className={css(styles.sections)}>
          {data.map(sectionData => (
            <TableSection
              narrow={narrow}
              key={sectionData.header}
              data={sectionData}
            />
          ))}
        </div>
      </main>
      <footer className={css(styles.footer)}>
        <Markdown source={text.footer} />
      </footer>
    </div>
  );
}

export default () => {
  return (
    <DeviceTracker
      renderDesktop={() => <HomePage data={tableSections} />}
      renderMobile={({ orientation }) => (
        <HomePage narrow={orientation === 'portrait'} data={tableSections} />
      )}
    />
  );
};
