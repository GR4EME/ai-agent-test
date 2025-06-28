import { TopRatedMovies } from '../tmdbTypes.js';
import { BaseTool } from './baseTool.js';
import { TmdbClient } from '../utils/tmdbClient.js';
import { TopRatedMoviesInputSchema, TopRatedMoviesInput, TopRatedMoviesOutputSchema, TopRatedMoviesOutput } from './schemas.js';

export class TopRatedMoviesTool extends BaseTool {
  constructor(tmdbFetch: TmdbClient) {
    super(tmdbFetch, {
      name: 'get_top_rated_movies',
      title: 'Get Top Rated Movies',
      description: 'Returns a list of top-rated movies.',
      inputSchema: TopRatedMoviesInputSchema.shape,
    });
  }

  async execute(input: unknown): Promise<{ content: Array<{ type: 'text'; text: string }>; isError?: boolean; data?: TopRatedMoviesOutput }> {
    const { limit = 10 } = this.validateInput<TopRatedMoviesInput>(input);

    const data = await this.tmdbFetch<TopRatedMovies>('/movie/top_rated', { page: '1' });
    if (!data.results || data.results.length === 0) {
      return this.formatSuccess('No top-rated movies found.');
    }

    const movies = data.results
      .slice(0, limit)
      .map((m) => ({
        title: m.title,
        releaseDate: m.release_date,
        rating: m.vote_average,
        overview: undefined, // Not available in TopRatedMovies
      }));

    const result: TopRatedMoviesOutput = {
      movies,
      totalCount: data.results.length,
    };

    // Validate output
    TopRatedMoviesOutputSchema.parse(result);

    const list = movies
      .map((m) => `${m.title} (${m.releaseDate ? m.releaseDate.substring(0, 4) : 'N/A'}) - Rating: ${m.rating}`)
      .join('\n');

    const text = `Top Rated Movies (showing up to ${limit}):\n${list}`;
    
    return { ...this.formatSuccess(text), data: result };
  }
}

 