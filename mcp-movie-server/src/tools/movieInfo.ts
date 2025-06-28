import { MovieSearchResult, MovieDetails, Genre } from '../tmdbTypes.js';
import { BaseTool } from './baseTool.js';
import { TmdbClient } from '../utils/tmdbClient.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { MovieInfoInputSchema, MovieInfoInput, MovieInfoOutputSchema, MovieInfoOutput } from './schemas.js';

export class MovieInfoTool extends BaseTool {
  constructor(tmdbFetch: TmdbClient) {
    super(tmdbFetch, {
      name: 'get_movie_info',
      title: 'Get Movie Information',
      description: 'Returns information about a specific movie by title.',
      inputSchema: MovieInfoInputSchema.shape,
    });
  }

  async execute(input: unknown): Promise<{ content: Array<{ type: 'text'; text: string }>; isError?: boolean; data?: MovieInfoOutput }> {
    const { title } = this.validateInput<MovieInfoInput>(input);
    const search = await this.tmdbFetch<MovieSearchResult>('/search/movie', { query: title });
    if (!search.results || search.results.length === 0) {
      return this.formatSuccess(`No movie found for '${title}'.`);
    }
    const movie = search.results[0];
    const details = await this.tmdbFetch<MovieDetails>(`/movie/${movie.id}`, {});
    const genres = (details.genres || []).map((g: Genre) => g.name);
    const result: MovieInfoOutput = {
      title: details.title,
      release: details.release_date,
      overview: details.overview,
      rating: details.vote_average,
      genres,
    };
    // Validate output
    MovieInfoOutputSchema.parse(result);
    const text = `Title: ${result.title}\nRelease: ${result.release}\nOverview: ${result.overview}\nRating: ${result.rating}\nGenres: ${result.genres.join(', ')}`;
    return { ...this.formatSuccess(text), data: result };
  }
}

 