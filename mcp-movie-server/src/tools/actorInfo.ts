import { PersonSearchResult, PersonDetails } from '../tmdbTypes.js';
import { BaseTool } from './baseTool.js';
import { TmdbClient } from '../utils/tmdbClient.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ActorInfoInputSchema, ActorInfoInput, ActorInfoOutputSchema, ActorInfoOutput } from './schemas.js';

export class ActorInfoTool extends BaseTool {
  constructor(tmdbFetch: TmdbClient) {
    super(tmdbFetch, {
      name: 'get_actor_info',
      title: 'Get Actor Information',
      description: 'Returns information about a specific actor by name.',
      inputSchema: ActorInfoInputSchema.shape,
    });
  }

  async execute(input: unknown): Promise<{ content: Array<{ type: 'text'; text: string }>; isError?: boolean; data?: ActorInfoOutput }> {
    const { name } = this.validateInput<ActorInfoInput>(input);

    const search = await this.tmdbFetch<PersonSearchResult>('/search/person', { query: name });
    if (!search.results || search.results.length === 0) {
      return this.formatSuccess(`No actor found for '${name}'.`);
    }

    const actor = search.results[0];
    const details = await this.tmdbFetch<PersonDetails>(`/person/${actor.id}`, {});
    
    const result: ActorInfoOutput = {
      name: details.name,
      biography: details.biography || 'No biography available',
      birthDate: details.birthday,
      deathDate: details.deathday || undefined,
      placeOfBirth: details.place_of_birth || undefined,
      popularity: details.popularity,
      knownFor: [details.known_for_department || 'Acting'],
    };

    // Validate output
    ActorInfoOutputSchema.parse(result);

    const text = `Name: ${result.name}\nBirthday: ${result.birthDate || 'Unknown'}\nKnown for: ${result.knownFor.join(', ')}\nBio: ${result.biography.substring(0, 500)}${result.biography.length > 500 ? '...' : ''}`;
    
    return { ...this.formatSuccess(text), data: result };
  }
}

 