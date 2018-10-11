import axios from 'axios';

const IMG_API_KEY = process.env.IMG_API_MASHAPE_KEY || '';
const URL = "https://contextualwebsearch-websearch-v1.p.mashape.com/api/Search/ImageSearchAPI?count=1&autoCorrect=true&q="

interface IFTImageResponse {
  _type: string;
  value: IFTImage[];
}

interface IFTImage {
  url: string,
  height: number,
  width: number,
  thumbnail: string,
  thumbnailHeight: number,
  thumbnailWidth: number,
  base64Encoding: any
}

export async function getImage(query: string) {
  let url = URL + normalizeQuery(query);

  try {
    const res = await axios(
      {
        method: "GET",
        headers: {
          "X-Mashape-Key": IMG_API_KEY,
          "X-Mashape-Host": "contextualwebsearch-websearch-v1.p.mashape.com"
        },
        url: url
      }
    ).catch((e) => {
      return {
        data: {
          value: [
            {url: ''}
          ]
        }
      }
    });

    return await (res.data.value[0] && res.data.value[0].url || '').catch(()=>'');
  } catch(e) {
    console.log(e);
    return '';
  }
}

function normalizeQuery(query: string): string {
  return encodeURIComponent(query.trim().split(' ').join('+'));
}
