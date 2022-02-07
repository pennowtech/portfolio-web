import React, { useState, useEffect, useMemo } from 'react';

import { useTheme } from 'next-themes';
import Switch from 'react-switch';
import { IconContext } from 'react-icons';
import { FaMoon, FaSun } from 'react-icons/fa';

// const ThemeToggle1 = () => {
//   const { theme, setTheme } = useTheme();
//   return (
//     <button
//       aria-label="Toggle Dark Mode"
//       type="button"
//       className="p-3 h-12 w-12 order-2 md:order-3"
//       onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
//     />
//   );
// };

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme('light');

  const dark = theme === 'dark';

  const [checked, setChecked] = useState(dark);
  const [mounted, setMounted] = useState(false);

  const handleChange = (nextChecked) => {
    setChecked(nextChecked);
  };

  // When mounted on client, now we can show the UI
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    // if (checked) {
    //   document.documentElement.classList.add('dark');
    //   document.documentElement.style.cssText = 'color-scheme:dark';
    // } else {
    //   document.documentElement.classList.remove('dark');
    //   document.documentElement.style.cssText = 'color-scheme:light';
    // }
    setTheme(checked ? 'dark' : 'light');
    localStorage.setItem('pntDarkTheme', checked);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checked]);

  const dayButton = useMemo(() => ({
    color: 'gold',
    size: '80%',
  }), []);
  const moonButton = useMemo(() => ({
    color: 'white',
    size: '80%',
  }), []);

  if (!mounted) return null;

  return (
    <Switch
      onChange={handleChange}
      checked={checked}
      aria-label="switch between day and night themes"
      offColor="#555"
      onHandleColor="#eee"
      handleDiameter={20}
      uncheckedIcon={(
        <div className="flex justify-center items-center h-full">
          <IconContext.Provider
            value={dayButton}
          >
            <FaSun />
          </IconContext.Provider>
        </div>
      )}
      checkedIcon={(
        <div className="flex justify-center items-center h-full">
          <IconContext.Provider
            value={moonButton}
          >
            <FaMoon />
          </IconContext.Provider>
        </div>
      )}
      height={24}
      width={48}
    />
  );
};
export default ThemeToggle;
