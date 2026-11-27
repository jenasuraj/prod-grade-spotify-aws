import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { formatTime } from '../../utils/helpers';
import AudioPlayer from './AudioPlayer';

describe('AudioPlayer', () => {
  beforeEach(() => {
    jest.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
    jest.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined);
  });

  afterEach(() => jest.restoreAllMocks());

  it('plays the real audio element and shows its duration once the metadata loads', async () => {
    const { container } = render(<AudioPlayer src="https://s3/song?read" title="First light" />);
    const audio = container.querySelector('audio')!;
    Object.defineProperty(audio, 'duration', { value: 125 });
    fireEvent.loadedMetadata(audio);
    expect(screen.getByText('2:05')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Play First light' }));
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalled();
    fireEvent.play(audio);
    expect(screen.getByRole('button', { name: 'Pause First light' })).toBeInTheDocument();
  });

  it('says the audio is unavailable when the file cannot load', () => {
    const { container } = render(<AudioPlayer src="https://s3/missing" title="First light" />);
    fireEvent.error(container.querySelector('audio')!);
    expect(screen.getByText('Audio unavailable')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Play First light' })).toBeDisabled();
  });

  it('formats times as m:ss', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(61.9)).toBe('1:01');
    expect(formatTime(Number.NaN)).toBe('0:00');
  });
});
