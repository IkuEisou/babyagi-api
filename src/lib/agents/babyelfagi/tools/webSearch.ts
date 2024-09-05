export const webSearch = async (query: string) => {
  try {
    // Change environment variable name for typo
    if (!process.env.SERP_API_KEY && process.env.SEARP_API_KEY !== undefined) {
      throw new Error(
        'The environment variable name has been changed due to a typo: SEARP_API_KEY. Please fix it to SERP_API_KEY.',
      );
    }
    // console.log(`WebSearch for ${query}.`)
    if (process.env.SERP_API_KEY) {
      const response = await fetch(
        `https://serpapi.com/search?api_key=${process.env.SERP_API_KEY}&engine=google&q=${query}&num=10`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
      console.log('WebSearch by SERP API.');
      const data = await response.json();
      if (data.organic_results !== undefined) {
        return data.organic_results;
      }
    }
    if (
      process.env.GOOGLE_SEARCH_API_KEY &&
      process.env.GOOGLE_CUSTOM_INDEX_ID
    ) {
      console.log('WebSearch by Google Custom Search Engine.');
      const response = await fetch(
        `https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_SEARCH_API_KEY}&cx=${process.env.GOOGLE_CUSTOM_INDEX_ID}&q=${query}&num=${process.env.GOOGLE_RESULT_NUM}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
      if (response.headers.get('content-type')?.includes('text/event-stream')) {
        const reader = response.body?.getReader();
        if (!reader) return;

        let decoder = new TextDecoder();
        let stmData = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (!value) continue;
          const lines = decoder.decode(value);
          console.log('Stream data:' + lines);
          const text = lines.split('data: ')[1].trim();
          stmData = stmData + text;
          console.log('stmData:' + stmData);
        }
        return stmData;
      }
      const data = await response.json();
      // console.log(data);
      return data.items;
    }
  } catch (error) {
    console.log('WebSearch error: ', error);
    return;
  }
};

type SearchResult = {
  position: number;
  title: string;
  link: string;
  snippet: string;
};

export const simplifySearchResults = (searchResults: any[]): SearchResult[] => {
  if (!Array.isArray(searchResults)) {
    return [];
  }

  const simplifiedResults: SearchResult[] = [];
  searchResults.forEach((item, index) => {
    simplifiedResults.push({
      position: index,
      title: item.title,
      link: item.link,
      snippet: item.snippet,
    });
  });

  return simplifiedResults;
};
