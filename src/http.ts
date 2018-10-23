import axios from 'axios';

const IMG_API_KEY = 'vCZua7FQOHmshDmwmPLuOVEvxBJPp1vNDd5jsn9m38Zu8v89Bb';
const URL = "https://pixabay.com/api/?key=10475952-b00fff90aada76a86776caf63&safesearch=true&q="

interface IFTImageResponse {
  totalHits: number;
  hits: IFTImage[];
  total: number
}

interface IFTImage {
  webformatURL: string,
  largeImageURL: string
}

export async function getImage(query: string) {
  let url = URL + normalizeQuery(query);
  return axios(url)
  .then((data: any) => data.data.hits[0] && data.data.hits[0].webformatURL)
  .catch(() => '')
}

function normalizeQuery(query: string): string {
  return query.trim().split(' ').join('+');
}
