import { TopRatedMovies } from '../tmdbTypes.js';
import { ToolDefinition, validateInput, formatSuccess } from './baseTool.js';
import { TmdbClient } from '../utils/tmdbClient.js';
import {
  TopRatedMoviesInputSchema,
  TopRatedMoviesInput,
  TopRatedMoviesOutputSchema,
  TopRatedMoviesOutput,
} from './schemas.js';

interface TopRatedMovieItem {
  title: string;
  release_date?: string;
  vote_average: number;
}

interface FormattedMovie {
  title: string;
  releaseDate?: string;
  rating: number;
  overview: undefined;
}

const formatTopRatedMovies = (movies: TopRatedMovieItem[], limit: number) =>
  movies.slice(0, limit).map((m) => ({
    title: m.title,
    releaseDate: m.release_date,
    rating: m.vote_average,
    overview: undefined,
  }));

const formatMoviesList = (movies: FormattedMovie[]) =>
  movies
    .map(
      (m) =>
        `${m.title} (${m.releaseDate ? m.releaseDate.substring(0, 4) : 'N/A'}) - Rating: ${m.rating}`
    )
    .join('\n');

const executeTopRatedMovies =
  (tmdbClient: TmdbClient) =>
  async (
    input: unknown
  ): Promise<{
    content: Array<{ type: 'text'; text: string }>;
    isError?: boolean;
    data?: TopRatedMoviesOutput;
  }> => {
    const validator = validateInput<TopRatedMoviesInput>(TopRatedMoviesInputSchema.shape);
    const successFormatter = formatSuccess('get_top_rated_movies');

    const { limit = 10 } = validator(input);
    const data = await tmdbClient<TopRatedMovies>('/movie/top_rated', { page: '1' });

    if (!data.results || data.results.length === 0) {
      return successFormatter('No top-rated movies found.');
    }

    const movies = formatTopRatedMovies(data.results, limit);
    const result: TopRatedMoviesOutput = {
      movies,
      totalCount: data.results.length,
    };

    TopRatedMoviesOutputSchema.parse(result);
    const list = formatMoviesList(movies);
    const text = `Top Rated Movies (showing up to ${limit}):\n${list}`;

    return { ...successFormatter(text), data: result };
  };

export const topRatedMoviesToolDefinition: ToolDefinition = {
  config: {
    name: 'get_top_rated_movies',
    title: 'Get Top Rated Movies',
    description: 'Returns a list of top-rated movies.',
    inputSchema: TopRatedMoviesInputSchema.shape,
  },
  execute: executeTopRatedMovies,
};
