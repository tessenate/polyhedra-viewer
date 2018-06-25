// @flow
import * as React from 'react';
import { StyleSheet, css } from 'aphrodite/no-important';
import x3dom from 'x3dom.js';
import 'x3dom/x3dom.css';

// Disable double-clicking to change rotation point
if (x3dom.Viewarea) {
  x3dom.Viewarea.prototype.onDoubleClick = () => {};
}

const styles = StyleSheet.create({
  x3dScene: {
    border: 'none',
    height: '100%',
    width: '100%',
  },

  smol: {
    height: 400,
  },
});

interface Props {
  smol?: boolean;
  children: React.Node;
}

export default class X3dScene extends React.Component<Props> {
  componentDidMount() {
    // Reload X3DOM asynchronously so that it tracks the re-created instance
    setTimeout(() => x3dom.reload());
  }

  render() {
    const { smol = false } = this.props;
    return (
      <x3d className={css(styles.x3dScene, !!smol && styles.smol)}>
        <scene>
          <viewpoint position="0,0,5" />
          {this.props.children}
        </scene>
      </x3d>
    );
  }
}