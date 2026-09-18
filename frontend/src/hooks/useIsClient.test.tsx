import { renderHook } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { useIsClient } from './useIsClient';

function Probe(): React.JSX.Element {
  return <span>{useIsClient() ? 'client' : 'server'}</span>;
}

describe('useIsClient', () => {
  it('ブラウザでの描画では true', () => {
    const { result } = renderHook(() => useIsClient());
    expect(result.current).toBe(true);
  });

  it('サーバー描画では false', () => {
    expect(renderToString(<Probe />)).toContain('server');
  });
});
