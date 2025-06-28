import { PersonSearchResult, MovieCredit } from '../tmdbTypes.js';
import { ToolDefinition, validateInput, formatSuccess } from './baseTool.js';
import { TmdbClient } from '../utils/tmdbClient.js';
import {
  MoviesByActorInputSchema,
  MoviesByActorInput,
  MoviesByActorOutputSchema,
  MoviesByActorOutput,
} from './schemas.js';

interface MovieCastItem {
  title: string;
  release_date?: string;
}

const sortMoviesByReleaseDate = (movies: MovieCastItem[]) =>
  movies.sort((a, b) => {
    if (a.release_date && b.release_date) {
      return b.release_date.localeCompare(a.release_date);
    } else if (a.release_date) {
      return -1;
    } else if (b.release_date) {
      return 1;
    } else {
      return 0;
    }
  });

const formatMoviesOutput = (movies: MovieCastItem[]) =>
  movies.slice(0, 10).map((m) => ({
    title: m.title,
    releaseDate: m.release_date,
    rating: undefined,
    overview: undefined,
  }));

const executeMoviesByActor =
  (tmdbClient: TmdbClient) =>
  async (
    input: unknown
  ): Promise<{
    content: Array<{ type: 'text'; text: string }>;
    isError?: boolean;
    data?: MoviesByActorOutput;
  }> => {
    const validator = validateInput<MoviesByActorInput>(MoviesByActorInputSchema.shape);
    const successFormatter = formatSuccess('list_movies_by_actor');

    const { actor_name } = validator(input);
    const search = await tmdbClient<PersonSearchResult>('/search/person', { query: actor_name });

    if (!search.results || search.results.length === 0) {
      return successFormatter(`No actor found for '${actor_name}'.`);
    }

    const actor = search.results[0];
    const credits = await tmdbClient<MovieCredit>(`/person/${actor.id}/movie_credits`, {});

    if (!credits.cast || credits.cast.length === 0) {
      return successFormatter(`No movies found for actor '${actor_name}'.`);
    }

    const sortedMovies = sortMoviesByReleaseDate(credits.cast);
    const movies = formatMoviesOutput(sortedMovies);

    const result: MoviesByActorOutput = {
      actorName: actor.name,
      movies,
    };

    MoviesByActorOutputSchema.parse(result);
    const list = movies
      .map((m) => `${m.title} (${m.releaseDate?.substring(0, 4) || 'Unknown'})`)
      .join('\n');

    const text = `Movies for ${result.actorName} (showing up to 10):\n${list}`;

    return { ...successFormatter(text), data: result };
  };

export const moviesByActorToolDefinition: ToolDefinition = {
  config: {
    name: 'list_movies_by_actor',
    title: 'List Movies by Actor',
    description: 'Returns a list of movies for a given actor name.',
    inputSchema: MoviesByActorInputSchema.shape,
  },
  execute: executeMoviesByActor,
};
