import { z } from 'zod';

// Movie Info
export const MovieInfoInputSchema = z.object({
  title: z.string().min(1).describe('The title of the movie to look up.'),
});
export type MovieInfoInput = z.infer<typeof MovieInfoInputSchema>;

export const MovieInfoOutputSchema = z.object({
  title: z.string(),
  release: z.string(),
  overview: z.string(),
  rating: z.number(),
  genres: z.array(z.string()),
});
export type MovieInfoOutput = z.infer<typeof MovieInfoOutputSchema>;

// Actor Info
export const ActorInfoInputSchema = z.object({
  name: z.string().min(1).describe('The name of the actor to look up.'),
});
export type ActorInfoInput = z.infer<typeof ActorInfoInputSchema>;

export const ActorInfoOutputSchema = z.object({
  name: z.string(),
  biography: z.string(),
  birthDate: z.string().optional(),
  deathDate: z.string().optional(),
  placeOfBirth: z.string().optional(),
  popularity: z.number(),
  knownFor: z.array(z.string()),
});
export type ActorInfoOutput = z.infer<typeof ActorInfoOutputSchema>;

// Movies by Actor
export const MoviesByActorInputSchema = z.object({
  actor_name: z.string().min(1).describe('The name of the actor to find movies for.'),
});
export type MoviesByActorInput = z.infer<typeof MoviesByActorInputSchema>;

export const MoviesByActorOutputSchema = z.object({
  actorName: z.string(),
  movies: z.array(z.object({
    title: z.string(),
    releaseDate: z.string().optional(),
    rating: z.number().optional(),
    overview: z.string().optional(),
  })),
});
export type MoviesByActorOutput = z.infer<typeof MoviesByActorOutputSchema>;

// Top Rated Movies
export const TopRatedMoviesInputSchema = z.object({
  limit: z.number().min(1).max(50).optional().describe('Number of movies to return (default: 10, max: 50).'),
});
export type TopRatedMoviesInput = z.infer<typeof TopRatedMoviesInputSchema>;

export const TopRatedMoviesOutputSchema = z.object({
  movies: z.array(z.object({
    title: z.string(),
    releaseDate: z.string().optional(),
    rating: z.number(),
    overview: z.string().optional(),
  })),
  totalCount: z.number(),
});
export type TopRatedMoviesOutput = z.infer<typeof TopRatedMoviesOutputSchema>;

// Add similar schemas for other tools as needed 