import {
	makeProviders,
	makeStandardFetcher,
	targets,
} from '@movie-web/providers';

import { MovieDetails, SeasonDetails, SeriesDetails } from './types';

const tmdbBase = 'https://api.themoviedb.org/3';

const providers = makeProviders({
	fetcher: makeStandardFetcher(fetch),
	target: targets.NATIVE,
});

const titleId = prompt('Enter TMDB ID: ');
const isMovie = prompt('Is this a movie? (y/n) ');
if (isMovie === 'y' || isMovie === 'Y' || isMovie === null) {
	const movieInfoRes = await fetch(`${tmdbBase}/movie/${titleId}`, {
		headers: {
			Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
		},
	});
	const movieInfo: MovieDetails = await movieInfoRes.json();

	console.log(`Downloading "${movieInfo.title}"`);

	const media = await providers.runAll({
		media: {
			type: 'movie',
			title: movieInfo.title,
			releaseYear: new Date(movieInfo.release_date).getFullYear(),
			tmdbId: movieInfo.id.toString(),
		},
	});

	console.log(media);
} else {
	const season = prompt('Enter season number: ');
	const episode = prompt('Enter episode number: ');

	if (!season || !episode) throw new Error('Invalid season or episode number');

	const seriesInfoRes = await fetch(`${tmdbBase}/tv/${titleId}`, {
		headers: {
			Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
		},
	});
	const seriesInfo: SeriesDetails = await seriesInfoRes.json();

	const seasonInfoRes = await fetch(
		`${tmdbBase}/tv/${titleId}/season/${season}`,
		{
			headers: {
				Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
			},
		}
	);

	const seasonInfo: SeasonDetails = await seasonInfoRes.json();

	console.log(`Downloading "${seriesInfo.name}: S${season} E${episode}"`);

	const episodeNumber = seasonInfo.episodes.find(
		(e) => e.episode_number === parseInt(episode)
	)?.episode_number;

	const episodeId = seasonInfo.episodes.find(
		(e) => e.episode_number === parseInt(episode)
	)?.id;

	if (!episodeNumber || !episodeId) throw new Error('Invalid episode number');

	const media = await providers.runAll({
		media: {
			type: 'show',
			title: seriesInfo.name,
			releaseYear: new Date(seriesInfo.first_air_date).getFullYear(),
			tmdbId: seriesInfo.id.toString(),
			season: {
				number: seasonInfo.season_number,
				tmdbId: seasonInfo.id.toString(),
			},
			episode: {
				number: episodeNumber,
				tmdbId: episodeId.toString(),
			},
		},
	});

	console.log(media);
}
