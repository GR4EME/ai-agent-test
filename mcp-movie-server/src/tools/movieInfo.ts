import { MovieSearchResult, MovieDetails, Genre } from '../tmdbTypes.js';
import { ToolDefinition, validateInput, formatSuccess } from './baseTool.js';
import { TmdbClient } from '../utils/tmdbClient.js';
import {
  MovieInfoInputSchema,
  MovieInfoInput,
  MovieInfoOutputSchema,
  MovieInfoOutput,
} from './schemas.js';

const executeMovieInfo =
  (tmdbClient: TmdbClient) =>
  async (
    input: unknown
  ): Promise<{
    content: Array<{ type: 'text'; text: string }>;
    isError?: boolean;
    data?: MovieInfoOutput;
  }> => {
    const validator = validateInput<MovieInfoInput>(MovieInfoInputSchema.shape);
    const successFormatter = formatSuccess('get_movie_info');

    const { title } = validator(input);
    const search = await tmdbClient<MovieSearchResult>('/search/movie', { query: title });

    if (!search.results || search.results.length === 0) {
      return successFormatter(`No movie found for '${title}'.`);
    }

    const movie = search.results[0];
    const details = await tmdbClient<MovieDetails>(`/movie/${movie.id}`, {});
    const genres = (details.genres || []).map((g: Genre) => g.name);

    const result: MovieInfoOutput = {
      title: details.title,
      release: details.release_date,
      overview: details.overview,
      rating: details.vote_average,
      genres,
    };

    MovieInfoOutputSchema.parse(result);
    const text = `Title: ${result.title}\nRelease: ${result.release}\nOverview: ${result.overview}\nRating: ${result.rating}\nGenres: ${result.genres.join(', ')}`;
    return { ...successFormatter(text), data: result };
  };

export const movieInfoToolDefinition: ToolDefinition = {
  config: {
    name: 'get_movie_info',
    title: 'Get Movie Information',
    description: 'Returns information about a specific movie by title.',
    inputSchema: MovieInfoInputSchema.shape,
  },
  execute: executeMovieInfo,
};
