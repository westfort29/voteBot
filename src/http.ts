import axios from 'axios';

const URL = "https://pixabay.com/api/?key=10475952-b00fff90aada76a86776caf63&safesearch=true&q="
const RUSSIAN_REG_EXP = /[а-яА-ЯЁё]/;

interface IFTImageResponse {
  totalHits: number;
  hits: IFTImage[];
  total: number
}

interface IFTImage {
  webformatURL: string,
  largeImageURL: string,
  webformatHeight: number,
  webformatWidth: number,
  likes: number,
  imageWidth: number,
  id: number,
  user_id: number,
  views: number,
  comments: number,
  pageURL: string,
  imageHeight: number,
  type: string,
  previewHeight: number,
  tags: string,
  downloads: number,
  user: string,
  favorites: number,
  imageSize: number,
  previewWidth: number,
  userImageURL: string,
  previewURL: string
}

export async function getImage(query: string) {
  let url = URL + normalizeQuery(query);
  url += RUSSIAN_REG_EXP.test(query) ? `&lang=ru` : '';
  return axios(url)
    .then((data: any) => data.data.hits[0] && data.data.hits[0].webformatURL)
    .catch((e) => {console.log(e); return '';})
}

function normalizeQuery(query: string): string {
  return encodeURI(query.trim().split(' ').join('+'));
}
