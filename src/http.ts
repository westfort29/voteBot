import axios from 'axios';

const IMG_API_KEY = 'vCZua7FQOHmshDmwmPLuOVEvxBJPp1vNDd5jsn9m38Zu8v89Bb';
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
  const res = await axios(
    {
      method: "GET",
      headers: {
        "X-Mashape-Key": IMG_API_KEY,
        "X-Mashape-Host": "contextualwebsearch-websearch-v1.p.mashape.com"
      },
      url: url
    }
  ).catch(() => {
    return{
      data: {
        value: [{url: ''}]
      }
    }
  })

    return await (res.data.value[0] && res.data.value[0].url);
}

function normalizeQuery(query: string): string {
  return query.trim().split(' ').join('+');
}
