import { useEffect, useState } from "react";

export const usePriceConverter = () => {
  const [data, setData] = useState({});
  const URL = 'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd';
  const request = async () => {
    try {
      const response = await fetch(URL);
      const parsed = await response.json();
      setData(parsed);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    request();
  }, []);

  return {
    converterData: data,
  };
};
