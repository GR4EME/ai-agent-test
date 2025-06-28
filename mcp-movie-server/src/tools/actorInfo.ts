import { PersonSearchResult, PersonDetails } from '../tmdbTypes.js';
import { ToolDefinition, validateInput, formatSuccess } from './baseTool.js';
import { TmdbClient } from '../utils/tmdbClient.js';
import {
  ActorInfoInputSchema,
  ActorInfoInput,
  ActorInfoOutputSchema,
  ActorInfoOutput,
} from './schemas.js';

const executeActorInfo =
  (tmdbClient: TmdbClient) =>
  async (
    input: unknown
  ): Promise<{
    content: Array<{ type: 'text'; text: string }>;
    isError?: boolean;
    data?: ActorInfoOutput;
  }> => {
    const validator = validateInput<ActorInfoInput>(ActorInfoInputSchema.shape);
    const successFormatter = formatSuccess('get_actor_info');

    const { name } = validator(input);
    const search = await tmdbClient<PersonSearchResult>('/search/person', { query: name });

    if (!search.results || search.results.length === 0) {
      return successFormatter(`No actor found for '${name}'.`);
    }

    const actor = search.results[0];
    const details = await tmdbClient<PersonDetails>(`/person/${actor.id}`, {});

    const result: ActorInfoOutput = {
      name: details.name,
      biography: details.biography || 'No biography available',
      birthDate: details.birthday,
      deathDate: details.deathday || undefined,
      placeOfBirth: details.place_of_birth || undefined,
      popularity: details.popularity,
      knownFor: [details.known_for_department || 'Acting'],
    };

    ActorInfoOutputSchema.parse(result);
    const text = `Name: ${result.name}\nBirthday: ${result.birthDate || 'Unknown'}\nKnown for: ${result.knownFor.join(', ')}\nBio: ${result.biography.substring(0, 500)}${result.biography.length > 500 ? '...' : ''}`;

    return { ...successFormatter(text), data: result };
  };

export const actorInfoToolDefinition: ToolDefinition = {
  config: {
    name: 'get_actor_info',
    title: 'Get Actor Information',
    description: 'Returns information about a specific actor by name.',
    inputSchema: ActorInfoInputSchema.shape,
  },
  execute: executeActorInfo,
};
