import fetch from 'node-fetch';

export type MovieInfos = {
    title: string;
    year: string;
    description: string;
    author: string;
    source: string;
    imageUrl: string;
    length: string;
    rating: string;
};

type MovieGenre = { id: number; name: string };

type RawMovieInfos = {
    adult: boolean;
    genres: MovieGenre[];
    homepage: string; // 'http://www.foxmovies.com/movies/logan';
    id: 263115;
    imdb_id: string; // 'tt3315342';
    original_language: string; // 'en';
    original_title: string;
    overview: string;
    popularity: number; // 96.702;
    poster_path: string; //'/fnbjcRDYn6YviCcePDnGdyAkYsB.jpg';
    release_date: string; // '2017-02-28';
    budget: number; // 97000000;
    revenue: number; // 619021436;
    runtime: number; // 137;
    status: string; // 'Released';
    tagline: string;
    title: string;
    video: boolean;
    vote_average: number;
    vote_count: number;
};

type RawMovieCast = {
    name: string;
    job: string; // "Director"
    gender: number; // 2
    id: number; // 366,
    original_name: string;
    known_for_department: string;
    popularity: number;
    profile_path: string; // "/pk0GDjn99crNwR4qgCCEokDYd71.jpg",
    credit_id: string; // "5840b71ac3a36865af0003e8",
    department: string; // "Writing",
};

const TOKEN =
    'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJlYzQwY2FkYTAzY2Q2YTk0MzdiNTJhODI5ZDI1OWJjYyIsInN1YiI6IjU4ZGFhNWFhYzNhMzY4NDYzNzAwMTUxYiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.Pr1DoIt-zfsq5yGaTvhiE3bZtIjLPW_OiA_Tu5_8L3I';

async function getMovieDirector(id: number): Promise<string> {
    return fetch(`https://api.themoviedb.org/3/movie/${id}/credits`, {
        headers: { Authorization: 'Bearer ' + TOKEN },
    })
        .then(
            res =>
                res.json() as Promise<{
                    cast: RawMovieCast[];
                    crew: RawMovieCast[];
                }>
        )
        .then((res) => {
            for (const person of res.crew) {
                if (person.job.toLowerCase() === 'director') return person.name;
            }
            return '';
        });
}

async function getAllMovieInfos(id: number): Promise<RawMovieInfos> {
    return fetch(`https://api.themoviedb.org/3/movie/${id}`, {
        headers: { Authorization: 'Bearer ' + TOKEN },
    }).then(res => res.json() as Promise<RawMovieInfos>);
}

export async function getMovieInfos(movieName: string) {
    return fetch(
        `https://api.themoviedb.org/3/search/movie?language=en-US&query=${encodeURIComponent(
            movieName
        )}&include_adult=true`,
        {
            headers: {
                Authorization: 'Bearer ' + TOKEN,
            },
        }
    )
        .then(res => res.json())
        .then((res: { results: { id: number }[] }) => {
            return getAllMovieInfos(res.results[0].id);
        })
        .then(async raw => {
            const runtimeHours = Math.floor(raw.runtime / 60);
            const runtimeMins = raw.runtime % 60;
            let runtime = '';
            if (runtimeHours) {
                runtime = runtimeHours + ' hours '
            }
            if (runtimeMins) {
                runtime += runtimeMins + ' mins'
            }
            return {
                title: raw.title,
                year: 'Released in ' + raw.release_date.slice(0, 4),
                description: raw.overview,
                imageUrl: `https://www.themoviedb.org/t/p/w600_and_h900_bestv2/${raw.poster_path}`,
                rating: raw.vote_average + ' / 10',
                author: await getMovieDirector(raw.id),
                source: `https://www.imdb.com/title/${raw.imdb_id}`,
                length: runtime,
            };
        });
}
