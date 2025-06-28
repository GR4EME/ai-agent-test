import { MovieInfoTool } from '../movieInfo.js';

describe('MovieInfoTool', () => {
  const mockTmdbFetch = jest.fn();
  const tool = new MovieInfoTool(mockTmdbFetch);

  it('returns movie info for a valid title', async () => {
    mockTmdbFetch.mockImplementationOnce(() => Promise.resolve({
      results: [{ id: 1 }],
    }));
    mockTmdbFetch.mockImplementationOnce(() => Promise.resolve({
      title: 'Inception',
      release_date: '2010-07-16',
      overview: 'A mind-bending thriller.',
      vote_average: 8.8,
      genres: [{ name: 'Action' }, { name: 'Sci-Fi' }],
    }));
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
    mockTmdbFetch.mockImplementationOnce(() => Promise.resolve({ results: [] }));
    const result = await tool.execute({ title: 'Nonexistent Movie' });
    expect(result.isError).not.toBe(true);
    expect(result.content[0].text).toMatch(/No movie found/);
  });
}); 