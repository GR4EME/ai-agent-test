import { PersonSearchResult, MovieCredit } from '../tmdbTypes.js';
import { BaseTool } from './baseTool.js';
import { TmdbClient } from '../utils/tmdbClient.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { MoviesByActorInputSchema, MoviesByActorInput, MoviesByActorOutputSchema, MoviesByActorOutput } from './schemas.js';

export class MoviesByActorTool extends BaseTool {
  constructor(tmdbFetch: TmdbClient) {
    super(tmdbFetch, {
      name: 'list_movies_by_actor',
      title: 'List Movies by Actor',
      description: 'Returns a list of movies for a given actor name.',
      inputSchema: MoviesByActorInputSchema.shape,
    });
  }

  async execute(input: unknown): Promise<{ content: Array<{ type: 'text'; text: string }>; isError?: boolean; data?: MoviesByActorOutput }> {
    const { actor_name } = this.validateInput<MoviesByActorInput>(input);

    const search = await this.tmdbFetch<PersonSearchResult>('/search/person', { query: actor_name });
    if (!search.results || search.results.length === 0) {
      return this.formatSuccess(`No actor found for '${actor_name}'.`);
    }

    const actor = search.results[0];
    const credits = await this.tmdbFetch<MovieCredit>(`/person/${actor.id}/movie_credits`, {});
    
    if (!credits.cast || credits.cast.length === 0) {
      return this.formatSuccess(`No movies found for actor '${actor_name}'.`);
    }

    // Sort by release date descending and filter out movies without release dates
    const movies = credits.cast
      .sort((a, b) => {
        // Sort by release date descending, with undefined/null dates at the end
        if (a.release_date && b.release_date) {
          return b.release_date.localeCompare(a.release_date);
        } else if (a.release_date) {
          return -1; // a has a date, b does not, so a comes first
        } else if (b.release_date) {
          return 1; // b has a date, a does not, so b comes first
        } else {
          return 0; // Neither has a date, maintain original order
        }
      })
      .slice(0, 10)
      .map((m) => ({
        title: m.title,
        releaseDate: m.release_date,
        rating: undefined, // Not available in MovieCredit
        overview: undefined, // Not available in MovieCredit
      }));

    const result: MoviesByActorOutput = {
      actorName: actor.name,
      movies,
    };

    // Validate output
    MoviesByActorOutputSchema.parse(result);

    const list = movies
      .map((m) => `${m.title} (${m.releaseDate?.substring(0, 4) || 'Unknown'})`)
      .join('\n');

    const text = `Movies for ${result.actorName} (showing up to 10):\n${list}`;
    
    return { ...this.formatSuccess(text), data: result };
  }
}

 