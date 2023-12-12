import { useState, useEffect } from 'react';

function useExampleHook(initialValue: number) {

  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    console.log('Effect in useExampleHook');
    return () => {
      console.log('Cleanup in useExampleHook');
    };
  }, [value]);

  const increment = () => {
    setValue((prevValue) => prevValue + 1);
  };

  return {
    value,
    increment,
  };
}

export default useExampleHook;