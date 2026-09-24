import React, { createContext, useContext, useState, useEffect } from 'react';

export const CITIES = ['Jaipur', 'Delhi', 'Mumbai', 'Bengaluru', 'Hyderabad', 'Pune', 'Chennai', 'Kolkata'];

const CityContext = createContext();

export const CityProvider = ({ children }) => {
  const [city, setCity] = useState(() => localStorage.getItem('cinevault_city') || 'Jaipur');
  useEffect(() => {
    localStorage.setItem('cinevault_city', city);
  }, [city]);
  return (
    <CityContext.Provider value={{ city, setCity, cities: CITIES }}>
      {children}
    </CityContext.Provider>
  );
};

export const useCity = () => {
  const ctx = useContext(CityContext);
  if (!ctx) throw new Error('useCity must be used within CityProvider');
  return ctx;
};