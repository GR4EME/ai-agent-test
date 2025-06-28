import { describe, it, expect, jest } from '@jest/globals';
import { movieInfoToolDefinition } from '../movieInfo.js';
import { createTool } from '../baseTool.js';
import type { TmdbClient } from '../../utils/tmdbClient.js';

describe('MovieInfoTool', () => {
  const mockTmdbFetch = jest.fn() as unknown as TmdbClient;
  const tool = createTool(movieInfoToolDefinition, mockTmdbFetch);

  it('returns movie info for a valid title', async () => {
    (mockTmdbFetch as any).mockImplementationOnce(() =>
      Promise.resolve({
        results: [{ id: 1 }],
      })
    );
    (mockTmdbFetch as any).mockImplementationOnce(() =>
      Promise.resolve({
        title: 'Inception',
        release_date: '2010-07-16',
        overview: 'A mind-bending thriller.',
        vote_average: 8.8,
        genres: [{ name: 'Action' }, { name: 'Sci-Fi' }],
      })
    );
    const result = await tool.execute({ title: 'Inception' });
    expect(result.isError).not.toBe(true);
    expect(result.data).toMatchObject({
      title: 'Inception',
      release: '2010-07-16',
      overview: 'A mind-bending thriller.',
      rating: 8.8,
      genres: ['Action', 'Sci-Fi'],
    });
  });

  it('returns an error if no movie is found', async () => {
    (mockTmdbFetch as any).mockImplementationOnce(() => Promise.resolve({ results: [] }));
    const result = await tool.execute({ title: 'Nonexistent Movie' });
    expect(result.isError).not.toBe(true);
    expect(result.content[0].text).toMatch(/No movie found/);
  });
});
