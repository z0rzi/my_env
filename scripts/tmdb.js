var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import fetch from 'node-fetch';
const TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJlYzQwY2FkYTAzY2Q2YTk0MzdiNTJhODI5ZDI1OWJjYyIsInN1YiI6IjU4ZGFhNWFhYzNhMzY4NDYzNzAwMTUxYiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.Pr1DoIt-zfsq5yGaTvhiE3bZtIjLPW_OiA_Tu5_8L3I';
function getMovieDirector(id) {
    return __awaiter(this, void 0, void 0, function* () {
        return fetch(`https://api.themoviedb.org/3/movie/${id}/credits`, {
            headers: { Authorization: 'Bearer ' + TOKEN },
        })
            .then(res => res.json())
            .then(res => {
            for (const person of res.crew) {
                if (person.job.toLowerCase() === 'director')
                    return person.name;
            }
            return '';
        });
    });
}
function getAllMovieInfos(id) {
    return __awaiter(this, void 0, void 0, function* () {
        return fetch(`https://api.themoviedb.org/3/movie/${id}`, {
            headers: { Authorization: 'Bearer ' + TOKEN },
        }).then(res => res.json());
    });
}
export function getMovieInfos(movieName) {
    return __awaiter(this, void 0, void 0, function* () {
        let year = '';
        try {
            year = movieName.match(/ y:\d+/g)[0].slice(3);
            movieName = movieName.replace(/ y:\d+/g, '');
        }
        catch (err) { }
        return fetch(`https://api.themoviedb.org/3/search/movie?language=en-US&query=${encodeURIComponent(movieName)}&year=${year}&include_adult=true`, {
            headers: {
                Authorization: 'Bearer ' + TOKEN,
            },
        })
            .then(res => res.json())
            .then((res) => {
            return getAllMovieInfos(res.results[0].id);
        })
            .then((raw) => __awaiter(this, void 0, void 0, function* () {
            const runtimeHours = Math.floor(raw.runtime / 60);
            const runtimeMins = raw.runtime % 60;
            let runtime = '';
            if (runtimeHours) {
                runtime = runtimeHours + ' hours ';
            }
            if (runtimeMins) {
                runtime += runtimeMins + ' mins';
            }
            return {
                title: raw.title,
                year: 'Released in ' + raw.release_date.slice(0, 4),
                description: raw.overview,
                imageUrl: `https://www.themoviedb.org/t/p/w600_and_h900_bestv2/${raw.poster_path}`,
                rating: raw.vote_average + ' / 10',
                author: yield getMovieDirector(raw.id),
                source: `https://www.imdb.com/title/${raw.imdb_id}`,
                length: runtime,
            };
        }));
    });
}
