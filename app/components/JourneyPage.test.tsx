import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import JourneyPage from './JourneyPage';

describe('JourneyPage', () => {
  it('renders unlocked achievements in Journey Records', () => {
    render(
      <JourneyPage
        achievements={['Achievement Unlocked: Stitch Lineage Guardian']}
      />,
    );

    expect(screen.getByText('Journey Records')).toBeInTheDocument();
    expect(
      screen.getByText('Achievement Unlocked: Stitch Lineage Guardian'),
    ).toBeInTheDocument();
  });
});
