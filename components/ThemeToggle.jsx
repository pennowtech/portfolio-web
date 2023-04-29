import React, { useState, useEffect, useMemo } from 'react';

import { useTheme } from 'next-themes';
import Switch from 'react-switch';
import { IconContext } from 'react-icons';
import { FaMoon, FaSun } from 'react-icons/fa';

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme('light');
  const [checked, setChecked] = useState(theme === 'dark');
  const [mounted, setMounted] = useState(false);

  const dayButton = useMemo(
    () => ({
      color: 'gold',
      size: '80%',
    }),
    [],
  );
  const moonButton = useMemo(
    () => ({
      color: 'white',
      size: '80%',
    }),
    [],
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setTheme(checked ? 'dark' : 'light');
    localStorage.setItem('pntDarkTheme', checked);
  }, [checked, setTheme]);

  if (!mounted) {
    return null;
  }

  return (
    <Switch
      className="flex items-center"
      onChange={setChecked}
      checked={checked}
      aria-label="switch between day and night themes"
      height={20}
      borderRadius={20}
      offColor="#555"
      onHandleColor="#eee"
      uncheckedIcon={(
        <div className="flex justify-center items-center h-full">
          <IconContext.Provider value={dayButton}>
            <FaSun />
          </IconContext.Provider>
        </div>
        )}
      checkedIcon={(
        <div className="flex justify-center items-center h-full">
          <IconContext.Provider value={moonButton}>
            <FaMoon />
          </IconContext.Provider>
        </div>
        )}
    />
  );
};

export default ThemeToggle;
